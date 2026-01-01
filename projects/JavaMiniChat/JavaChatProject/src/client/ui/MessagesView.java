package client.ui;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.FontMetrics;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.Toolkit;
import java.awt.datatransfer.StringSelection;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.IntConsumer;
import java.util.function.LongConsumer;

import javax.swing.BorderFactory;
import javax.swing.Box;
import javax.swing.BoxLayout;
import javax.swing.JCheckBox;
import javax.swing.JComponent;
import javax.swing.JLabel;
import javax.swing.JMenuItem;
import javax.swing.JPanel;
import javax.swing.JPopupMenu;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import javax.swing.SwingUtilities;
import javax.swing.border.EmptyBorder;

import client.model.MessageItem;
import client.ui.ChatHtmlRenderer.Mode;
import common.TextUtil;
import common.Theme;

/**
 * MessagesView:
 * - Bubble UI (no HTML)
 * - Date separators (TODAY/YESTERDAY/Date)
 * - Right-click: Copy, Delete-for-me (single)
 * - NEW: Selection mode with checkboxes for multi-delete (client-side)
 */
public class MessagesView extends JPanel {

  private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("h:mm a");
  private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("d MMM uuuu");

  private String myUsername;
  private ChatHtmlRenderer.Mode mode = ChatHtmlRenderer.Mode.PRIVATE;

  private final JPanel listPanel = new JPanel();
  private final JScrollPane scroll;

  private LongConsumer onDeleteForMe = id -> {
  };

  // Selection mode (multi-select)
  private boolean selectionMode = false;
  private final Set<Long> selectedIds = new HashSet<>();
  private IntConsumer onSelectionCountChanged = c -> {
  };

  // Local messages
  private final List<MessageItem> items = new ArrayList<>();

  public MessagesView() {
    super(new BorderLayout());
    setBackground(Theme.BG_APP);

    listPanel.setLayout(new BoxLayout(listPanel, BoxLayout.Y_AXIS));
    listPanel.setBackground(Theme.BG_APP);
    listPanel.setBorder(new EmptyBorder(12, 12, 12, 12));

    scroll = new JScrollPane(listPanel);
    scroll.getViewport().setBackground(Theme.BG_APP);
    scroll.setBorder(null);

    listPanel.setComponentPopupMenu(emptyAreaMenu());

    add(scroll, BorderLayout.CENTER);
  }

  public MessageItem getById(long id) {
    for (MessageItem m : items) {
      if (m != null && m.id == id)
        return m;
    }
    return null;
  }

  // ---------- configuration ----------

  public void setMyUsername(String myUsername) {
    this.myUsername = myUsername;
  }

  public void setMode(ChatHtmlRenderer.Mode mode) {
    this.mode = (mode == null) ? ChatHtmlRenderer.Mode.PRIVATE : mode;
    rebuild();
  }

  public void setOnDeleteForMe(LongConsumer onDeleteForMe) {
    this.onDeleteForMe = (onDeleteForMe == null) ? (id -> {
    }) : onDeleteForMe;
  }

  public void setSelectionMode(boolean enabled) {
    if (this.selectionMode == enabled)
      return;
    this.selectionMode = enabled;
    if (!enabled)
      clearSelection();
    rebuild();
  }

  public boolean isSelectionMode() {
    return selectionMode;
  }

  public void clearSelection() {
    selectedIds.clear();
    notifySelectionCount();
    rebuild();
  }

  public int getSelectedCount() {
    return selectedIds.size();
  }

  public List<MessageItem> getSelectedItems() {
    List<MessageItem> out = new ArrayList<>();
    for (MessageItem m : items) {
      if (selectedIds.contains(m.id))
        out.add(m);
    }
    return out;
  }

  public void setOnSelectionCountChanged(IntConsumer cb) {
    this.onSelectionCountChanged = (cb == null) ? (c -> {
    }) : cb;
  }

  private void notifySelectionCount() {
    try {
      onSelectionCountChanged.accept(selectedIds.size());
    } catch (Exception ignored) {
    }
  }

  // ---------- data ----------

  public void setMessages(List<MessageItem> newItems) {
    items.clear();
    if (newItems != null)
      items.addAll(newItems);
    clearSelection(); // also rebuilds
    scrollToBottom();
  }

  public void append(MessageItem item) {
    if (item == null)
      return;
    items.add(item);

    // simplest: rebuild so separators + selection UI stay consistent
    rebuild();
    scrollToBottomIfNearBottom();
  }

