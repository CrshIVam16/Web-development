package server.repo;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.bson.Document;

import com.mongodb.MongoWriteException;
import com.mongodb.client.model.Filters;
import com.mongodb.client.model.Updates;

import server.db.MongoManager;
import server.security.PasswordUtil;

/**
 * Server-side user storage/auth on MongoDB.
 *
 * Collection: users
 * Fields:
 * - username (unique)
 * - passHash, salt, iterations
 * - status: "online" | "offline"
 * - lastSeen: Date
 */
public final class UserRepository {
  private static final String COL_USERNAME = "username";
  private static final String COL_PASSHASH = "passHash";
  private static final String COL_SALT = "salt";
  private static final String COL_ITERS = "iterations";
  private static final String COL_STATUS = "status";
  private static final String COL_LASTSEEN = "lastSeen";

  private UserRepository() {}

  /** Create a new user. Returns false if username already exists. */
  public static boolean signUp(String username, String password) {
    username = cleanUser(username);
    if (username == null || password == null || password.isBlank()) return false;

    String salt = PasswordUtil.generateSalt();
    int iters = PasswordUtil.iterations();
    String hash = PasswordUtil.hashPassword(password, salt, iters);

    Document doc = new Document(COL_USERNAME, username)
        .append(COL_PASSHASH, hash)
        .append(COL_SALT, salt)
        .append(COL_ITERS, iters)
        .append(COL_STATUS, "offline")
        .append(COL_LASTSEEN, null);

    try {
      MongoManager.users().insertOne(doc);
      return true;
    } catch (MongoWriteException e) {
      // Duplicate username => Mongo error code 11000
      if (e.getError() != null && e.getError().getCode() == 11000) return false;
      throw e;
    }
  }

  /** Verify credentials. Returns true if password matches. */
  public static boolean login(String username, String password) {
    username = cleanUser(username);
    if (username == null || password == null) return false;

    Document user = MongoManager.users()
        .find(Filters.eq(COL_USERNAME, username))
        .projection(new Document(COL_PASSHASH, 1).append(COL_SALT, 1).append(COL_ITERS, 1))
        .first();

    if (user == null) return false;

    String storedHash = user.getString(COL_PASSHASH);
    String salt = user.getString(COL_SALT);
    Integer iterations = user.getInteger(COL_ITERS);

    if (storedHash == null || salt == null || iterations == null) return false;

    return PasswordUtil.verifyPassword(password, storedHash, salt, iterations);
  }

  /** Mark user online. */
  public static void markOnline(String username) {
    setStatus(username, "online", false);
  }

  /** Mark user offline and update lastSeen. */
  public static void markOffline(String username) {
    setStatus(username, "offline", true);
  }

  private static void setStatus(String username, String status, boolean updateLastSeen) {
    username = cleanUser(username);
    if (username == null) return;

    if (updateLastSeen) {
      MongoManager.users().updateOne(
          Filters.eq(COL_USERNAME, username),
          Updates.combine(
              Updates.set(COL_STATUS, status),
              Updates.set(COL_LASTSEEN, new Date())));
    } else {
      MongoManager.users().updateOne(
          Filters.eq(COL_USERNAME, username),
          Updates.set(COL_STATUS, status));
    }
  }

  /** All registered usernames. */
  public static List<String> getAllUsernames() {
    List<String> users = new ArrayList<>();
    for (Document d : MongoManager.users()
        .find()
        .projection(new Document(COL_USERNAME, 1))) {
      String u = d.getString(COL_USERNAME);
      if (u != null) users.add(u);
    }
    return users;
  }

  /** All usernames except `exclude`. */
  public static List<String> getAllUsernamesExcept(String exclude) {
    exclude = cleanUser(exclude);

    List<String> users = new ArrayList<>();
    var filter = (exclude == null) ? new Document() : Filters.ne(COL_USERNAME, exclude);

    for (Document d : MongoManager.users()
        .find(filter)
        .projection(new Document(COL_USERNAME, 1))) {
      String u = d.getString(COL_USERNAME);
      if (u != null) users.add(u);
    }
    return users;
  }

  /** Reset all users to offline (server startup). */
  public static void resetAllOffline() {
    MongoManager.users().updateMany(
        new org.bson.Document(),
        com.mongodb.client.model.Updates.set("status", "offline"));
  }

  private static String cleanUser(String u) {
    if (u == null) return null;
    u = u.trim();
    if (u.isEmpty()) return null;
    if (u.length() > 50) u = u.substring(0, 50);
    return u;
  }
}