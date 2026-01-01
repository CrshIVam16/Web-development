package common;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * MessageFormat:
 * Single source of truth for your UI message string format:
 *   "[yyyy-MM-dd HH:mm] sender: content"
 *
 * Used by:
 * - Client-side parsing (MessageItem, previews)
 * - Client-side local formatting (local echo)
 *
 * Server currently also formats similarly; later we can route everything through IDs/JSON.
 */
public final class MessageFormat {

  public static final DateTimeFormatter TS_PARSE = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

  private MessageFormat() {}

  public static final class Parsed {
    public final LocalDateTime ts;  // may be null
    public final String sender;     // may be "?"
    public final String content;    // never null

    public Parsed(LocalDateTime ts, String sender, String content) {
      this.ts = ts;
      this.sender = (sender == null || sender.isBlank()) ? "?" : sender;
      this.content = TextUtil.safe(content);
    }
  }

  /** Parse raw "[ts] sender: content" safely. Never throws; returns null if not parseable. */
  public static Parsed parse(String raw) {
    if (raw == null) return null;
    String s = raw.trim();
    if (!s.startsWith("[")) return null;

    int rb = s.indexOf(']');
    if (rb <= 0) return null;

    String tsStr = s.substring(1, rb).trim();
    String rest  = s.substring(rb + 1).trim();

    int colon = rest.indexOf(':');
    if (colon < 0) return null;

    String sender = rest.substring(0, colon).trim();
    String content = rest.substring(colon + 1).trim();
    if (content.startsWith(" ")) content = content.substring(1);

    LocalDateTime ts = null;
    try { ts = LocalDateTime.parse(tsStr, TS_PARSE); }
    catch (Exception ignored) {}

    content = TextUtil.cleanOneLine(content);

    return new Parsed(ts, sender, content);
  }

  /** Format a message using current time, returning the raw string used everywhere. */
  public static String localFormatNow(String sender, String content) {
    String now = LocalDateTime.now().format(TS_PARSE);
    return "[" + now + "] " + TextUtil.safe(sender) + ": " + TextUtil.cleanOneLine(content);
  }
}