  public void deleteLocal(long id) {
    items.removeIf(m -> m.id == id);
    selectedIds.remove(id);
    notifySelectionCount();
    rebuild();
    scrollToBottomIfNearBottom();
  }

  public void clearAllLocal() {
    items.clear();
    clearSelection();
    rebuild();
  }

  // ---------- rendering ----------

  private void rebuild() {
    listPanel.removeAll();

    if (items.isEmpty()) {
      JLabel empty = new JLabel("No messages yet.");
      empty.setForeground(Theme.TEXT_SUB);
      empty.setFont(Theme.fontBody(14));
      empty.setBorder(new EmptyBorder(40, 0, 0, 0));
      empty.setAlignmentX(LEFT_ALIGNMENT);
      listPanel.add(empty);
      revalidate();
      repaint();
      return;
    }

    LocalDate last = null;

    for (MessageItem m : items) {
      LocalDate d = dateOf(m);

      if (last == null || !d.equals(last)) {
        listPanel.add(dateSeparator(d));
        listPanel.add(Box.createVerticalStrut(12));
        last = d;
      }

      listPanel.add(renderRow(m));
      listPanel.add(Box.createVerticalStrut(10));
    }

    revalidate();
    repaint();
  }

  private LocalDate dateOf(MessageItem m) {
    if (m == null || m.ts == null)
      return LocalDate.now();
    return m.ts.toLocalDate();
  }

  private JComponent dateSeparator(LocalDate d) {
    LocalDate today = LocalDate.now();

    String label;
    if (d == null)
      label = "TODAY";
    else if (d.equals(today))
      label = "TODAY";
    else if (d.equals(today.minusDays(1)))
      label = "YESTERDAY";
    else
      label = d.format(DATE_FMT);

    JLabel l = new JLabel(label);
    l.setForeground(Theme.TEXT_SUB);
    l.setFont(Theme.fontBold(12));
    l.setBorder(new EmptyBorder(4, 12, 4, 12));

    JPanel pill = new JPanel(new BorderLayout());
    pill.setOpaque(true);
    pill.setBackground(Theme.SURFACE_2);
    pill.setBorder(new EmptyBorder(2, 2, 2, 2));
    pill.add(l, BorderLayout.CENTER);

    JPanel wrap = new JPanel(new FlowLayout(FlowLayout.CENTER, 0, 0));
    wrap.setOpaque(false);
    wrap.add(pill);

    return wrap;
  }

  private JComponent renderRow(MessageItem m) {
    boolean isMe = m.isMine(myUsername);
    boolean selected = selectedIds.contains(m.id);

    JPanel row = new JPanel(new BorderLayout());
    row.setOpaque(false);
    row.setAlignmentX(LEFT_ALIGNMENT);

    // WhatsApp-like edge spacing
    int edgePad = 6;
    if (isMe)
      row.setBorder(new EmptyBorder(0, 80, 0, edgePad));
    else
      row.setBorder(new EmptyBorder(0, edgePad, 0, 80));

    Color bubbleBg = isMe ? Theme.ACCENT_GREEN : Theme.SURFACE_2;

    RoundedBubble bubble = new RoundedBubble(bubbleBg);
    bubble.setSelected(selected);
    bubble.setLayout(new BorderLayout());
    bubble.setBorder(new EmptyBorder(10, 12, 10, 12));
    bubble.setOpaque(false);

    // Sender line in group/broadcast only
    boolean showSenderLine = (mode != ChatHtmlRenderer.Mode.PRIVATE);
    if (showSenderLine) {
      JLabel name = new JLabel(isMe ? "You" : TextUtil.safe(m.sender));
      name.setForeground(Theme.TEXT_MAIN);
      name.setFont(Theme.fontBold(12));

      JPanel top = new JPanel(new BorderLayout());
      top.setOpaque(false);
      top.add(name, BorderLayout.WEST);
      bubble.add(top, BorderLayout.NORTH);
    }

    JTextArea text = new JTextArea(TextUtil.safe(m.content));
    text.setLineWrap(true);
    text.setWrapStyleWord(true);
    text.setEditable(false);
    text.setOpaque(false);
    text.setForeground(Theme.TEXT_MAIN);
    text.setFont(Theme.fontBody(14));
    text.setBorder(null);

    JLabel time = new JLabel(m.ts == null ? "" : m.ts.format(TIME_FMT));
    time.setForeground(new Color(210, 210, 210));
    time.setFont(Theme.fontBody(11));

    JPanel bottom = new JPanel(new BorderLayout());
    bottom.setOpaque(false);
    bottom.add(time, BorderLayout.EAST);

    bubble.add(text, BorderLayout.CENTER);
    bubble.add(bottom, BorderLayout.SOUTH);

    // Right-click menu on bubble (single-message actions)
    bubble.setComponentPopupMenu(messageMenu(m, isMe));

    // Checkbox for selection mode
    JCheckBox cb = null;
    if (selectionMode) {
      cb = new JCheckBox();
      cb.setOpaque(false);
      cb.setSelected(selected);
      cb.addActionListener(e -> toggleSelected(m.id));
    }

    // Wrap bubble + optional checkbox so it's aligned properly
    if (isMe) {
      JPanel wrap = new JPanel(new FlowLayout(FlowLayout.RIGHT, 6, 0));
      wrap.setOpaque(false);
      if (cb != null)
        wrap.add(cb);
      wrap.add(bubble);
      row.add(wrap, BorderLayout.EAST);
    } else {
      JPanel wrap = new JPanel(new FlowLayout(FlowLayout.LEFT, 6, 0));
      wrap.setOpaque(false);
      if (cb != null)
        wrap.add(cb);
      wrap.add(bubble);
      row.add(wrap, BorderLayout.WEST);
    }

    // Click bubble toggles selection if selection mode is on
    bubble.addMouseListener(new java.awt.event.MouseAdapter() {
      @Override
      public void mouseClicked(java.awt.event.MouseEvent e) {
        if (!selectionMode)
          return;
        toggleSelected(m.id);
      }
    });

    // Prevent vertical stretching in BoxLayout
    Dimension pref = row.getPreferredSize();
    row.setMaximumSize(new Dimension(Integer.MAX_VALUE, pref.height));

    return row;
  }

