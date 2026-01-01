package server.net;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.Socket;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import org.bson.Document;
import org.bson.types.ObjectId;

import com.mongodb.client.model.Filters;

import common.JsonUtil;
import common.Protocol;
import server.db.MongoManager;
import server.repo.ClearMarkerRepository;
import server.repo.GroupRepository;
import server.repo.MessageRepository;
import server.repo.UserRepository;

/**
 * One connected client session (server-side).
 * JSON-over-lines using Protocol + JsonUtil.
 *
 * Includes:
 * - signup/login/logout
 * - users list + online list (based on ONLINE sessions)
 * - broadcast/private/group messaging + history
 * - typing indicator
 *
 * Clear-for-me:
 * - Client sends: {type:"clear_chat", scope:"broadcast|private|group|all",
 * with?, groupId?}
 * - Server stores marker and history endpoints filter messages using markers.
 */
public class ClientHandler implements Runnable {

  // Online sessions: username -> handler
  private static final ConcurrentHashMap<String, ClientHandler> ONLINE = new ConcurrentHashMap<>();

  private static final int HISTORY_LIMIT = 500;

  // Basic limits
  private static final int MAX_USERNAME = 50;
  private static final int MAX_PASS = 200;
  private static final int MAX_CONTENT = 2000;
  private static final int MAX_GROUP_NAME = 60;
  private static final int MAX_GROUP_MEMBERS = 100;

  private final Socket socket;
  private PrintWriter out;
  private BufferedReader in;

  private final Object sendLock = new Object();

  private String username; // set after auth success

  public ClientHandler(Socket socket) {
    this.socket = socket;
  }

