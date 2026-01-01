package client.model;
import java.time.LocalDateTime;

import common.MessageFormat;
import common.TextUtil;

/**
 * MessageItem = one message in the UI model.
 * Parsed from your existing format:
 *   "[yyyy-MM-dd HH:mm] sender: content"
 *
 * Client-side only (used for Delete-for-me / Clear chat / Copy).
 */
public final class MessageItem {

  public final long id;              // local-only id for UI operations
  public final String raw;           // original raw string (trimmed)
  public final LocalDateTime ts;     // can be null if parse fails
  public final String sender;        // may be "?"
  public final String content;       // message body (cleaned)

  private MessageItem(long id, String raw, LocalDateTime ts, String sender, String content) {
    this.id = id;
    this.raw = raw;
    this.ts = ts;
    this.sender = sender;
    this.content = content;
  }

  /** Parse a raw message and create a UI item with a local id. */
  public static MessageItem fromRaw(long id, String raw) {
    raw = TextUtil.safe(raw).trim();

    MessageFormat.Parsed p = MessageFormat.parse(raw);
    if (p == null) {
      // Fallback: show raw as content
      return new MessageItem(id, raw, null, "?", TextUtil.cleanOneLine(raw));
    }

    return new MessageItem(id, raw, p.ts, p.sender, p.content);
  }

  /** True if this message belongs to the current user. */
  public boolean isMine(String myUsername) {
    return myUsername != null && myUsername.equals(sender);
  }
}