package server.repo;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.bson.Document;
import org.bson.types.ObjectId;

import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;

import server.db.MongoManager;

/**
 * Server-side Group Chat storage (MongoDB).
 *
 * Collections used:
 * - groups:
 *     { _id, name, members:[username], createdAt, createdBy }
 * - group_messages:
 *     { _id, groupId, ts, sender, content }
 *
 * Messages are returned in the SAME UI-friendly format used elsewhere:
 *   "[yyyy-MM-dd HH:mm] sender: content"
 *
 * Step: Clear-for-me filtering
 * - Group history respects user's clearedAt marker for that groupId
 */
public final class GroupRepository {

  private static final String COL_GROUPS = "groups";
  private static final String COL_GROUP_MESSAGES = "group_messages";

  private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

  private GroupRepository() {}

  public static String createGroup(String name, String createdBy, List<String> members) {
    name = cleanName(name);
    createdBy = cleanUser(createdBy);
    if (name == null || createdBy == null) return null;

    List<String> cleanMembers = new ArrayList<>();
    if (members != null) {
      for (String m : members) {
        String u = cleanUser(m);
        if (u != null && !cleanMembers.contains(u)) cleanMembers.add(u);
      }
    }
    if (!cleanMembers.contains(createdBy)) cleanMembers.add(createdBy);

    ObjectId id = new ObjectId();
    Document g = new Document("_id", id)
        .append("name", name)
        .append("members", cleanMembers)
        .append("createdAt", new Date())
        .append("createdBy", createdBy);

    MongoManager.db().getCollection(COL_GROUPS).insertOne(g);
    return id.toHexString();
  }

  public static List<Document> listGroupsForUser(String username) {
    username = cleanUser(username);
    List<Document> out = new ArrayList<>();
    if (username == null) return out;

    var cur = MongoManager.db().getCollection(COL_GROUPS)
        .find(Filters.in("members", username))
        .sort(Sorts.ascending("name"));

    for (Document d : cur) out.add(d);
    return out;
  }

  public static boolean isMember(String groupId, String username) {
    ObjectId gid = parseId(groupId);
    username = cleanUser(username);
    if (gid == null || username == null) return false;

    Document g = MongoManager.db().getCollection(COL_GROUPS)
        .find(Filters.and(
            Filters.eq("_id", gid),
            Filters.in("members", username)
        ))
        .projection(new Document("_id", 1))
        .first();

    return g != null;
  }

  public static void saveGroupMessage(String groupId, String sender, String content) {
    ObjectId gid = parseId(groupId);
    sender = cleanUser(sender);
    content = cleanContent(content);
    if (gid == null || sender == null || content == null) return;

    Document m = new Document("groupId", gid)
        .append("ts", new Date())
        .append("sender", sender)
        .append("content", content);

    MongoManager.db().getCollection(COL_GROUP_MESSAGES).insertOne(m);
  }

  /**
   * Load group messages (oldest -> newest) for a specific user (filters by clear marker).
   */
  public static List<String> loadGroupHistoryForUser(String forUser, String groupId, int limit) {
    ObjectId gid = parseId(groupId);
    List<String> out = new ArrayList<>();
    if (gid == null) return out;

    long clearedAt = (forUser == null)
        ? 0L
        : ClearMarkerRepository.getEffectiveClearedAtMillis(forUser, "group", groupId);

    var filter = (clearedAt <= 0)
        ? Filters.eq("groupId", gid)
        : Filters.and(
            Filters.eq("groupId", gid),
            Filters.gte("ts", new Date(clearedAt))
        );

    var cur = MongoManager.db().getCollection(COL_GROUP_MESSAGES)
        .find(filter)
        .sort(Sorts.ascending("ts"))
        .limit(Math.max(1, limit));

    for (Document d : cur) {
      Date ts = d.getDate("ts");
      String sender = d.getString("sender");
      String content = d.getString("content");
      out.add(format(ts, sender, content));
    }
    return out;
  }

  /** Backward compatible. */
  public static List<String> loadGroupHistory(String groupId, int limit) {
    return loadGroupHistoryForUser(null, groupId, limit);
  }

  public static String formatNow(String sender, String content) {
    String now = LocalDateTime.now().format(TS);
    return "[" + now + "] " + sender + ": " + cleanContent(content);
  }

  // ---------------- helpers ----------------

  private static String format(Date date, String sender, String content) {
    LocalDateTime ldt = (date == null)
        ? LocalDateTime.now()
        : LocalDateTime.ofInstant(date.toInstant(), ZoneId.systemDefault());
    return "[" + TS.format(ldt) + "] " + sender + ": " + content;
  }

  private static ObjectId parseId(String hex) {
    if (hex == null) return null;
    hex = hex.trim();
    try { return new ObjectId(hex); }
    catch (Exception ignored) { return null; }
  }

  private static String cleanUser(String u) {
    if (u == null) return null;
    u = u.trim();
    if (u.isEmpty()) return null;
    if (u.length() > 50) u = u.substring(0, 50);
    return u;
  }

  private static String cleanName(String s) {
    if (s == null) return null;
    s = s.trim();
    if (s.isEmpty()) return null;
    int max = 60;
    return (s.length() > max) ? s.substring(0, max) : s;
  }

  private static String cleanContent(String s) {
    if (s == null) return null;
    s = s.replaceAll("[\\r\\n]+", " ").trim();
    if (s.isEmpty()) return null;
    int max = 2000;
    return (s.length() > max) ? s.substring(0, max) : s;
  }
}