  @Override
  public void run() {
    try {
      in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
      out = new PrintWriter(socket.getOutputStream(), true);

      // First message MUST be signup/login JSON
      JsonObject first = JsonUtil.readObject(in);
      if (!handleAuth(first))
        return;

      // Main loop
      while (true) {
        JsonObject req = JsonUtil.readObject(in);
        if (req == null)
          break;

        String type = Protocol.typeOf(req);
        if (type == null) {
          send(Protocol.error("Missing type"));
          continue;
        }

        switch (type) {
          case Protocol.EXIT -> {
            return;
          }

          case Protocol.GET_USERS -> sendUserListToMe();

          case Protocol.GET_BROADCAST_HISTORY -> {
            // IMPORTANT: filtered by clear markers
            send(Protocol.broadcastHistory(
                MessageRepository.loadBroadcastHistoryForUser(username, HISTORY_LIMIT)));
          }

          case Protocol.GET_PRIVATE_HISTORY -> {
            String with = cleanUsername(Protocol.getString(req, Protocol.WITH));
            if (with == null) {
              send(Protocol.error("Missing/invalid 'with' username"));
              break;
            }

            // IMPORTANT: filtered by clear markers (for this user)
            send(Protocol.privateHistory(with,
                MessageRepository.loadPrivateHistoryForUser(username, with, HISTORY_LIMIT)));
          }

          case Protocol.BROADCAST -> {
            String content = cleanContent(Protocol.getString(req, "content"));
            if (content == null) {
              send(Protocol.error("Empty message"));
              break;
            }

            String formatted = MessageRepository.saveBroadcastAndFormat(username, content);
            if (formatted != null)
              broadcastToAll(Protocol.broadcastMsg(formatted));
          }

          case Protocol.PRIVATE -> {
            String to = cleanUsername(Protocol.getString(req, "to"));
            String content = cleanContent(Protocol.getString(req, "content"));

            if (to == null || content == null) {
              send(Protocol.error("Private needs: to + content"));
              break;
            }
            if (to.equals(username)) {
              send(Protocol.error("Cannot message yourself"));
              break;
            }

            MessageRepository.savePrivate(username, to, content);

            String formatted = "[" + java.time.LocalDateTime.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) + "] "
                + username + ": " + content;

            ClientHandler target = ONLINE.get(to);
            if (target != null) {
              target.send(Protocol.privateMsg(username, formatted));
              send(Protocol.ack("Delivered to " + to));
            } else {
              send(Protocol.ack(to + " is offline (saved)"));
            }
          }

          case Protocol.TYPING -> {
            String to = cleanUsername(Protocol.getString(req, "to"));
            String state = Protocol.getString(req, "state");
            if (to == null || state == null)
              break;

            state = state.trim().toLowerCase();
            if (!("start".equals(state) || "stop".equals(state)))
              break;

            ClientHandler target = ONLINE.get(to);
            if (target != null && !to.equals(username)) {
              target.send(Protocol.typing(username, state));
            }
          }

          // ---------------- GROUPS ----------------

          case Protocol.CREATE_GROUP -> {
            String name = cleanGroupName(Protocol.getString(req, "name"));
            JsonArray membersArr = req.getAsJsonArray("members");
            if (name == null) {
              send(Protocol.groupCreatedFail("Invalid group name"));
              break;
            }

            List<String> members = new ArrayList<>();
            if (membersArr != null) {
              for (JsonElement e : membersArr) {
                if (e == null || e.isJsonNull())
                  continue;
                String u = cleanUsername(e.getAsString());
                if (u != null && !u.equals(username) && !members.contains(u)) {
                  members.add(u);
                  if (members.size() >= MAX_GROUP_MEMBERS)
                    break;
                }
              }
            }

            String groupId = GroupRepository.createGroup(name, username, members);
            if (groupId == null) {
              send(Protocol.groupCreatedFail("Failed to create group"));
              break;
            }

            send(Protocol.groupCreatedOk(groupId, name));

            // update groups list for online members
            for (String m : getGroupMembers(groupId)) {
              ClientHandler h = ONLINE.get(m);
              if (h != null)
                h.sendGroupsToSelf();
            }
          }

          case Protocol.GET_GROUPS -> sendGroupsToSelf();

          case Protocol.GET_GROUP_HISTORY -> {
            String groupId = Protocol.getString(req, Protocol.GROUP_ID);
            if (groupId == null || groupId.isBlank()) {
              send(Protocol.error("Missing groupId"));
              break;
            }

            if (!GroupRepository.isMember(groupId, username)) {
              send(Protocol.error("Not a member of this group"));
              break;
            }

            // IMPORTANT: filtered by clear markers (for this user)
            send(Protocol.groupHistory(groupId,
                GroupRepository.loadGroupHistoryForUser(username, groupId, HISTORY_LIMIT)));
          }

          case Protocol.GROUP_MESSAGE -> {
            String groupId = Protocol.getString(req, Protocol.GROUP_ID);
            String content = cleanContent(Protocol.getString(req, "content"));

            if (groupId == null || groupId.isBlank() || content == null) {
              send(Protocol.error("Group message needs: groupId + content"));
              break;
            }

            if (!GroupRepository.isMember(groupId, username)) {
              send(Protocol.error("Not a member of this group"));
              break;
            }

            GroupRepository.saveGroupMessage(groupId, username, content);

            String formatted = GroupRepository.formatNow(username, content);
            for (String member : getGroupMembers(groupId)) {
              ClientHandler h = ONLINE.get(member);
              if (h != null)
                h.send(Protocol.groupMsg(groupId, formatted));
            }
          }

          // ---------------- CLEAR FOR ME ----------------

          case Protocol.CLEAR_CHAT -> {
            try {
              handleClearChat(req);
            } catch (Exception ex) {
              System.err.println("clear_chat failed for user=" + username + " : " + ex.getMessage());
              ex.printStackTrace();

              // IMPORTANT: do NOT kill the socket/session
              send(Protocol.clearResultFail("Clear failed (server error)"));
            }
          }

          default -> send(Protocol.error("Unknown type: " + type));
        }
      }
    } catch (Exception e) {
      System.err.println("ClientHandler error: " + e.getMessage());
      e.printStackTrace();
    } finally {
      cleanup();
    }
  }

  private void handleClearChat(JsonObject req) {
    String scope = Protocol.getString(req, Protocol.SCOPE);
    if (scope == null) {
      send(Protocol.clearResultFail("Missing scope"));
      return;
    }

    scope = scope.trim().toLowerCase();

    switch (scope) {
      case "all" -> {
        long t = ClearMarkerRepository.setClearedAtNow(username, "all", "");
        send(Protocol.clearResultOk("all", null, null, t));
      }

      case "broadcast" -> {
        long t = ClearMarkerRepository.setClearedAtNow(username, "broadcast", "");
        send(Protocol.clearResultOk("broadcast", null, null, t));
      }

      case "private" -> {
        String with = cleanUsername(Protocol.getString(req, Protocol.WITH));
        if (with == null) {
          send(Protocol.clearResultFail("Missing/invalid 'with'"));
          return;
        }
        long t = ClearMarkerRepository.setClearedAtNow(username, "private", with);
        send(Protocol.clearResultOk("private", with, null, t));
      }

      case "group" -> {
        String groupId = Protocol.getString(req, Protocol.GROUP_ID);
        if (groupId == null || groupId.isBlank()) {
          send(Protocol.clearResultFail("Missing groupId"));
          return;
        }
        if (!GroupRepository.isMember(groupId, username)) {
          send(Protocol.clearResultFail("Not a member of this group"));
          return;
        }
        long t = ClearMarkerRepository.setClearedAtNow(username, "group", groupId.trim());
        send(Protocol.clearResultOk("group", null, groupId.trim(), t));
      }

      default -> send(Protocol.clearResultFail("Invalid scope: " + scope));
    }
  }

  // ---------------- Auth ----------------

  private boolean handleAuth(JsonObject req) {
    if (req == null) {
      safeClose();
      return false;
    }

    String type = Protocol.typeOf(req);
    String user = cleanUsername(Protocol.getString(req, Protocol.USER));
    String pass = cleanPass(Protocol.getString(req, Protocol.PASS));

    if (type == null || user == null || pass == null) {
      send(Protocol.authFail("Bad auth request"));
      safeClose();
      return false;
    }

    boolean ok;
    if (Protocol.SIGNUP.equals(type)) {
      ok = UserRepository.signUp(user, pass) && UserRepository.login(user, pass);
    } else if (Protocol.LOGIN.equals(type)) {
      ok = UserRepository.login(user, pass);
    } else {
      send(Protocol.authFail("First message must be signup/login"));
      safeClose();
      return false;
    }

    if (!ok) {
      send(Protocol.authFail("Invalid credentials / user exists"));
      safeClose();
      return false;
    }

    ClientHandler old = ONLINE.put(user, this);
    if (old != null && old != this)
      old.kick("Logged in from another session");

    username = user;
    UserRepository.markOnline(username);

    send(Protocol.authOk(username));

    // initial payloads
    sendUserListToMe();
    sendGroupsToSelf();
    broadcastUserListToAll();

    return true;
  }

  private void kick(String reason) {
    send(Protocol.error(reason));
    cleanup();
  }

  // ---------------- Users list ----------------

  private void sendUserListToMe() {
    var all = UserRepository.getAllUsernamesExcept(username);

    var online = new ArrayList<>(ONLINE.keySet());
    online.remove(username);

    send(Protocol.users(all, online));
  }

  private static void broadcastUserListToAll() {
    var onlineSnapshot = new ArrayList<>(ONLINE.keySet());

    ONLINE.forEach((user, handler) -> {
      var all = UserRepository.getAllUsernamesExcept(user);

      var onlineForThisClient = new ArrayList<>(onlineSnapshot);
      onlineForThisClient.remove(user);

      handler.send(Protocol.users(all, onlineForThisClient));
    });
  }

  // ---------------- Groups list ----------------

  private void sendGroupsToSelf() {
    JsonArray groupsArr = new JsonArray();

    for (Document g : GroupRepository.listGroupsForUser(username)) {
      JsonObject item = new JsonObject();
      ObjectId id = g.getObjectId("_id");
      item.addProperty("groupId", id == null ? "" : id.toHexString());
      item.addProperty("name", g.getString("name"));
      groupsArr.add(item);
    }

    send(Protocol.groups(groupsArr));
  }

  // ---------------- Sending helpers ----------------

  private void send(JsonObject obj) {
    if (obj == null)
      return;
    synchronized (sendLock) {
      JsonUtil.send(out, obj);
    }
  }

  private static void broadcastToAll(JsonObject obj) {
    ONLINE.forEach((u, handler) -> handler.send(obj));
  }

  // ---------------- Cleanup ----------------

  private void cleanup() {
    try {
      if (username != null) {
        ONLINE.remove(username, this);
        UserRepository.markOffline(username);
        broadcastUserListToAll();
      }
    } catch (Exception ignored) {
    }

    safeClose();
  }

  private void safeClose() {
    try {
      if (in != null)
        in.close();
    } catch (Exception ignored) {
    }
    try {
      if (out != null)
        out.close();
    } catch (Exception ignored) {
    }
    try {
      if (socket != null && !socket.isClosed())
        socket.close();
    } catch (Exception ignored) {
    }
  }

  // ---------------- Validation helpers ----------------

  private static String cleanUsername(String u) {
    if (u == null)
      return null;
    u = u.trim();
    if (u.isEmpty())
      return null;
    if (u.length() > MAX_USERNAME)
      u = u.substring(0, MAX_USERNAME);
    return u;
  }

  private static String cleanPass(String p) {
    if (p == null)
      return null;
    p = p.trim();
    if (p.isEmpty())
      return null;
    if (p.length() > MAX_PASS)
      p = p.substring(0, MAX_PASS);
    return p;
  }

  private static String cleanGroupName(String s) {
    if (s == null)
      return null;
    s = s.trim();
    if (s.isEmpty())
      return null;
    if (s.length() > MAX_GROUP_NAME)
      s = s.substring(0, MAX_GROUP_NAME);
    return s;
  }

  private static String cleanContent(String s) {
    if (s == null)
      return null;
    s = s.replaceAll("[\\r\\n]+", " ").trim();
    if (s.isEmpty())
      return null;
    if (s.length() > MAX_CONTENT)
      s = s.substring(0, MAX_CONTENT);
    return s;
  }

  /** Load group members from MongoDB. */
  private static List<String> getGroupMembers(String groupId) {
    List<String> members = new ArrayList<>();
    ObjectId gid;
    try {
      gid = new ObjectId(groupId.trim());
    } catch (Exception e) {
      return members;
    }

    Document g = MongoManager.groups()
        .find(Filters.eq("_id", gid))
        .projection(new Document("members", 1))
        .first();

    if (g == null)
      return members;

    @SuppressWarnings("unchecked")
    List<String> list = (List<String>) g.get("members");
    if (list != null)
      members.addAll(list);

    return members;
  }
}