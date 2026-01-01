package server.repo;
import java.util.Date;

import org.bson.Document;

import com.mongodb.client.model.Filters;
import com.mongodb.client.model.UpdateOptions;
import com.mongodb.client.model.Updates;

import server.db.MongoManager;

/**
 * Stores "clear-for-me" markers per user per chat scope.
 *
 * Collection: chat_clears
 * Fields:
 * - key: "user|scope|chatId"
 * - user, scope, chatId
 * - clearedAt: Date
 */
public final class ClearMarkerRepository {

  private ClearMarkerRepository() {}

  private static String norm(String s) {
    return s == null ? "" : s.trim();
  }

  private static String key(String user, String scope, String chatId) {
    return norm(user) + "|" + norm(scope) + "|" + norm(chatId);
  }

  public static long setClearedAtNow(String user, String scope, String chatId) {
    long now = System.currentTimeMillis();
    setClearedAt(user, scope, chatId, now);
    return now;
  }

  /** Upsert marker. Throws RuntimeException on failure (caller catches and returns clear_result ok:false). */
  public static void setClearedAt(String user, String scope, String chatId, long epochMillis) {
    user = norm(user);
    scope = norm(scope);
    chatId = norm(chatId);

    if (user.isEmpty() || scope.isEmpty()) {
      throw new IllegalArgumentException("user/scope required");
    }

    try {
      String k = key(user, scope, chatId);
      Date when = new Date(Math.max(0L, epochMillis));

      MongoManager.chatClears().updateOne(
          Filters.eq("key", k),
          Updates.combine(
              Updates.set("key", k),
              Updates.set("user", user),
              Updates.set("scope", scope),
              Updates.set("chatId", chatId),
              Updates.set("clearedAt", when)
          ),
          new UpdateOptions().upsert(true)
      );
    } catch (Exception e) {
      throw new RuntimeException("Failed to write clear marker", e);
    }
  }

  /** max(all, specific). Fail-open (returns 0 if Mongo fails). */
  public static long getEffectiveClearedAtMillis(String user, String scope, String chatId) {
    long all = getClearedAtMillis(user, "all", "");
    long specific = getClearedAtMillis(user, scope, chatId);
    return Math.max(all, specific);
  }

  /** Fail-open (returns 0 if Mongo fails). */
  public static long getClearedAtMillis(String user, String scope, String chatId) {
    user = norm(user);
    scope = norm(scope);
    chatId = norm(chatId);
    if (user.isEmpty() || scope.isEmpty()) return 0L;

    try {
      String k = key(user, scope, chatId);

      Document d = MongoManager.chatClears()
          .find(Filters.eq("key", k))
          .projection(new Document("clearedAt", 1))
          .first();

      if (d == null) return 0L;
      Date dt = d.getDate("clearedAt");
      return dt == null ? 0L : dt.getTime();
    } catch (Exception e) {
      return 0L;
    }
  }
}