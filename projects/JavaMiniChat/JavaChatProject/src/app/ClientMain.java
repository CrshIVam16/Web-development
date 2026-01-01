package app;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;

import client.ui.ClientGUI;
import common.Theme;

/**
 * Starts ONLY the client UI.
 * The server must be started separately (run ServerMain).
 *
 * Config via environment variables (optional):
 * - CHAT_HOST (default: localhost)
 * - CHAT_PORT (default: 9999)
 */
public class ClientMain {

  public static void main(String[] args) {
    // Optional: use system Look & Feel (keeps app native-looking)
    try {
      UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
    } catch (Exception ignored) {}

    // Install our shared defaults (fonts/colors)
    Theme.installDefaults();

    String host = env("CHAT_HOST", "localhost");
    int port = envInt("CHAT_PORT", 9999);

    // Launch Swing UI on the EDT
    SwingUtilities.invokeLater(() -> new ClientGUI(host, port));
  }

  private static String env(String key, String def) {
    String v = System.getenv(key);
    return (v == null || v.isBlank()) ? def : v.trim();
  }

  private static int envInt(String key, int def) {
    String v = System.getenv(key);
    if (v == null || v.isBlank())
      return def;
    try {
      return Integer.parseInt(v.trim());
    } catch (Exception ignored) {
      return def;
    }
  }
}