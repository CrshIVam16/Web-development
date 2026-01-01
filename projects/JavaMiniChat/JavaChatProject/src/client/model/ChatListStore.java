package client.model;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import client.ui.SidebarPanel;

/**
 * ChatListStore:
 * Maintains what appears in the sidebar as a WhatsApp-like "chats list".
 *
 * - Broadcast is always present.
 * - Groups come from server (groupId -> name).
 * - Private chats (DMs) are created when:
 *   - user starts a new chat, OR
 *   - a private message is received from someone.
 *
 * Keeps insertion order and avoids duplicates.
 */
public final class ChatListStore {

  private final Set<String> dmUsers = new LinkedHashSet<>(); // usernames in chats list
  private final Map<String, String> groups = new LinkedHashMap<>(); // groupId -> name

  /** Add a DM chat partner to the list (idempotent). */
  public void ensureDm(String username) {
    if (username == null) return;
    username = username.trim();
    if (username.isEmpty()) return;
    dmUsers.add(username);
  }

  /** Replace groups from server payload (keeps insertion order of provided map). */
  public void setGroups(Map<String, String> groupIdToName) {
    groups.clear();
    if (groupIdToName != null) groups.putAll(groupIdToName);
  }

  /** Returns sidebar group items using SidebarPanel helper. */
  public List<SidebarPanel.Item> toGroupItems() {
    return SidebarPanel.groupItems(groups);
  }

  /** Returns DMs list in display order. */
  public List<String> getDmUsers() {
    return new ArrayList<>(dmUsers);
  }

  /** Returns group map if needed. */
  public Map<String, String> getGroups() {
    return new LinkedHashMap<>(groups);
  }

  /** Clears all (used on logout). */
  public void clear() {
    dmUsers.clear();
    groups.clear();
  }
}