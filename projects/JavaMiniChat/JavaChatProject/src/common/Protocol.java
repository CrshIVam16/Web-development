package common;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

/**
 * Protocol = message types + helpers.
 * One JSON object per line over the socket.
 *
 * Clear-for-me (Step 3):
 * - Client -> Server: clear_chat
 * - Server -> Client: clear_result
 *
 * clear_chat request:
 *   { "type":"clear_chat", "scope":"broadcast" }
 *   { "type":"clear_chat", "scope":"private", "with":"User2" }
 *   { "type":"clear_chat", "scope":"group", "groupId":"..." }
 *   { "type":"clear_chat", "scope":"all" }
 *
 * clear_result response:
 *   { "type":"clear_result", "ok":true, "scope":"private", "with":"User2", "clearedAt": 1730000000000 }
 */
public final class Protocol {

  private Protocol() {}

  // Common JSON keys
  public static final String TYPE = "type";
  public static final String OK = "ok";

  public static final String USER = "user";
  public static final String PASS = "pass";

  // (Profile keys still present; we can remove later when you drop displayName/avatar fully)
  public static final String DISPLAY_NAME = "displayName";
  public static final String AVATAR = "avatar"; // Base64 string (optional)

  // Online usernames for green dot UI
  public static final String ONLINE = "online";

  // Incoming (Client -> Server)
  public static final String SIGNUP = "signup";
  public static final String LOGIN = "login";
  public static final String EXIT = "exit";

  public static final String GET_USERS = "get_users";
  public static final String GET_BROADCAST_HISTORY = "get_broadcast_history";
  public static final String GET_PRIVATE_HISTORY = "get_private_history"; // needs: with

  public static final String BROADCAST = "broadcast"; // needs: content
  public static final String PRIVATE = "private";     // needs: to, content
  public static final String TYPING = "typing";       // needs: to, state(start/stop)

  // Group chats (client -> server)
  public static final String CREATE_GROUP = "create_group";             // needs: name, members[]
  public static final String GET_GROUPS = "get_groups";                 // list groups for user
  public static final String GET_GROUP_HISTORY = "get_group_history";   // needs: groupId
  public static final String GROUP_MESSAGE = "group_message";           // needs: groupId, content

  // NEW: Clear-for-me
  public static final String CLEAR_CHAT = "clear_chat";                 // needs: scope + (with/groupId)
  public static final String SCOPE = "scope";                           // "broadcast" | "private" | "group" | "all"
  public static final String CLEARED_AT = "clearedAt";                  // epoch millis
  public static final String WITH = "with";
  public static final String GROUP_ID = "groupId";

  // Outgoing (Server -> Client)
  public static final String AUTH = "auth";                             // ok, user?, error?
  public static final String USERS = "users";                           // list[], online[]
  public static final String BROADCAST_HISTORY = "broadcast_history";   // messages[]
  public static final String PRIVATE_HISTORY = "private_history";       // with, messages[]
  public static final String BROADCAST_MSG = "broadcast_msg";           // message
  public static final String PRIVATE_MSG = "private_msg";               // from, message
  public static final String ERROR = "error";                           // message
  public static final String ACK = "ack";                               // message

  // Group chats (server -> client)
  public static final String GROUPS = "groups";                         // groups[]
  public static final String GROUP_CREATED = "group_created";           // ok, groupId, name, error?
  public static final String GROUP_HISTORY = "group_history";           // groupId, messages[]
  public static final String GROUP_MSG = "group_msg";                   // groupId, message

  // NEW: Clear-for-me response
  public static final String CLEAR_RESULT = "clear_result";             // ok, scope, clearedAt, with?/groupId?, error?

  // ---------------- Builders ----------------

  public static JsonObject authOk(String user) {
    JsonObject o = obj(AUTH);
    o.addProperty(OK, true);
    o.addProperty(USER, user);
    return o;
  }

  public static JsonObject authFail(String error) {
    JsonObject o = obj(AUTH);
    o.addProperty(OK, false);
    o.addProperty("error", error);
    return o;
  }

  /**
   * USERS payload:
   * list can be either:
   * - array of strings: ["u1","u2"]
   * - OR array of objects (optional future)
   */
  public static JsonObject users(JsonArray list, java.util.List<String> onlineUsers) {
    JsonObject o = obj(USERS);
    o.add("list", list == null ? new JsonArray() : list);
    o.add(ONLINE, toJsonArray(onlineUsers));
    return o;
  }

  /** Backward-compatible: usernames only. */
  public static JsonObject users(java.util.List<String> usernames, java.util.List<String> onlineUsers) {
    JsonObject o = obj(USERS);
    o.add("list", toJsonArray(usernames));
    o.add(ONLINE, toJsonArray(onlineUsers));
    return o;
  }

