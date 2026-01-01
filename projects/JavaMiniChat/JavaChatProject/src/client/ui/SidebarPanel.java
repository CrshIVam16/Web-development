package client.ui;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Component;
import java.awt.Dimension;
import java.awt.FontMetrics;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.swing.DefaultListModel;
import javax.swing.JComponent;
import javax.swing.JList;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.ListCellRenderer;
import javax.swing.ListSelectionModel;
import javax.swing.JLabel;
import javax.swing.border.EmptyBorder;

import common.TextUtil;
import common.Theme;

/**
 * SidebarPanel (WhatsApp-like, no last-message preview):
 * - Broadcast / Groups / Users
 * - Avatar circle (initials for now; image support will be added in step 3)
 * - Online dot (users)
 * - Unread badge
 *
 * Compatibility:
 * - Keeps setPreviews(...) as a NO-OP so older code compiles.
 */
public class SidebarPanel extends JPanel {

  private static final String VERSION = "SidebarPanel v3.1";

  public enum ItemType { BROADCAST, GROUP, USER }

  public static final class Item {
    public final ItemType type;
    public final String id;      // groupId for GROUP, username for USER, null for BROADCAST
    public final String label;   // display label (for now: username / group name)

    public Item(ItemType type, String id, String label) {
      this.type = type;
      this.id = id;
      this.label = label;
    }
  }

  public interface SelectionListener {
    void onSelected(Item item);
  }

  private final DefaultListModel<Item> model = new DefaultListModel<>();
  private final JList<Item> list = new JList<>(model);

  private SelectionListener listener = item -> {};

  private Set<String> onlineUsers = java.util.Set.of();

  private int broadcastUnread = 0;
  private Map<String, Integer> userUnread = java.util.Map.of();
  private Map<String, Integer> groupUnread = java.util.Map.of();

  // Previews removed visually; kept only so older code compiles
  @SuppressWarnings("unused")
  private String broadcastPreview = "";
  @SuppressWarnings("unused")
  private Map<String, String> userPreview = java.util.Map.of();
  @SuppressWarnings("unused")
  private Map<String, String> groupPreview = java.util.Map.of();

  public SidebarPanel() {
    super(new BorderLayout());
    buildUI();
  }

  public void setOnSelected(SelectionListener listener) {
    this.listener = (listener == null) ? (i -> {}) : listener;
  }

  public void setOnlineUsers(Set<String> onlineUsers) {
    this.onlineUsers = (onlineUsers == null) ? java.util.Set.of() : onlineUsers;
    list.repaint();
  }

  public void setUnreadCounts(int broadcastUnread,
                              Map<String, Integer> userUnread,
                              Map<String, Integer> groupUnread) {
    this.broadcastUnread = Math.max(0, broadcastUnread);
    this.userUnread = (userUnread == null) ? java.util.Map.of() : userUnread;
    this.groupUnread = (groupUnread == null) ? java.util.Map.of() : groupUnread;
    list.repaint();
  }

  /** NO-OP: previews intentionally not shown anymore. */
  public void setPreviews(String broadcastPreview,
                          Map<String, String> userPreview,
                          Map<String, String> groupPreview) {
    this.broadcastPreview = broadcastPreview == null ? "" : broadcastPreview;
    this.userPreview = (userPreview == null) ? java.util.Map.of() : userPreview;
    this.groupPreview = (groupPreview == null) ? java.util.Map.of() : groupPreview;
  }

  public void setItems(List<Item> groups, List<String> users) {
    model.clear();
    model.addElement(new Item(ItemType.BROADCAST, null, "Broadcast"));
    if (groups != null) for (Item g : groups) model.addElement(g);
    if (users != null) for (String u : users) model.addElement(new Item(ItemType.USER, u, u));
  }

