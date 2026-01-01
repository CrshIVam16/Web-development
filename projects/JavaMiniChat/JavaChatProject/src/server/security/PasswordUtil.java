package server.security;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

/**
 * Password hashing (server-side).
 * Uses PBKDF2 (slow hash) instead of plain SHA-256.
 *
 * Stored fields per user:
 * - salt (Base64)
 * - iterations (int)
 * - hash (Base64)
 */
public final class PasswordUtil {

  private static final SecureRandom RNG = new SecureRandom();

  // Good default for small projects; can be increased later.
  private static final int ITERATIONS = 120_000;

  // 256-bit derived key
  private static final int KEY_LENGTH_BITS = 256;

  // 16+ bytes salt
  private static final int SALT_BYTES = 16;

  private PasswordUtil() {}

  public static int iterations() {
    return ITERATIONS;
  }

  /** Random salt (Base64). */
  public static String generateSalt() {
    byte[] salt = new byte[SALT_BYTES];
    RNG.nextBytes(salt);
    return Base64.getEncoder().encodeToString(salt);
  }

  /** PBKDF2 hash (Base64) for password + salt + iterations. */
  public static String hashPassword(String password, String saltBase64, int iterations) {
    try {
      if (password == null) throw new IllegalArgumentException("password null");
      if (saltBase64 == null) throw new IllegalArgumentException("salt null");

      // floor to avoid accidental weak configs
      int iters = Math.max(10_000, iterations);

      byte[] salt = Base64.getDecoder().decode(saltBase64);

      char[] chars = password.toCharArray();
      PBEKeySpec spec = new PBEKeySpec(chars, salt, iters, KEY_LENGTH_BITS);

      SecretKeyFactory skf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
      byte[] key = skf.generateSecret(spec).getEncoded();

      spec.clearPassword();
      return Base64.getEncoder().encodeToString(key);
    } catch (Exception e) {
      throw new RuntimeException("Password hashing failed", e);
    }
  }

  /** Verify password against stored hash. */
  public static boolean verifyPassword(String password, String storedHashBase64, String saltBase64, int iterations) {
    if (password == null || storedHashBase64 == null || saltBase64 == null) return false;

    try {
      String attempt = hashPassword(password, saltBase64, iterations);
      return constantTimeEquals(
          attempt.getBytes(StandardCharsets.UTF_8),
          storedHashBase64.getBytes(StandardCharsets.UTF_8)
      );
    } catch (Exception ignored) {
      // corrupted salt/iterations/etc => treat as invalid login (don’t crash server)
      return false;
    }
  }

  /** Constant-time compare (full length). */
  private static boolean constantTimeEquals(byte[] a, byte[] b) {
    if (a == null || b == null) return false;

    int diff = a.length ^ b.length;
    int max = Math.max(a.length, b.length);

    for (int i = 0; i < max; i++) {
      byte aa = (i < a.length) ? a[i] : 0;
      byte bb = (i < b.length) ? b[i] : 0;
      diff |= (aa ^ bb);
    }
    return diff == 0;
  }
}