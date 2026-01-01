package client.net;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.PrintWriter;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.SocketTimeoutException;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;

import com.google.gson.JsonObject;

import common.JsonUtil;
import common.Protocol;

/**
 * ChatClient = socket + JSON protocol wrapper (client-side).
 */
public final class ChatClient {

  private static final int CONNECT_TIMEOUT_MS = 5000;
  private static final int READ_TIMEOUT_MS    = 30000;

  private final String host;
  private final int port;

  private Socket socket;
  private PrintWriter out;
  private BufferedReader in;

  private final AtomicBoolean running = new AtomicBoolean(false);
  private final AtomicBoolean disconnectNotified = new AtomicBoolean(false);

  private Consumer<JsonObject> onMessage = msg -> {};
  private Consumer<Exception> onDisconnect = ex -> {};
  private Consumer<String> onLog = s -> {};

  public ChatClient(String host, int port) {
    this.host = Objects.requireNonNull(host, "host");
    this.port = port;
  }

  public void setOnMessage(Consumer<JsonObject> onMessage) {
    this.onMessage = (onMessage == null) ? (m -> {}) : onMessage;
  }

  public void setOnDisconnect(Consumer<Exception> onDisconnect) {
    this.onDisconnect = (onDisconnect == null) ? (e -> {}) : onDisconnect;
  }

  public void setOnLog(Consumer<String> onLog) {
    this.onLog = (onLog == null) ? (s -> {}) : onLog;
  }

  // ---------------- Connection ----------------

  public synchronized void connect() throws Exception {
    closeInternal(false);
    disconnectNotified.set(false);

    Socket s = new Socket();
    s.setTcpNoDelay(true);
    s.setKeepAlive(true);
    s.connect(new InetSocketAddress(host, port), CONNECT_TIMEOUT_MS);
    s.setSoTimeout(READ_TIMEOUT_MS);

    socket = s;
    out = new PrintWriter(socket.getOutputStream(), true);
    in  = new BufferedReader(new InputStreamReader(socket.getInputStream()));

    running.set(true);

    Thread t = new Thread(this::readerLoop, "chat-client-reader");
    t.setDaemon(true);
    t.start();

    log("Connected to " + host + ":" + port);
  }

  public synchronized void disconnect() {
    running.set(false);

    try {
      if (out != null) {
        JsonObject o = new JsonObject();
        o.addProperty(Protocol.TYPE, Protocol.EXIT);
        JsonUtil.send(out, o);
      }
    } catch (Exception ignored) {}

    closeInternal(true);
  }

  public boolean isConnected() {
    Socket s = socket;
    return running.get()
        && s != null
        && s.isConnected()
        && !s.isClosed()
        && out != null
        && in != null;
  }

  private void readerLoop() {
    Exception disconnectReason = null;

    try {
      while (running.get()) {
        try {
          JsonObject msg = JsonUtil.readObject(in);
          if (msg == null) break;
          onMessage.accept(msg);
        } catch (SocketTimeoutException timeout) {
          // keep looping
        }
      }
    } catch (Exception ex) {
      disconnectReason = ex;
    } finally {
      running.set(false);
      closeInternal(false);

      if (disconnectNotified.compareAndSet(false, true)) {
        try { onDisconnect.accept(disconnectReason); } catch (Exception ignored) {}
      }

      log("Disconnected" + (disconnectReason == null ? "" : (": " + disconnectReason.getMessage())));
    }
  }

  private synchronized void closeInternal(boolean alreadyStopping) {
    try { if (in != null) in.close(); } catch (Exception ignored) {}
    try { if (out != null) out.close(); } catch (Exception ignored) {}
    try { if (socket != null && !socket.isClosed()) socket.close(); } catch (Exception ignored) {}

    in = null;
    out = null;
    socket = null;

    if (alreadyStopping) {
      if (disconnectNotified.compareAndSet(false, true)) {
        try { onDisconnect.accept(null); } catch (Exception ignored) {}
      }
    }
  }

