package server.repo;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.bson.Document;

import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Sorts;

import server.db.MongoManager;

/**
 * Server-side message storage on MongoDB.
 *
 * Returns messages in UI-friendly format:
 *   "[yyyy-MM-dd HH:mm] sender: content"
 *
 * Step: Clear-for-me filtering
 * - Broadcast history respects user's clearedAt marker
 * - Private history respects user's clearedAt marker for that conversation
 */
public final class MessageRepository {

  private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

  private MessageRepository() {}

  // -------- Broadcast (global channel) --------

  public static String saveBroadcastAndFormat(String sender, String content) {
    content = cleanContent(content);
    if (sender == null || content == null) return null;

    Date ts = new Date();

    Document d = new Document("ts", ts)
        .append("sender", sender)
        .append("content", content);

    MongoManager.broadcastMessages().insertOne(d);
    return format(ts, sender, content);
  }

  /**
   * Load broadcast history ordered by time ascending, filtered by clear-for-me marker.
   * @param forUser user requesting history (used for clear marker); can be null (no filtering)
   */
  public static List<String> loadBroadcastHistoryForUser(String forUser, int limit) {
    List<String> out = new ArrayList<>();

    long clearedAt = (forUser == null)
        ? 0L
        : ClearMarkerRepository.getEffectiveClearedAtMillis(forUser, "broadcast", "");

    var filter = (clearedAt <= 0)
        ? new Document()
        : Filters.gte("ts", new Date(clearedAt));

    var cur = MongoManager.broadcastMessages()
        .find(filter)
        .sort(Sorts.ascending("ts"))
        .limit(Math.max(1, limit));

    for (Document d : cur) {
      Date ts = d.getDate("ts");
      out.add(format(ts, d.getString("sender"), d.getString("content")));
    }
    return out;
  }

  /** Backward compatible (no clear marker filtering). */
  public static List<String> loadBroadcastHistory(int limit) {
    return loadBroadcastHistoryForUser(null, limit);
  }

  // -------- Private (DM) --------

  public static void savePrivate(String sender, String receiver, String content) {
    content = cleanContent(content);
    if (sender == null || receiver == null || content == null) return;

    Document d = new Document("ts", new Date())
        .append("conversationId", conversationId(sender, receiver))
        .append("sender", sender)
        .append("receiver", receiver)
        .append("content", content);

    MongoManager.privateMessages().insertOne(d);
  }

  /**
   * Private history for userA viewing chat with userB, filtered by userA's clear marker.
   */
  public static List<String> loadPrivateHistoryForUser(String userA, String userB, int limit) {
    List<String> out = new ArrayList<>();
    if (userA == null || userB == null) return out;

    String conv = conversationId(userA, userB);

    long clearedAt = ClearMarkerRepository.getEffectiveClearedAtMillis(userA, "private", userB);
    var filter = (clearedAt <= 0)
        ? Filters.eq("conversationId", conv)
        : Filters.and(
            Filters.eq("conversationId", conv),
            Filters.gte("ts", new Date(clearedAt))
        );

    var cur = MongoManager.privateMessages()
        .find(filter)
        .sort(Sorts.ascending("ts"))
        .limit(Math.max(1, limit));

    for (Document d : cur) {
      Date ts = d.getDate("ts");
      out.add(format(ts, d.getString("sender"), d.getString("content")));
    }
    return out;
  }

  /** Backward compatible (no clear marker filtering). */
  public static List<String> loadPrivateHistory(String userA, String userB, int limit) {
    return loadPrivateHistoryForUser(userA, userB, limit);
  }

  // -------- Helpers --------

  /** Stable conversation id so A|B == B|A. */
  public static String conversationId(String a, String b) {
    if (a == null || b == null) return "";
    return (a.compareToIgnoreCase(b) <= 0) ? (a + "|" + b) : (b + "|" + a);
  }

  private static String format(Date date, String sender, String content) {
    LocalDateTime ldt = (date == null)
        ? LocalDateTime.now()
        : LocalDateTime.ofInstant(date.toInstant(), ZoneId.systemDefault());

    return "[" + TS.format(ldt) + "] " + sender + ": " + content;
  }

  private static String cleanContent(String s) {
    if (s == null) return null;
    s = s.replaceAll("[\\r\\n]+", " ").trim();
    if (s.isEmpty()) return null;
    int max = 2000;
    return (s.length() > max) ? s.substring(0, max) : s;
  }
}