  public static JsonObject broadcastHistory(java.util.List<String> messages) {
    JsonObject o = obj(BROADCAST_HISTORY);
    o.add("messages", toJsonArray(messages));
    return o;
  }

  public static JsonObject privateHistory(String withUser, java.util.List<String> messages) {
    JsonObject o = obj(PRIVATE_HISTORY);
    o.addProperty(WITH, withUser);
    o.add("messages", toJsonArray(messages));
    return o;
  }

  public static JsonObject broadcastMsg(String message) {
    JsonObject o = obj(BROADCAST_MSG);
    o.addProperty("message", message);
    return o;
  }

  public static JsonObject privateMsg(String from, String message) {
    JsonObject o = obj(PRIVATE_MSG);
    o.addProperty("from", from);
    o.addProperty("message", message);
    return o;
  }

  public static JsonObject error(String message) {
    JsonObject o = obj(ERROR);
    o.addProperty("message", message);
    return o;
  }

  public static JsonObject ack(String message) {
    JsonObject o = obj(ACK);
    o.addProperty("message", message);
    return o;
  }

  public static JsonObject typing(String from, String state) {
    JsonObject o = obj(TYPING);
    o.addProperty("from", from);
    o.addProperty("state", state); // "start" or "stop"
    return o;
  }

  // ---- Groups builders ----

  public static JsonObject groups(JsonArray groups) {
    JsonObject o = obj(GROUPS);
    o.add("groups", groups == null ? new JsonArray() : groups);
    return o;
  }

  public static JsonObject groupCreatedOk(String groupId, String name) {
    JsonObject o = obj(GROUP_CREATED);
    o.addProperty(OK, true);
    o.addProperty("groupId", groupId);
    o.addProperty("name", name);
    return o;
  }

  public static JsonObject groupCreatedFail(String error) {
    JsonObject o = obj(GROUP_CREATED);
    o.addProperty(OK, false);
    o.addProperty("error", error);
    return o;
  }

  public static JsonObject groupHistory(String groupId, java.util.List<String> messages) {
    JsonObject o = obj(GROUP_HISTORY);
    o.addProperty(GROUP_ID, groupId);
    o.add("messages", toJsonArray(messages));
    return o;
  }

  public static JsonObject groupMsg(String groupId, String message) {
    JsonObject o = obj(GROUP_MSG);
    o.addProperty(GROUP_ID, groupId);
    o.addProperty("message", message);
    return o;
  }

  // ---- Clear-for-me builders ----

  public static JsonObject clearResultOk(String scope, String with, String groupId, long clearedAtMillis) {
    JsonObject o = obj(CLEAR_RESULT);
    o.addProperty(OK, true);
    o.addProperty(SCOPE, scope == null ? "" : scope);
    if (with != null) o.addProperty(WITH, with);
    if (groupId != null) o.addProperty(GROUP_ID, groupId);
    o.addProperty(CLEARED_AT, clearedAtMillis);
    return o;
  }

  public static JsonObject clearResultFail(String error) {
    JsonObject o = obj(CLEAR_RESULT);
    o.addProperty(OK, false);
    o.addProperty("error", error);
    return o;
  }

  // (still here; can be removed later)
  public static JsonObject userItem(String username, String displayName, String avatarBase64) {
    JsonObject u = new JsonObject();
    u.addProperty("username", username == null ? "" : username);
    if (displayName != null) u.addProperty(DISPLAY_NAME, displayName);
    if (avatarBase64 != null && !avatarBase64.isBlank()) u.addProperty(AVATAR, avatarBase64);
    return u;
  }

  // ---------------- Safe getters ----------------

  public static String typeOf(JsonObject o) {
    return getString(o, TYPE);
  }

  public static String getString(JsonObject o, String key) {
    if (o == null || key == null) return null;
    JsonElement e = o.get(key);
    return (e == null || e.isJsonNull()) ? null : e.getAsString();
  }

  public static boolean getBool(JsonObject o, String key, boolean def) {
    if (o == null || key == null) return def;
    JsonElement e = o.get(key);
    return (e == null || e.isJsonNull()) ? def : e.getAsBoolean();
  }

  public static long getLong(JsonObject o, String key, long def) {
    if (o == null || key == null) return def;
    JsonElement e = o.get(key);
    return (e == null || e.isJsonNull()) ? def : e.getAsLong();
  }

  // ---------------- Internals ----------------

  private static JsonObject obj(String type) {
    JsonObject o = new JsonObject();
    o.addProperty(TYPE, type);
    return o;
  }

  private static JsonArray toJsonArray(java.util.List<String> list) {
    JsonArray arr = new JsonArray();
    if (list != null) for (String s : list) arr.add(s);
    return arr;
  }
}