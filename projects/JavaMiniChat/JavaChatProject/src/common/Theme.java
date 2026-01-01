package common;
import java.awt.Color;
import java.awt.Font;

import javax.swing.UIManager;

/**
 * Theme:
 * Central place for colors, fonts, radii.
 *
 * Keep this in the default package for now (matches your current project).
 * Later we can move into packages when we restructure folders.
 */
public final class Theme {

  private Theme() {}

  // ---------- Core colors ----------
  public static final Color BG_APP     = new Color(35, 35, 35);
  public static final Color BG_HEADER  = new Color(27, 27, 27);
  public static final Color BG_SIDEBAR = new Color(40, 40, 40);

  public static final Color SURFACE_1  = new Color(55, 55, 55);
  public static final Color SURFACE_2  = new Color(64, 64, 64);
  public static final Color BORDER     = new Color(70, 70, 70);

  public static final Color TEXT_MAIN  = Color.WHITE;
  public static final Color TEXT_SUB   = new Color(190, 190, 190);
  public static final Color TEXT_MUTED = new Color(120, 120, 120);

  // Accents
  public static final Color ACCENT_GREEN = new Color(32, 191, 107);
  public static final Color ACCENT_TEAL  = new Color(7, 94, 84);
  public static final Color DANGER       = new Color(180, 60, 60);

  // Presence
  public static final Color DOT_ONLINE  = ACCENT_GREEN;
  public static final Color DOT_OFFLINE = new Color(120, 120, 120);

  // Selection
  public static final Color SELECTED = new Color(70, 130, 180);

  // ---------- Radii ----------
  public static final int RADIUS_SM = 12;
  public static final int RADIUS_MD = 14;
  public static final int RADIUS_LG = 16;
  public static final int RADIUS_XL = 18;

  // ---------- Typography ----------
  // "Segoe UI" will fall back automatically on non-Windows systems.
  public static final String FONT_FAMILY = "Segoe UI";

  public static Font fontBody(int size) {
    return new Font(FONT_FAMILY, Font.PLAIN, size);
  }

  public static Font fontBold(int size) {
    return new Font(FONT_FAMILY, Font.BOLD, size);
  }

  public static Font fontTitle(int size) {
    return new Font(FONT_FAMILY, Font.BOLD, size);
  }

  /**
   * Optional: apply a consistent base font/colors via UIManager.
   * Safe to call at startup (ClientMain/Main before creating any Swing components).
   */
  public static void installDefaults() {
    try {
      // Fonts
      UIManager.put("Label.font", fontBody(13));
      UIManager.put("Button.font", fontBold(13));
      UIManager.put("TextField.font", fontBody(13));
      UIManager.put("TextArea.font", fontBody(13));
      UIManager.put("List.font", fontBody(13));

      // Backgrounds (Swing LAF-dependent; not all keys apply everywhere)
      UIManager.put("Panel.background", BG_APP);
      UIManager.put("List.background", BG_SIDEBAR);
      UIManager.put("List.foreground", TEXT_MAIN);

      UIManager.put("OptionPane.background", BG_APP);
      UIManager.put("OptionPane.messageForeground", TEXT_MAIN);
      UIManager.put("Panel.foreground", TEXT_MAIN);
    } catch (Exception ignored) {
      // If any Look&Feel rejects keys, we just skip.
    }
  }
}