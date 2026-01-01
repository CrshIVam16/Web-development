package app;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;

import client.ui.ClientGUI;
import common.Theme;
import server.db.MongoManager;
import server.net.Server;

/**
 * DEV-only launcher:
 * - Starts Mongo + Server in background thread
 * - Launches one client GUI
 *
 * Recommended normal use:
 * - Run ServerMain (server)
 * - Run ClientMain (client)
 */
public class Main {

  public static void main(String[] args) {
    // Optional: native Look & Feel
    try {
      UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
    } catch (Exception ignored) {}

    // Install our shared defaults (fonts/colors)
    Theme.installDefaults();

    String mongoUri = env("CHAT_MONGO_URI", "mongodb://localhost:27017");
    String dbName   = env("CHAT_DB_NAME", "chatdb");
    int port        = envInt("CHAT_PORT", 9999);
    String host     = env("CHAT_HOST", "localhost");

    // Init Mongo (server-side)
    MongoManager.init(mongoUri, dbName);

    // Start server in background (so GUI can open)
    new Thread(() -> Server.start(port), "chat-server").start();

    // Start one client UI
    SwingUtilities.invokeLater(() -> new ClientGUI(host, port));
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