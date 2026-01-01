package app;

import server.db.MongoManager;
import server.net.Server;
import server.repo.UserRepository;
/**
 * Starts ONLY the server (recommended).
 *
 * - Connects to MongoDB (creates collections/indexes automatically)
 * - Resets all users to offline on startup (avoids stale online statuses after crashes)
 * - Starts socket server on CHAT_PORT
 *
 * Environment variables (optional):
 * - CHAT_MONGO_URI (default: mongodb://localhost:27017)
 * - CHAT_DB_NAME   (default: chatdb)
 * - CHAT_PORT      (default: 9999)
 */
public class ServerMain {

  public static void main(String[] args) {
    String mongoUri = env("CHAT_MONGO_URI", "mongodb://localhost:27017");
    String dbName   = env("CHAT_DB_NAME", "chatdb");
    int port        = envInt("CHAT_PORT", 9999);

    try {
      MongoManager.init(mongoUri, dbName);
    } catch (Exception ex) {
      System.err.println("❌ Mongo init failed: " + ex.getMessage());
      ex.printStackTrace();
      return;
    }

    try {
      UserRepository.resetAllOffline();
    } catch (Exception ex) {
      System.err.println("⚠️ Could not reset users offline: " + ex.getMessage());
    }

    System.out.println("✅ Server starting on port " + port);
    Server.start(port);
  }

  private static String env(String key, String def) {
    String v = System.getenv(key);
    return (v == null || v.isBlank()) ? def : v.trim();
  }

  private static int envInt(String key, int def) {
    String v = System.getenv(key);
    if (v == null || v.isBlank()) return def;
    try { return Integer.parseInt(v.trim()); }
    catch (Exception ignored) { return def; }
  }
}