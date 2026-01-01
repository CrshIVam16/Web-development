package client.ui;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.FontMetrics;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.awt.RenderingHints;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.swing.JComponent;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JMenuItem;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JPopupMenu;
import javax.swing.JTextField;
import javax.swing.SwingUtilities;
import javax.swing.border.EmptyBorder;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import client.model.ChatListStore;
import client.model.MessageItem;
import client.net.ChatClient;
import client.storage.LocalHiddenStore;
import client.ui.ChatHtmlRenderer.Mode;
import common.MessageFormat;
import common.Protocol;
import common.TextUtil;
import common.Theme;

/**
 * Includes:
 * - Sidebar shows ALL users (contacts), no previews
 * - Separate signup dialog (SignupDialog)
 * - Fix: suppress "Disconnected" popup when auth fails
 * - Clear-for-me: Clear Chat dropdown (clear current chat / clear all) using
 * Protocol.CLEAR_CHAT
 */
public class ClientGUI extends JFrame {

  private final String host;
  private final int port;
  private LocalHiddenStore hiddenStore;

  private ChatClient client;
  private boolean manualDisconnect = false;

  private String pendingClearScope = null;
  private String pendingClearWith = null;
  private String pendingClearGroupId = null;

  // Fix auth-fail double popup
  private volatile boolean suppressDisconnectPopupOnce = false;
  private volatile boolean awaitingAuth = false;

  private String myUsername;

  private enum ChatType {
    BROADCAST, PRIVATE, GROUP
  }

  private ChatType currentType = ChatType.BROADCAST;
  private String currentPartner; // PRIVATE
  private String currentGroupId; // GROUP

  // Groups list comes from server
  private final ChatListStore chatList = new ChatListStore();

  // All users from server (contacts list)
  private final List<String> allUsers = new ArrayList<>();

  // Presence + unread
  private final Set<String> onlineUsers = new HashSet<>();
  private int broadcastUnread = 0;
  private final Map<String, Integer> privateUnread = new HashMap<>();
  private final Map<String, Integer> groupUnread = new HashMap<>();

  // Broadcast cache (client-side convenience)
  private final List<String> broadcastCache = new ArrayList<>();

  // ---- UI: Auth ----
  private JPanel authPanel;
  private JTextField userField;
  private JPasswordField passField;
  private javax.swing.JButton loginBtn;
  private javax.swing.JButton signupBtn;

  // ---- UI: App ----
  private JPanel appPanel;
  private SidebarPanel sidebar;
  private ChatPanel chatPanel;

  private JLabel topTitle;
  private javax.swing.JButton logoutBtn;
  private javax.swing.JButton newGroupBtn;
  private javax.swing.JButton clearChatBtn;

  public ClientGUI(String host, int port) {
    this.host = host;
    this.port = port;

    setupWindow();
    showAuthUI();
    setVisible(true);
  }

  private void setupWindow() {
    setTitle("ChitChat");
    setSize(950, 700);
    setLocationRelativeTo(null);
    setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);

