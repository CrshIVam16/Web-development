package common;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

/**
 * Small JSON helper for "one JSON object per line" socket protocol.
 * Uses Gson for serialization.
 *
 * Hardening:
 * - enforce max line length to reduce memory/DoS risk
 *
 * Step 3:
 * - increased limit so signup can include a small Base64 avatar (still capped server-side)
 */
public final class JsonUtil {
  private static final Gson GSON = new Gson();

  // Max characters allowed in one JSON line.
  // Increased to support small Base64 avatar on signup.
  private static final int MAX_LINE_CHARS = 256 * 1024; // 256 KB

  private JsonUtil() {}

  /** Write one JSON object as a single line. */
  public static void send(PrintWriter out, JsonObject obj) {
    if (out == null || obj == null) return;
    out.println(GSON.toJson(obj));
    out.flush();
  }

  /**
   * Read one line and parse it as JsonObject.
   * Returns null on EOF, invalid JSON, or if the line is too large.
   */
  public static JsonObject readObject(BufferedReader in) throws IOException {
    if (in == null) return null;

    String line = in.readLine();
    if (line == null) return null;

    line = line.trim();
    if (line.isEmpty()) return null;

    if (line.length() > MAX_LINE_CHARS) {
      return null;
    }

    try {
      var el = JsonParser.parseString(line);
      return el.isJsonObject() ? el.getAsJsonObject() : null;
    } catch (Exception ignored) {
      return null;
    }
  }
}