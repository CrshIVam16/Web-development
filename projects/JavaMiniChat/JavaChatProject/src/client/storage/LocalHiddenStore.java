package client.storage;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

/**
 * LocalHiddenStore:
 * Stores "delete for me" message hides on THIS PC only.
 * Does NOT touch server DB.
 *
 * Data model: per user -> per chatKey -> set of message hashes
 *
 * chatKey examples:
 * - "broadcast"
 * - "private:AlexKumar"
 * - "group:<groupId>"
 */
public final class LocalHiddenStore {

  private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();

  private final String username;
  private final File file;

  // chatKey -> set(hash(chatKey + rawMessage))
  private final Map<String, Set<String>> hidden = new HashMap<>();

  private LocalHiddenStore(String username, File file) {
    this.username = username;
    this.file = file;
  }

  public static LocalHiddenStore load(String username) {
    username = username == null ? "" : username.trim();
    if (username.isEmpty()) username = "unknown";

    File f = new File(System.getProperty("user.home"),
        ".chitchat_hidden_" + safeFilePart(username) + ".json");

    LocalHiddenStore store = new LocalHiddenStore(username, f);

    if (!f.exists()) return store;

    try (FileReader r = new FileReader(f, StandardCharsets.UTF_8)) {
      Data d = GSON.fromJson(r, Data.class);
      if (d != null && d.hidden != null) {
        for (var e : d.hidden.entrySet()) {
          if (e.getKey() == null || e.getKey().isBlank()) continue;
          if (e.getValue() == null) continue;
          store.hidden.put(e.getKey(), new HashSet<>(e.getValue()));
        }
      }
    } catch (Exception ignored) {
      // fail open: just treat as empty
    }

    return store;
  }

  public synchronized void save() {
    try {
      Data d = new Data();
      d.username = username;
      d.hidden = new HashMap<>();

      for (var e : hidden.entrySet()) {
        d.hidden.put(e.getKey(), new HashSet<>(e.getValue()));
      }

      try (FileWriter w = new FileWriter(file, StandardCharsets.UTF_8)) {
        GSON.toJson(d, w);
      }
    } catch (Exception ignored) {
      // if saving fails, app still works; it just won't persist
    }
  }

  /** Mark this raw message hidden for this chatKey. */
  public synchronized void hide(String chatKey, String rawMessage) {
    chatKey = norm(chatKey);
    if (chatKey.isEmpty()) return;

    String h = hash(chatKey, rawMessage);
    hidden.computeIfAbsent(chatKey, k -> new HashSet<>()).add(h);
  }

  /** True if this raw message should be hidden for this chatKey. */
  public synchronized boolean isHidden(String chatKey, String rawMessage) {
    chatKey = norm(chatKey);
    if (chatKey.isEmpty()) return false;

    Set<String> set = hidden.get(chatKey);
    if (set == null || set.isEmpty()) return false;

    return set.contains(hash(chatKey, rawMessage));
  }

  // -------- internals --------

  private static String norm(String s) {
    return s == null ? "" : s.trim();
  }

  private static String safeFilePart(String s) {
    return s.replaceAll("[^a-zA-Z0-9._-]+", "_");
  }

  private static String hash(String chatKey, String rawMessage) {
    try {
      String input = norm(chatKey) + "||" + (rawMessage == null ? "" : rawMessage);
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      byte[] out = md.digest(input.getBytes(StandardCharsets.UTF_8));
      return hex(out);
    } catch (Exception e) {
      // fallback: still deterministic-ish
      return String.valueOf((chatKey + "||" + rawMessage).hashCode());
    }
  }

  private static String hex(byte[] b) {
    StringBuilder sb = new StringBuilder(b.length * 2);
    for (byte x : b) {
      sb.append(Character.forDigit((x >> 4) & 0xF, 16));
      sb.append(Character.forDigit(x & 0xF, 16));
    }
    return sb.toString();
  }

  private static final class Data {
    String username;
    Map<String, Set<String>> hidden;
  }
}