    addWindowListener(new WindowAdapter() {
      @Override
      public void windowClosing(WindowEvent e) {
        logout(false);
      }
    });
  }

  private void deleteSelectedForMe(java.util.List<MessageItem> items) {
    if (items == null || items.isEmpty())
      return;

    int r = JOptionPane.showConfirmDialog(
        this,
        "Delete selected messages (for you only)?",
        "Delete for me",
        JOptionPane.OK_CANCEL_OPTION);
    if (r != JOptionPane.OK_OPTION)
      return;

    String chatKey = currentChatKey();

    if (hiddenStore != null) {
      for (MessageItem m : items) {
        if (m != null)
          hiddenStore.hide(chatKey, m.raw);
      }
      hiddenStore.save();
    }

    for (MessageItem m : items) {
      if (m != null)
        chatPanel.deleteLocal(m.id);
    }
  }

  // ========================= Auth UI =========================

  private void showAuthUI() {
    resetState();

    authPanel = new JPanel(new GridBagLayout());
    authPanel.setBackground(Theme.BG_APP);
    authPanel.setBorder(new EmptyBorder(80, 80, 80, 80));

    GridBagConstraints gbc = new GridBagConstraints();
    gbc.insets = new Insets(15, 15, 15, 15);
    gbc.fill = GridBagConstraints.HORIZONTAL;

    gbc.gridx = 0;
    gbc.gridy = 0;
    authPanel.add(label("Username:"), gbc);

    gbc.gridx = 1;
    userField = new JTextField(20);
    UiComponents.styleTextField(userField, Theme.RADIUS_LG);
    authPanel.add(userField, gbc);

    gbc.gridx = 0;
    gbc.gridy = 1;
    authPanel.add(label("Password:"), gbc);

    gbc.gridx = 1;
    passField = new JPasswordField(20);
    UiComponents.styleTextField(passField, Theme.RADIUS_LG);
    authPanel.add(passField, gbc);

    gbc.gridx = 0;
    gbc.gridy = 2;
    loginBtn = UiComponents.roundedButton("Login", Theme.ACCENT_GREEN, Theme.RADIUS_LG);
    authPanel.add(loginBtn, gbc);

    gbc.gridx = 1;
    signupBtn = UiComponents.roundedButton("Sign Up", Theme.ACCENT_TEAL, Theme.RADIUS_LG);
    authPanel.add(signupBtn, gbc);

    loginBtn.addActionListener(e -> startLogin());
    signupBtn.addActionListener(e -> startSignup());

    getContentPane().removeAll();
    setLayout(new BorderLayout());
    add(authPanel, BorderLayout.CENTER);

    revalidate();
    repaint();
  }

  private JLabel label(String text) {
    JLabel l = new JLabel(text);
    l.setFont(Theme.fontBold(16));
    l.setForeground(Theme.TEXT_MAIN);
    return l;
  }

  private void startLogin() {
    String u = TextUtil.safe(userField.getText()).trim();
    String p = new String(passField.getPassword());

    if (u.isEmpty() || p.isBlank()) {
      JOptionPane.showMessageDialog(this, "Fill username + password");
      return;
    }

    JsonObject req = new JsonObject();
    req.addProperty(Protocol.TYPE, Protocol.LOGIN);
    req.addProperty(Protocol.USER, u);
    req.addProperty(Protocol.PASS, p);

    setAuthButtonsEnabled(false);
    awaitingAuth = true;
    new Thread(() -> doAuth(req), "auth-login-thread").start();
  }

  private void startSignup() {
    SignupDialog.Result r = SignupDialog.show(this);
    if (r == null)
      return;

    JsonObject req = new JsonObject();
    req.addProperty(Protocol.TYPE, Protocol.SIGNUP);
    req.addProperty(Protocol.USER, r.username);
    req.addProperty(Protocol.PASS, r.password);

    setAuthButtonsEnabled(false);
    awaitingAuth = true;
    new Thread(() -> doAuth(req), "auth-signup-thread").start();
  }

  private void setAuthButtonsEnabled(boolean enabled) {
    if (loginBtn != null)
      loginBtn.setEnabled(enabled);
    if (signupBtn != null)
      signupBtn.setEnabled(enabled);
  }

  /** Generic auth: connect -> send signup/login as FIRST message. */
  private void doAuth(JsonObject authReq) {
    try {
      disconnect(true);

      client = new ChatClient(host, port);
      client.setOnMessage(msg -> ui(() -> handleServerMessage(msg)));
      client.setOnDisconnect(ex -> ui(() -> {
        // If disconnect happens during login/signup flow, don't show "Disconnected".
        if (awaitingAuth) {
          awaitingAuth = false;
          setAuthButtonsEnabled(true);
          showAuthUI();
          return;
        }

        if (suppressDisconnectPopupOnce) {
          suppressDisconnectPopupOnce = false;
          return;
        }

        if (!manualDisconnect) {
          JOptionPane.showMessageDialog(this, "Disconnected");
          showAuthUI();
        }
      }));

      client.connect();
      client.send(authReq);

    } catch (Exception ex) {
      ui(() -> {
        JOptionPane.showMessageDialog(this, "Server unreachable");
        setAuthButtonsEnabled(true);
      });
      ex.printStackTrace();

      suppressDisconnectPopupOnce = true;
      disconnect(true);
    }
  }

  // ========================= App UI =========================

  private void showAppUI() {
    appPanel = new JPanel(new BorderLayout());
    appPanel.setBackground(Theme.BG_APP);

    JPanel top = new JPanel(new BorderLayout());
    top.setBackground(Theme.BG_HEADER);
    top.setBorder(new EmptyBorder(10, 12, 10, 12));

    JPanel left = new JPanel(new FlowLayout(FlowLayout.LEFT, 12, 0));
    left.setOpaque(false);
    left.add(new InitialsAvatar(() -> myUsername));

    topTitle = new JLabel("ChitChat");
    topTitle.setForeground(Theme.TEXT_MAIN);
    topTitle.setFont(Theme.fontTitle(16));
    left.add(topTitle);

    top.add(left, BorderLayout.WEST);

    JPanel right = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 0));
    right.setOpaque(false);

    newGroupBtn = UiComponents.roundedButton("New Group", Theme.SURFACE_2, Theme.RADIUS_LG);
    newGroupBtn.addActionListener(e -> openCreateGroupDialog());

    clearChatBtn = UiComponents.roundedButton("Clear Chat", Theme.SURFACE_2, Theme.RADIUS_LG);
    clearChatBtn.addActionListener(e -> openClearChatMenu());

    logoutBtn = UiComponents.roundedButton("Logout", Theme.DANGER, Theme.RADIUS_LG);
    logoutBtn.addActionListener(e -> logout(true));

    right.add(newGroupBtn);
    right.add(clearChatBtn);
    right.add(logoutBtn);

    top.add(right, BorderLayout.EAST);
    appPanel.add(top, BorderLayout.NORTH);

    sidebar = new SidebarPanel();
    sidebar.setOnSelected(this::onSidebarSelected);

    chatPanel = new ChatPanel();
    chatPanel.setMyUsername(myUsername);
    chatPanel.setOnSend(this::onSendFromChatPanel);
    chatPanel.setOnTyping(isTyping -> {
      if (client == null)
        return;
      if (currentType != ChatType.PRIVATE || currentPartner == null)
        return;
      client.sendTyping(currentPartner, isTyping ? "start" : "stop");
    });
    chatPanel.setOnDeleteSelected(this::deleteSelectedForMe);
    chatPanel.setOnDeleteForMe(id -> {
      MessageItem mi = chatPanel.getMessageById(id);
      if (mi != null && hiddenStore != null) {
        hiddenStore.hide(currentChatKey(), mi.raw);
        hiddenStore.save();
      }
      chatPanel.deleteLocal(id);
    });

    javax.swing.JSplitPane split = new javax.swing.JSplitPane(
        javax.swing.JSplitPane.HORIZONTAL_SPLIT, sidebar, chatPanel);
    split.setDividerLocation(280);
    split.setResizeWeight(0);
    split.setBorder(null);

    appPanel.add(split, BorderLayout.CENTER);

    getContentPane().removeAll();
    add(appPanel, BorderLayout.CENTER);

    refreshSidebar();
    sidebar.selectBroadcast();

    revalidate();
    repaint();
  }

  private void openClearChatMenu() {
    if (client == null)
      return;

    JPopupMenu menu = new JPopupMenu();

    JMenuItem selectMsgs = new JMenuItem("Select messages to delete (for me)");
    selectMsgs.addActionListener(e -> {
      if (chatPanel != null)
        chatPanel.startSelectingMessages();
    });
    menu.add(selectMsgs);

    JMenuItem clearChat = new JMenuItem("Clear entire chat (for me)");
    clearChat.addActionListener(e -> clearCurrentChatForMe()); // clears only the currently open chat
    menu.add(clearChat);

    menu.show(clearChatBtn, 0, clearChatBtn.getHeight());
  }

  private void clearCurrentChatForMe() {
    if (client == null)
      return;

    switch (currentType) {
      case BROADCAST -> {
        pendingClearScope = "broadcast";
        pendingClearWith = null;
        pendingClearGroupId = null;
        sendClearRequest("broadcast", null, null);
      }
      case PRIVATE -> {
        if (currentPartner == null || currentPartner.isBlank()) {
          JOptionPane.showMessageDialog(this, "Select a user chat first");
          return;
        }
        pendingClearScope = "private";
        pendingClearWith = currentPartner;
        pendingClearGroupId = null;
        sendClearRequest("private", currentPartner, null);
      }
      case GROUP -> {
        if (currentGroupId == null || currentGroupId.isBlank()) {
          JOptionPane.showMessageDialog(this, "Select a group first");
          return;
        }
        pendingClearScope = "group";
        pendingClearWith = null;
        pendingClearGroupId = currentGroupId;
        sendClearRequest("group", null, currentGroupId);
      }
    }
  }

  private String currentChatKey() {
    return switch (currentType) {
      case BROADCAST -> "broadcast";
      case PRIVATE -> "private:" + (currentPartner == null ? "" : currentPartner.trim());
      case GROUP -> "group:" + (currentGroupId == null ? "" : currentGroupId.trim());
    };
  }

  private boolean isHiddenFor(String chatKey, String raw) {
    return hiddenStore != null && hiddenStore.isHidden(chatKey, raw);
  }

  private java.util.List<String> filterHidden(String chatKey, java.util.List<String> rawMessages) {
    if (rawMessages == null || rawMessages.isEmpty() || hiddenStore == null)
      return rawMessages;
    java.util.List<String> out = new java.util.ArrayList<>();
    for (String s : rawMessages) {
      if (!hiddenStore.isHidden(chatKey, s))
        out.add(s);
    }
    return out;
  }

  private void clearAllChatsForMe() {
    if (client == null)
      return;

    pendingClearScope = "all";
    pendingClearWith = null;
    pendingClearGroupId = null;

    sendClearRequest("all", null, null);
  }

  private void sendClearRequest(String scope, String with, String groupId) {
    JsonObject o = new JsonObject();
    o.addProperty(Protocol.TYPE, Protocol.CLEAR_CHAT);
    o.addProperty(Protocol.SCOPE, scope);
    if (with != null)
      o.addProperty(Protocol.WITH, with);
    if (groupId != null)
      o.addProperty(Protocol.GROUP_ID, groupId);
    client.send(o);
  }

  private void onSidebarSelected(SidebarPanel.Item item) {
    if (item == null)
      return;

    switch (item.type) {
      case BROADCAST -> {
        currentType = ChatType.BROADCAST;
        currentPartner = null;
        currentGroupId = null;

        chatPanel.setMyUsername(myUsername);
        chatPanel.setMode(ChatHtmlRenderer.Mode.BROADCAST);
        chatPanel.setTypingEnabled(false);
        chatPanel.setHeaderText("Broadcast");

        broadcastUnread = 0;
        setTitleUnread();
        refreshSidebarCountsOnly();

        if (!broadcastCache.isEmpty())
          chatPanel.showHistory(broadcastCache);
        else if (client != null)
          client.requestBroadcastHistory();
      }

      case GROUP -> {
        currentType = ChatType.GROUP;
        currentPartner = null;
        currentGroupId = item.id;

        chatPanel.setMyUsername(myUsername);
        chatPanel.setMode(ChatHtmlRenderer.Mode.GROUP);
        chatPanel.setTypingEnabled(false);
        chatPanel.setHeaderText("[G] " + (item.label == null ? "Group" : item.label));

        if (currentGroupId != null)
          groupUnread.remove(currentGroupId);
        refreshSidebarCountsOnly();

        if (client != null && currentGroupId != null)
          client.requestGroupHistory(currentGroupId);
      }

      case USER -> {
        currentType = ChatType.PRIVATE;
        currentGroupId = null;
        currentPartner = item.id;

        chatPanel.setMyUsername(myUsername);
        chatPanel.setMode(ChatHtmlRenderer.Mode.PRIVATE);
        chatPanel.setTypingEnabled(true);
        chatPanel.setHeaderText("Chat with: " + currentPartner);

        if (currentPartner != null)
          privateUnread.remove(currentPartner);
        refreshSidebarCountsOnly();

        if (client != null && currentPartner != null)
          client.requestPrivateHistory(currentPartner);
      }
    }
  }

  private void onSendFromChatPanel(String text) {
    if (client == null)
      return;
    text = TextUtil.cleanOneLine(text);
    if (text.isEmpty())
      return;

    switch (currentType) {
      case BROADCAST -> {
        client.sendBroadcast(text);
        chatPanel.clearInput();
      }

      case GROUP -> {
        if (currentGroupId == null) {
          JOptionPane.showMessageDialog(this, "Select a group");
          return;
        }
        client.sendGroupMessage(currentGroupId, text);
        chatPanel.clearInput();
      }

      case PRIVATE -> {
        if (currentPartner == null) {
          JOptionPane.showMessageDialog(this, "Select a user");
          return;
        }

        client.sendPrivate(currentPartner, text);

        if (myUsername != null) {
          String raw = MessageFormat.localFormatNow(myUsername, text);
          chatPanel.appendMessage(raw);
        }

        chatPanel.clearInput();
      }
    }
  }

  private void openCreateGroupDialog() {
    if (client == null)
      return;

    GroupDialog.Result r = GroupDialog.show(this, allUsers);
    if (r == null)
      return;

    JsonArray members = new JsonArray();
    for (String u : r.members)
      members.add(u);

    client.createGroup(r.name, members);
  }

  // ========================= Server messages =========================

  private void handleServerMessage(JsonObject msg) {
    String type = Protocol.typeOf(msg);
    if (type == null)
      return;

    switch (type) {
      case Protocol.AUTH -> {
        boolean ok = Protocol.getBool(msg, Protocol.OK, false);
        if (!ok) {
          String err = Protocol.getString(msg, "error");
          JOptionPane.showMessageDialog(this, err == null ? "Auth failed" : err);

          setAuthButtonsEnabled(true);

          suppressDisconnectPopupOnce = true;
          disconnect(true);
          showAuthUI();
          return;
        }

        String u = Protocol.getString(msg, Protocol.USER);
        myUsername = (u == null ? null : u.trim());
        hiddenStore = LocalHiddenStore.load(myUsername);

        showAppUI();

        if (client != null) {
          client.requestUsers();
          client.requestGroups();
          client.requestBroadcastHistory();
        }
      }

      case Protocol.USERS -> {
        allUsers.clear();
        allUsers.addAll(jsonArrayToList(msg.getAsJsonArray("list")));

        onlineUsers.clear();
        onlineUsers.addAll(jsonArrayToList(msg.getAsJsonArray(Protocol.ONLINE)));

        refreshSidebar();
      }

      case Protocol.GROUPS -> {
        LinkedHashMap<String, String> map = new LinkedHashMap<>();

        JsonArray arr = msg.getAsJsonArray("groups");
        if (arr != null) {
          for (JsonElement e : arr) {
            if (e == null || !e.isJsonObject())
              continue;
            JsonObject o = e.getAsJsonObject();
            String gid = o.has("groupId") ? o.get("groupId").getAsString() : null;
            String name = o.has("name") ? o.get("name").getAsString() : null;
            if (gid != null && !gid.isBlank() && name != null && !name.isBlank()) {
              map.put(gid.trim(), name.trim());
            }
          }
        }

        chatList.setGroups(map);
        refreshSidebar();
      }

      case Protocol.GROUP_CREATED -> {
        boolean ok = Protocol.getBool(msg, Protocol.OK, false);
        if (ok) {
          JOptionPane.showMessageDialog(this, "Group created!");
          if (client != null)
            client.requestGroups();
        } else {
          String err = Protocol.getString(msg, "error");
          JOptionPane.showMessageDialog(this, err == null ? "Failed to create group" : err);
        }
      }

      case Protocol.BROADCAST_HISTORY -> {
        List<String> msgs = jsonArrayToList(msg.getAsJsonArray("messages"));
        msgs = filterHidden("broadcast", msgs);

        broadcastCache.clear();
        broadcastCache.addAll(msgs);

        if (currentType == ChatType.BROADCAST && chatPanel != null) {
          chatPanel.showHistory(broadcastCache);
        }
      }

      case Protocol.BROADCAST_MSG -> {
        String m = Protocol.getString(msg, "message");
        if (m == null)
          return;
        if (isHiddenFor("broadcast", m))
          return;
        broadcastCache.add(m);

        if (currentType == ChatType.BROADCAST && chatPanel != null) {
          chatPanel.appendMessage(m);
        } else {
          broadcastUnread++;
          setTitleUnread();
          refreshSidebarCountsOnly();
        }
      }

      case Protocol.PRIVATE_HISTORY -> {
        String with = Protocol.getString(msg, Protocol.WITH);
        List<String> msgs = jsonArrayToList(msg.getAsJsonArray("messages"));

        msgs = filterHidden("private:" + (with == null ? "" : with.trim()), msgs);

        if (currentType == ChatType.PRIVATE && with != null && with.equals(currentPartner) && chatPanel != null) {
          chatPanel.showHistory(msgs);
        }
      }

      case Protocol.PRIVATE_MSG -> {
        String from = Protocol.getString(msg, "from");
        String m = Protocol.getString(msg, "message");
        if (from == null || m == null)
          return;
        if (isHiddenFor("private:" + from.trim(), m))
          return;

        if (currentType == ChatType.PRIVATE && from.equals(currentPartner) && chatPanel != null) {
          chatPanel.appendMessage(m);
        } else {
          privateUnread.put(from, privateUnread.getOrDefault(from, 0) + 1);
          refreshSidebarCountsOnly();
        }
      }

      case Protocol.GROUP_HISTORY -> {
        String gid = Protocol.getString(msg, Protocol.GROUP_ID);
        List<String> msgs = jsonArrayToList(msg.getAsJsonArray("messages"));

        msgs = filterHidden("group:" + (gid == null ? "" : gid.trim()), msgs);

        if (currentType == ChatType.GROUP && gid != null && gid.equals(currentGroupId) && chatPanel != null) {
          chatPanel.showHistory(msgs);
        }
      }

      case Protocol.GROUP_MSG -> {
        String gid = Protocol.getString(msg, Protocol.GROUP_ID);
        String m = Protocol.getString(msg, "message");
        if (gid == null || m == null)
          return;
        if (isHiddenFor("group:" + gid.trim(), m))
          return;
        if (currentType == ChatType.GROUP && gid.equals(currentGroupId) && chatPanel != null) {
          chatPanel.appendMessage(m);
        } else {
          groupUnread.put(gid, groupUnread.getOrDefault(gid, 0) + 1);
          refreshSidebarCountsOnly();
        }
      }

      case Protocol.TYPING -> {
        String from = Protocol.getString(msg, "from");
        String state = Protocol.getString(msg, "state");
        if (from == null || state == null)
          return;

        if (currentType == ChatType.PRIVATE && from.equals(currentPartner) && chatPanel != null) {
          chatPanel.setHeaderText("start".equals(state) ? (from + " is typing...") : ("Chat with: " + from));
        }
      }

      case Protocol.CLEAR_RESULT -> {
        boolean ok = Protocol.getBool(msg, Protocol.OK, false);
        if (!ok) {
          String err = Protocol.getString(msg, "error");
          JOptionPane.showMessageDialog(this, err == null ? "Clear failed" : err);

          // clear pending
          pendingClearScope = null;
          pendingClearWith = null;
          pendingClearGroupId = null;
          return;
        }

        // Server confirmed. Now clear locally in a predictable way.
        String scope = pendingClearScope;
        String with = pendingClearWith;
        String gid = pendingClearGroupId;

        pendingClearScope = null;
        pendingClearWith = null;
        pendingClearGroupId = null;

        if ("all".equals(scope)) {
          broadcastCache.clear();
          broadcastUnread = 0;
          privateUnread.clear();
          groupUnread.clear();
          if (chatPanel != null)
            chatPanel.clearLocal();
          refreshSidebarCountsOnly();
          return;
        }

        if ("broadcast".equals(scope)) {
          broadcastCache.clear();
          broadcastUnread = 0;
          if (currentType == ChatType.BROADCAST && chatPanel != null)
            chatPanel.clearLocal();
          refreshSidebarCountsOnly();
          return;
        }

        if ("private".equals(scope)) {
          if (with != null)
            privateUnread.remove(with);
          if (currentType == ChatType.PRIVATE && with != null && with.equals(currentPartner) && chatPanel != null) {
            chatPanel.clearLocal();
          }
          refreshSidebarCountsOnly();
          return;
        }

        if ("group".equals(scope)) {
          if (gid != null)
            groupUnread.remove(gid);
          if (currentType == ChatType.GROUP && gid != null && gid.equals(currentGroupId) && chatPanel != null) {
            chatPanel.clearLocal();
          }
          refreshSidebarCountsOnly();
        }
      }

      case Protocol.ERROR -> {
        String text = Protocol.getString(msg, "message");
        if (text != null)
          JOptionPane.showMessageDialog(this, text);
      }

      default -> {
        /* ignore */ }
    }
  }

  // ========================= Sidebar refresh =========================

  private void refreshSidebar() {
    if (sidebar == null)
      return;
    sidebar.setItems(chatList.toGroupItems(), allUsers);
    sidebar.setOnlineUsers(onlineUsers);
    sidebar.setUnreadCounts(broadcastUnread, privateUnread, groupUnread);
  }

  private void refreshSidebarCountsOnly() {
    if (sidebar == null)
      return;
    sidebar.setUnreadCounts(broadcastUnread, privateUnread, groupUnread);
  }

  // ========================= Logout/Disconnect =========================

  private void logout(boolean backToAuth) {
    disconnect(true);
    if (backToAuth)
      showAuthUI();
    else
      resetState();
  }

  private void disconnect(boolean silent) {
    manualDisconnect = true;
    try {
      if (client != null)
        client.disconnect();
    } catch (Exception ignored) {
    }
    client = null;
    manualDisconnect = false;
    if (!silent) {
      /* no-op */ }
  }

  private void resetState() {
    myUsername = null;
    currentType = ChatType.BROADCAST;
    currentPartner = null;
    currentGroupId = null;
    hiddenStore = null;

    broadcastCache.clear();
    allUsers.clear();

    broadcastUnread = 0;
    privateUnread.clear();
    groupUnread.clear();

    onlineUsers.clear();
    chatList.clear();

    setTitleUnread();
  }

  private void setTitleUnread() {
    String base = "ChitChat";
    if (broadcastUnread > 0)
      setTitle(base + " (Broadcast " + broadcastUnread + ")");
    else
      setTitle(base);
  }

  private void ui(Runnable r) {
    if (SwingUtilities.isEventDispatchThread())
      r.run();
    else
      SwingUtilities.invokeLater(r);
  }

  private static List<String> jsonArrayToList(JsonArray arr) {
    List<String> list = new ArrayList<>();
    if (arr != null)
      for (JsonElement e : arr)
        list.add(e.getAsString());
    return list;
  }

  // ========================= Avatar (top-left) =========================

  private static class InitialsAvatar extends JComponent {
    private final java.util.function.Supplier<String> nameSupplier;

    InitialsAvatar(java.util.function.Supplier<String> nameSupplier) {
      this.nameSupplier = nameSupplier;
      setPreferredSize(new Dimension(40, 40));
    }

    @Override
    protected void paintComponent(Graphics g) {
      Graphics2D g2 = (Graphics2D) g.create();
      g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

      int size = Math.min(getWidth(), getHeight());
      g2.setColor(Theme.ACCENT_GREEN);
      g2.fillOval(0, 0, size, size);

      String initials = initials(nameSupplier.get());

      g2.setColor(Color.WHITE);
      g2.setFont(Theme.fontBold(15));
      FontMetrics fm = g2.getFontMetrics();
      int w = fm.stringWidth(initials);
      int x = (size - w) / 2;
      int y = (size + fm.getAscent() - fm.getDescent()) / 2;
      g2.drawString(initials, x, y);

      g2.dispose();
    }

    private static String initials(String name) {
      if (name == null)
        return "?";
      name = name.trim();
      if (name.isEmpty())
        return "?";
      String[] parts = name.split("\\s+");
      char first = Character.toUpperCase(parts[0].charAt(0));
      if (parts.length == 1)
        return String.valueOf(first);
      char last = Character.toUpperCase(parts[parts.length - 1].charAt(0));
      return "" + first + last;
    }
  }
}