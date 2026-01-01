package client.ui;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import common.MessageFormat;

public final class ChatHtmlRenderer {

  public enum Mode { PRIVATE, BROADCAST, GROUP }

  private static final DateTimeFormatter TS_PARSE = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
  private static final DateTimeFormatter TS_SHOW_TIME = DateTimeFormatter.ofPattern("h:mm a");

  private ChatHtmlRenderer() {}

  /**
   * Keep this for backward compatibility with any remaining callers.
   * Internally uses MessageFormat so there's only one formatter logic.
   */
  public static String localFormatNow(String sender, String content) {
    return MessageFormat.localFormatNow(sender, content);
  }

  public static Map<LocalDate, List<String>> groupByDate(List<String> rawMessages) {
    Map<LocalDate, List<String>> grouped = new HashMap<>();
    if (rawMessages == null) return grouped;
    for (String raw : rawMessages) {
      LocalDate d = extractDate(raw);
      grouped.computeIfAbsent(d, k -> new ArrayList<>()).add(raw);
    }
    return grouped;
  }

  public static String dateSeparator(LocalDate date) {
    LocalDate today = LocalDate.now();
    String label;

    if (date.isEqual(today)) label = "TODAY";
    else if (date.plusDays(1).isEqual(today)) label = "YESTERDAY";
    else if (ChronoUnit.DAYS.between(date, today) <= 7) {
      String w = date.getDayOfWeek().toString().toLowerCase();
      label = Character.toUpperCase(w.charAt(0)) + w.substring(1);
    } else {
      label = date.format(DateTimeFormatter.ofPattern("d MMM uuuu"));
    }

    return "<div style='text-align:center; margin:20px 0;'>"
        + "<span style='background:#2a2a2a; color:#aaa; font-size:12px; padding:4px 12px; border-radius:12px;'>"
        + esc(label)
        + "</span></div>";
  }

  public static String bubble(String raw, Mode mode, String myUsername) {
    Parsed p = parse(raw);
    if (p == null) return "<div>" + esc(raw) + "</div>";

    boolean isMe = p.sender.equals(myUsername);

    // PRIVATE / GROUP: me right, others left
    // BROADCAST: me left, others right (your older style)
    String align = switch (mode) {
      case BROADCAST -> (isMe ? "flex-start" : "flex-end");
      case PRIVATE, GROUP -> (isMe ? "flex-end" : "flex-start");
    };

    String bubbleBg = isMe ? "#25D366" : "#404040";
    String name = isMe ? "You" : p.sender;
    String time = (p.ts == null) ? "Invalid Time" : p.ts.format(TS_SHOW_TIME);

    return String.format(
        "<div style='display:flex; justify-content:%s; margin:8px 0;'>"
            + "<div style='background:%s; color:white; border-radius:18px; padding:12px 16px; max-width:70%%;'>"
            + "<div style='font-size:12px; font-weight:bold; color:#ddd; margin-bottom:4px;'>%s</div>"
            + "<div>%s</div>"
            + "<div style='font-size:11px; color:#aaa; text-align:right; margin-top:4px;'>%s</div>"
            + "</div></div>",
        align, bubbleBg, esc(name), esc(p.content), esc(time)
    );
  }

  public static String escForHtml(String s) { return esc(s); }

  private static final class Parsed {
    final LocalDateTime ts;
    final String sender;
    final String content;
    Parsed(LocalDateTime ts, String sender, String content) {
      this.ts = ts; this.sender = sender; this.content = content;
    }
  }

  private static Parsed parse(String raw) {
    if (raw == null) return null;
    int rb = raw.indexOf(']');
    if (!raw.startsWith("[") || rb < 0) return null;

    String tsStr = raw.substring(1, rb).trim();
    String rest = raw.substring(rb + 1).trim();

    int colon = rest.indexOf(':');
    if (colon < 0) return null;

    String sender = rest.substring(0, colon).trim();
    String content = rest.substring(colon + 1).trim();
    if (content.startsWith(" ")) content = content.substring(1);

    LocalDateTime ts = null;
    try { ts = LocalDateTime.parse(tsStr, TS_PARSE); } catch (Exception ignored) {}

    return new Parsed(ts, sender, content);
  }

  private static LocalDate extractDate(String raw) {
    Parsed p = parse(raw);
    if (p != null && p.ts != null) return p.ts.toLocalDate();
    return LocalDate.now();
  }

  private static String esc(String s) {
    if (s == null) return "";
    return s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\"", "&quot;")
        .replace("'", "&#x27;");
  }
}