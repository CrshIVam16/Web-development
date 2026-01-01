package server.db;
import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.IndexOptions;
import com.mongodb.client.model.Indexes;

import org.bson.Document;

/**
 * Server-side MongoDB connection holder.
 * - init() once at server start
 * - provides access to collections
 * - creates required indexes (safe to call multiple times)
 */
public final class MongoManager {
  private static MongoClient client;
  private static MongoDatabase db;

  private MongoManager() {}

  public static synchronized void init(String mongoUri, String dbName) {
    if (client != null) return; // already initialized

    MongoClientSettings settings = MongoClientSettings.builder()
        .applyConnectionString(new ConnectionString(mongoUri))
        .build();

    client = MongoClients.create(settings);
    db = client.getDatabase(dbName);

    ensureIndexes();
    System.out.println("✅ Mongo connected: " + mongoUri + " / " + dbName);
  }

  public static MongoDatabase db() {
    if (db == null) throw new IllegalStateException("MongoManager not initialized");
    return db;
  }

  // ---- Collections used by the app ----

  public static MongoCollection<Document> users() {
    return db().getCollection("users");
  }

  public static MongoCollection<Document> broadcastMessages() {
    return db().getCollection("broadcast_messages");
  }

  public static MongoCollection<Document> privateMessages() {
    return db().getCollection("private_messages");
  }

  public static MongoCollection<Document> groups() {
    return db().getCollection("groups");
  }

  public static MongoCollection<Document> groupMessages() {
    return db().getCollection("group_messages");
  }

  // NEW: clear-for-me markers
  public static MongoCollection<Document> chatClears() {
    return db().getCollection("chat_clears");
  }

  /** Create indexes used by the app (idempotent). */
  private static void ensureIndexes() {
    // users.username unique
    users().createIndex(Indexes.ascending("username"), new IndexOptions().unique(true));

    // broadcast: sort by time
    broadcastMessages().createIndex(Indexes.ascending("ts"));

    // private: conversationId + time
    privateMessages().createIndex(Indexes.ascending("conversationId", "ts"));
    privateMessages().createIndex(Indexes.ascending("receiver", "ts"));

    // groups: find groups by member quickly
    groups().createIndex(Indexes.ascending("members"));
    groups().createIndex(Indexes.ascending("name"));

    // group messages: load by groupId + time
    groupMessages().createIndex(Indexes.ascending("groupId", "ts"));

    // clear markers:
    // We'll store a stable unique "key" (e.g., "user|scope|id") so upsert is easy.
    chatClears().createIndex(Indexes.ascending("key"), new IndexOptions().unique(true));
    chatClears().createIndex(Indexes.ascending("user", "scope"));
    chatClears().createIndex(Indexes.ascending("clearedAt"));
  }

  public static synchronized void close() {
    if (client != null) client.close();
    client = null;
    db = null;
  }
}