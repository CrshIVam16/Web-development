package server.net;
import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Socket server:
 * - Listens on a port
 * - Hands each client connection to ClientHandler using a thread pool
 *
 * Small hardening:
 * - reuseAddress (restart server quickly without "port in use" in some cases)
 * - set client socket options
 */
public final class Server {

  private Server() {}

  public static void start(int port) {
    ExecutorService pool = Executors.newCachedThreadPool(); // fine for small apps

    Runtime.getRuntime().addShutdownHook(new Thread(() -> {
      pool.shutdownNow();
      System.out.println("🛑 Server shutting down...");
    }));

    ServerSocket serverSocket = null;
    try {
      serverSocket = new ServerSocket(port);
      serverSocket.setReuseAddress(true);

      System.out.println("🚀 Server running on port " + port);

      while (true) {
        Socket clientSocket = serverSocket.accept();

        // Basic socket tuning
        try {
          clientSocket.setTcpNoDelay(true);
          clientSocket.setKeepAlive(true);
        } catch (Exception ignored) {}

        pool.execute(new ClientHandler(clientSocket));
      }
    } catch (IOException e) {
      System.err.println("❌ Server failed: " + e.getMessage());
      e.printStackTrace();
    } finally {
      try { if (serverSocket != null) serverSocket.close(); } catch (Exception ignored) {}
      pool.shutdownNow();
    }
  }
}