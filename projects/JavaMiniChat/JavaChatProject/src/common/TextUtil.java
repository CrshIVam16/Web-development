package common;
/**
 * TextUtil:
 * Small shared text helpers to reduce duplication across UI + networking.
 */
public final class TextUtil {

  private TextUtil() {}

  /** Null-safe string. */
  public static String safe(String s) {
    return s == null ? "" : s;
  }

  /** Remove newlines and trim (UI-friendly one-line). */
  public static String cleanOneLine(String s) {
    if (s == null) return "";
    return s.replaceAll("[\\r\\n]+", " ").trim();
  }

  /** Clamp length (null-safe). */
  public static String clamp(String s, int max) {
    s = safe(s);
    if (max <= 0) return "";
    if (s.length() <= max) return s;
    return s.substring(0, max);
  }

  /** Clamp with ellipsis. */
  public static String clampEllipsis(String s, int max) {
    s = cleanOneLine(s);
    if (max <= 0) return "";
    if (s.length() <= max) return s;
    if (max == 1) return "…";
    return s.substring(0, max - 1) + "…";
  }
}