  // ---------------- Send helpers ----------------

  public synchronized void send(JsonObject o) {
    if (out == null || o == null) return;
    JsonUtil.send(out, o);
  }

  // ---------------- Protocol helpers ----------------

  public void sendLogin(String user, String pass) {
    JsonObject o = new JsonObject();
    o.addProperty(Protocol.TYPE, Protocol.LOGIN);
    o.addProperty(Protocol.USER, user);
    o.addProperty(Protocol.PASS, pass);
    send(o);
  }

  public void sendSignup(String user, String pass) {
    JsonObject o = new JsonObject();
    o.addProperty(Protocol.TYPE, Protocol.SIGNUP);
    o.addProperty(Protocol.USER, user);
    o.addProperty(Protocol.PASS, pass);
    send(o);
  }

  public void requestUsers() {
    JsonObject o = new JsonObject();
    o.addProperty(Protocol.TYPE, Protocol.GET_USERS);
    send(o);
  }

  public void requestBroadcastHistory() {
    JsonObject o = new JsonObject();
    o.addProperty(Protocol.TYPE, Protocol.GET_BROADCAST_HISTORY);
    send(o);
  }

  public void requestPrivateHistory(String with) {
    JsonObject o = new JsonObject();
    o.addProperty(Protocol.TYPE, Protocol.GET_PRIVATE_HISTORY);
    o.addProperty(Protocol.WITH, with);
    send(o);
  }

  public void requestGroups() {
    JsonObject o = new JsonObject();
    o.addProperty(Protocol.TYPE, Protocol.GET_GROUPS);
    send(o);
  }

  public void requestGroupHistory(String groupId) {
    JsonObject o = new JsonObject();
    o.addProperty(Protocol.TYPE, Protocol.GET_GROUP_HISTORY);
    o.addProperty(Protocol.GROUP_ID, groupId);
    send(o);
  }

  public void sendBroadcast(String content) {
    JsonObject o = new JsonObject();
    o.addProperty(Protocol.TYPE, Protocol.BROADCAST);
    o.addProperty("content", content);
    send(o);
  }

  public void sendPrivate(String to, String content) {
    JsonObject o = new JsonObject();
    o.addProperty(Protocol.TYPE, Protocol.PRIVATE);
    o.addProperty("to", to);
    o.addProperty("content", content);
    send(o);
  }

  public void sendGroupMessage(String groupId, String content) {
    JsonObject o = new JsonObject();
    o.addProperty(Protocol.TYPE, Protocol.GROUP_MESSAGE);
    o.addProperty(Protocol.GROUP_ID, groupId);
    o.addProperty("content", content);
    send(o);
  }

  public void sendTyping(String to, String state) {
    JsonObject o = new JsonObject();
    o.addProperty(Protocol.TYPE, Protocol.TYPING);
    o.addProperty("to", to);
    o.addProperty("state", state);
    send(o);
  }

  public void createGroup(String name, com.google.gson.JsonArray members) {
    JsonObject o = new JsonObject();
    o.addProperty(Protocol.TYPE, Protocol.CREATE_GROUP);
    o.addProperty("name", name);
    o.add("members", members == null ? new com.google.gson.JsonArray() : members);
    send(o);
  }

  // NEW: clear-for-me helper
  public void sendClearChat(String scope, String with, String groupId) {
    JsonObject o = new JsonObject();
    o.addProperty(Protocol.TYPE, Protocol.CLEAR_CHAT);
    o.addProperty(Protocol.SCOPE, scope == null ? "" : scope);
    if (with != null) o.addProperty(Protocol.WITH, with);
    if (groupId != null) o.addProperty(Protocol.GROUP_ID, groupId);
    send(o);
  }

  private void log(String s) {
    try { onLog.accept(s); } catch (Exception ignored) {}
  }
}