  private void toggleSelected(long id) {
    if (!selectionMode)
      return;
    if (selectedIds.contains(id))
      selectedIds.remove(id);
    else
      selectedIds.add(id);
    notifySelectionCount();
    rebuild();
  }

  private JPopupMenu messageMenu(MessageItem m, boolean isMe) {
    JPopupMenu menu = new JPopupMenu();

    JMenuItem copy = new JMenuItem("Copy");
    copy.addActionListener(e -> copyToClipboard(TextUtil.safe(m.content)));
    menu.add(copy);

    if (isMe) {
      JMenuItem del = new JMenuItem("Delete for me");
      del.addActionListener(e -> onDeleteForMe.accept(m.id));
      menu.add(del);
    }

    return menu;
  }

  private JPopupMenu emptyAreaMenu() {
    JPopupMenu menu = new JPopupMenu();
    JMenuItem copy = new JMenuItem("Copy");
    copy.setEnabled(false);
    menu.add(copy);
    return menu;
  }

  // ---------- scrolling ----------

  private void scrollToBottom() {
    SwingUtilities.invokeLater(() -> {
      var v = scroll.getVerticalScrollBar();
      v.setValue(v.getMaximum());
    });
  }

  private void scrollToBottomIfNearBottom() {
    SwingUtilities.invokeLater(() -> {
      var v = scroll.getVerticalScrollBar();
      int max = v.getMaximum();
      int val = v.getValue();
      int extent = v.getModel().getExtent();
      boolean nearBottom = val + extent >= max - 80;
      if (nearBottom)
        v.setValue(max);
    });
  }

  // ---------- utils ----------

  private static void copyToClipboard(String s) {
    try {
      Toolkit.getDefaultToolkit().getSystemClipboard().setContents(new StringSelection(s), null);
    } catch (Exception ignored) {
    }
  }

  // ---------- bubble painter ----------

  private static final class RoundedBubble extends JPanel {
    private final Color bg;
    private final int radius = 18;
    private boolean selected = false;

    RoundedBubble(Color bg) {
      super();
      this.bg = bg;
    }

    void setSelected(boolean selected) {
      this.selected = selected;
      repaint();
    }

    @Override
    protected void paintComponent(Graphics g) {
      // background
      Graphics2D g2 = (Graphics2D) g.create();
      g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
      g2.setColor(bg);
      g2.fillRoundRect(0, 0, getWidth(), getHeight(), radius, radius);
      g2.dispose();

      super.paintComponent(g);

      // selection outline (on top)
      if (selected) {
        Graphics2D g3 = (Graphics2D) g.create();
        g3.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g3.setColor(new Color(255, 255, 255, 140));
        g3.setStroke(new java.awt.BasicStroke(2f));
        g3.drawRoundRect(1, 1, getWidth() - 3, getHeight() - 3, radius, radius);
        g3.dispose();
      }
    }
  }
}