  public static List<Item> groupItems(Map<String, String> groupIdToName) {
    List<Item> out = new ArrayList<>();
    if (groupIdToName == null) return out;

    for (Map.Entry<String, String> e : groupIdToName.entrySet()) {
      String gid = e.getKey();
      String name = e.getValue();
      if (gid == null || gid.isBlank() || name == null || name.isBlank()) continue;
      out.add(new Item(ItemType.GROUP, gid, name.trim()));
    }
    return out;
  }

  public void selectBroadcast() {
    if (model.getSize() > 0) list.setSelectedIndex(0);
  }

  private void buildUI() {
    list.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
    list.setBackground(Theme.BG_SIDEBAR);
    list.setForeground(Theme.TEXT_MAIN);

    // Compact rows (no preview line)
    list.setFixedCellHeight(60);

    list.setCellRenderer(new SidebarRenderer());

    list.addListSelectionListener(e -> {
      if (e.getValueIsAdjusting()) return;
      Item item = list.getSelectedValue();
      if (item != null) listener.onSelected(item);
    });

    JScrollPane scroll = new JScrollPane(list);
    scroll.setPreferredSize(new Dimension(280, 0));
    scroll.getViewport().setBackground(Theme.BG_SIDEBAR);

    add(scroll, BorderLayout.CENTER);

    JLabel version = new JLabel(" " + VERSION);
    version.setForeground(Theme.TEXT_MUTED);
    version.setFont(Theme.fontBody(11));
    version.setBorder(new EmptyBorder(4, 6, 4, 6));
    version.setOpaque(true);
    version.setBackground(Theme.BG_SIDEBAR);
    add(version, BorderLayout.SOUTH);
  }

  private final class SidebarRenderer implements ListCellRenderer<Item> {
    private final Cell cell = new Cell();

    @Override
    public Component getListCellRendererComponent(JList<? extends Item> list, Item item, int index,
        boolean isSelected, boolean cellHasFocus) {

      cell.setBackground(isSelected ? Theme.SELECTED : Theme.BG_SIDEBAR);

      int unread = 0;
      boolean online = false;
      String title;

      switch (item.type) {
        case BROADCAST -> {
          title = "Broadcast";
          unread = broadcastUnread;
          cell.setAvatarLetters("B");
          cell.setOnlineDot(false);
        }
        case GROUP -> {
          title = item.label == null ? "Group" : item.label;
          unread = unread(groupUnread, item.id);
          cell.setAvatarLetters(initials(title, "G"));
          cell.setOnlineDot(false);
        }
        case USER -> {
          title = item.label == null ? "" : item.label;
          unread = unread(userUnread, item.id);
          online = item.id != null && onlineUsers.contains(item.id);
          cell.setAvatarLetters(initials(title, "?"));
          cell.setOnlineDot(online);
        }
        default -> {
          title = item.label == null ? "" : item.label;
          cell.setAvatarLetters(initials(title, "?"));
          cell.setOnlineDot(false);
        }
      }

      cell.setTitle(title);
      cell.setBadge(unread);

      return cell;
    }
  }

  private static int unread(Map<String, Integer> map, String key) {
    if (map == null || key == null) return 0;
    Integer v = map.get(key);
    return v == null ? 0 : Math.max(0, v);
  }

  private static String initials(String name, String fallback) {
    name = TextUtil.cleanOneLine(name);
    if (name.isEmpty()) return fallback;

    String[] parts = name.split("\\s+");
    char first = Character.toUpperCase(parts[0].charAt(0));
    if (parts.length == 1) return String.valueOf(first);

    char last = Character.toUpperCase(parts[parts.length - 1].charAt(0));
    return "" + first + last;
  }

  // ---------- Cell ----------

  private static final class Cell extends JPanel {
    private final Avatar avatar = new Avatar();
    private final JLabel title = new JLabel();
    private final Pill badge = new Pill();

    Cell() {
      super(new BorderLayout(10, 0));
      setBorder(new EmptyBorder(10, 12, 10, 12));
      setOpaque(true);

      title.setFont(Theme.fontBody(14));
      title.setForeground(Theme.TEXT_MAIN);

      JPanel center = new JPanel(new BorderLayout());
      center.setOpaque(false);
      center.add(title, BorderLayout.CENTER);

      JPanel right = new JPanel(new BorderLayout());
      right.setOpaque(false);
      right.add(badge, BorderLayout.NORTH);

      add(avatar, BorderLayout.WEST);
      add(center, BorderLayout.CENTER);
      add(right, BorderLayout.EAST);

      setBadge(0);
      setAvatarLetters("?");
      setOnlineDot(false);
    }

    void setTitle(String t) { title.setText(t == null ? "" : t); }
    void setBadge(int n) { badge.setCount(n); }
    void setAvatarLetters(String letters) { avatar.setLetters(letters); }
    void setOnlineDot(boolean online) { avatar.setOnline(online); }
  }

  // ---------- Avatar ----------

  private static final class Avatar extends JComponent {
    private String letters = "?";
    private boolean online = false;

    Avatar() {
      setPreferredSize(new Dimension(40, 40));
      setMinimumSize(new Dimension(40, 40));
      setOpaque(false);
    }

    void setLetters(String s) {
      this.letters = (s == null || s.isBlank()) ? "?" : s.trim();
      repaint();
    }

    void setOnline(boolean online) {
      this.online = online;
      repaint();
    }

    @Override
    protected void paintComponent(Graphics g) {
      Graphics2D g2 = (Graphics2D) g.create();
      g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

      int size = Math.min(getWidth(), getHeight());

      // Circle background
      g2.setColor(Theme.SURFACE_2);
      g2.fillOval(0, 0, size, size);

      // Letters
      g2.setColor(Theme.TEXT_MAIN);
      g2.setFont(Theme.fontBold(14));
      FontMetrics fm = g2.getFontMetrics();
      String t = letters;
      int tw = fm.stringWidth(t);
      int tx = (size - tw) / 2;
      int ty = (size + fm.getAscent() - fm.getDescent()) / 2;
      g2.drawString(t, tx, ty);

      // Online dot (bottom-right)
      int dot = 10;
      int dx = size - dot - 2;
      int dy = size - dot - 2;

      g2.setColor(online ? Theme.DOT_ONLINE : Theme.DOT_OFFLINE);
      g2.fillOval(dx, dy, dot, dot);

      // Small outline to separate from avatar circle
      g2.setColor(Theme.BG_SIDEBAR);
      g2.drawOval(dx, dy, dot, dot);

      g2.dispose();
    }
  }

  // ---------- Unread badge ----------

  private static final class Pill extends JComponent {
    private int count = 0;

    Pill() {
      setOpaque(false);
      setBorder(new EmptyBorder(2, 8, 2, 8));
      setFont(Theme.fontBold(12));
      setForeground(new Color(10, 10, 10));
      setVisible(false);
    }

    void setCount(int n) {
      count = Math.max(0, n);
      setVisible(count > 0);
      revalidate();
      repaint();
    }

    @Override
    public Dimension getPreferredSize() {
      if (count <= 0) return new Dimension(0, 0);
      FontMetrics fm = getFontMetrics(getFont());
      String s = String.valueOf(count);
      return new Dimension(fm.stringWidth(s) + 16, fm.getHeight() + 4);
    }

    @Override
    protected void paintComponent(Graphics g) {
      if (count <= 0) return;

      Graphics2D g2 = (Graphics2D) g.create();
      g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

      int w = getWidth(), h = getHeight();
      g2.setColor(Theme.ACCENT_GREEN);
      g2.fillRoundRect(0, 0, w, h, 18, 18);

      String s = String.valueOf(count);
      g2.setFont(getFont());
      FontMetrics fm = g2.getFontMetrics();
      int tx = (w - fm.stringWidth(s)) / 2;
      int ty = (h - fm.getHeight()) / 2 + fm.getAscent();

      g2.setColor(getForeground());
      g2.drawString(s, tx, ty);
      g2.dispose();
    }
  }

  public static Map<String, String> newGroupMap() {
    return new LinkedHashMap<>();
  }
}