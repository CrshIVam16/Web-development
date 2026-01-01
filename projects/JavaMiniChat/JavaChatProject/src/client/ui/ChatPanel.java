package client.ui;
import java.awt.BorderLayout;
import java.awt.Dimension;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.LongConsumer;

import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import javax.swing.Timer;
import javax.swing.border.EmptyBorder;

import client.model.MessageItem;
import client.ui.ChatHtmlRenderer;
import common.Theme;

/**
 * ChatPanel:
 * - Uses MessagesView (bubbles)
 * - NEW: Selection mode (checkboxes) for multi-delete "for me"
 * - Shows a small action bar ONLY when selecting messages
 */
public class ChatPanel extends JPanel {

  public interface SendListener {
    void onSend(String text);
  }

  public interface TypingListener {
    void onTyping(boolean isTyping);
  }

  /** Called when user presses "Delete Selected" in selection mode. */
  public interface DeleteSelectedListener {
    void onDeleteSelected(List<MessageItem> items);
  }

  private String myUsername;
  private ChatHtmlRenderer.Mode mode = ChatHtmlRenderer.Mode.PRIVATE;

  private final JLabel headerLabel = new JLabel("Select a chat");

  private final MessagesView messagesView = new MessagesView();

  private final JTextArea inputArea = new JTextArea(2, 20);
  private final javax.swing.JButton sendBtn = UiComponents.roundedButton("Send", Theme.ACCENT_GREEN, Theme.RADIUS_LG);

  // Selection action bar (only visible in selection mode)
  private final JPanel selectionBar = new JPanel(new java.awt.BorderLayout(10, 0));
  private final JLabel selectedLabel = new JLabel("Selected: 0");
  private final javax.swing.JButton deleteSelectedBtn = UiComponents.roundedButton("Delete Selected", Theme.DANGER,
      Theme.RADIUS_MD);
  private final javax.swing.JButton cancelSelectBtn = UiComponents.roundedButton("Cancel", Theme.SURFACE_2,
      Theme.RADIUS_MD);

  private SendListener sendListener = text -> {
  };
  private TypingListener typingListener = isTyping -> {
  };
  private DeleteSelectedListener deleteSelectedListener = items -> {
  };

  private boolean typingEnabled = false;

  // Local ids for delete-for-me (UI-only)
  private final AtomicLong idSeq = new AtomicLong(1);

  private Timer typingTimer;

  public ChatPanel() {
    super(new BorderLayout());
    buildUI();
  }

  // ---------------- Public API ----------------

  public MessageItem getMessageById(long id) {
    return messagesView.getById(id);
  }

  public void setHeaderText(String text) {
    headerLabel.setText(text == null ? "" : text);
  }

  public void setMyUsername(String myUsername) {
    this.myUsername = myUsername;
    messagesView.setMyUsername(myUsername);
  }

  public void setMode(ChatHtmlRenderer.Mode mode) {
    this.mode = (mode == null) ? ChatHtmlRenderer.Mode.PRIVATE : mode;
    messagesView.setMode(this.mode);
  }

  public void setTypingEnabled(boolean enabled) {
    this.typingEnabled = enabled;
    if (!enabled && typingTimer != null) {
      typingTimer.stop();
      typingTimer = null;
    }
  }

  public void setOnSend(SendListener listener) {
    this.sendListener = (listener == null) ? (t -> {
    }) : listener;
  }

  public void setOnTyping(TypingListener listener) {
    this.typingListener = (listener == null) ? (b -> {
    }) : listener;
  }

  /** Single-message delete (right click). */
  public void setOnDeleteForMe(LongConsumer onDeleteForMe) {
    messagesView.setOnDeleteForMe(onDeleteForMe == null ? (id -> {
    }) : onDeleteForMe);
  }

  /** Multi-delete callback. */
  public void setOnDeleteSelected(DeleteSelectedListener listener) {
    this.deleteSelectedListener = (listener == null) ? (items -> {
    }) : listener;
  }

  /** Enter selection mode so checkboxes appear. */
  public void startSelectingMessages() {
    messagesView.setSelectionMode(true);
    updateSelectionBarVisibility();
  }

  /** Exit selection mode. */
  public void stopSelectingMessages() {
    messagesView.setSelectionMode(false);
    updateSelectionBarVisibility();
  }

  /** UI-only: delete one rendered message by its local id. */
  public void deleteLocal(long id) {
    messagesView.deleteLocal(id);
  }

  /** UI-only: clear current chat view completely. */
  public void clearLocal() {
    messagesView.setSelectionMode(false);
    messagesView.clearAllLocal();
    updateSelectionBarVisibility();
  }

  /** Render full history (raw strings). */
  public void showHistory(List<String> rawMessages) {
    List<MessageItem> items = new java.util.ArrayList<>();
    if (rawMessages != null) {
      for (String raw : rawMessages) {
        items.add(MessageItem.fromRaw(idSeq.getAndIncrement(), raw));
      }
    }
    messagesView.setSelectionMode(false);
    messagesView.setMessages(items);
    updateSelectionBarVisibility();
  }

  /** Append one raw message. */
  public void appendMessage(String rawMessage) {
    messagesView.append(MessageItem.fromRaw(idSeq.getAndIncrement(), rawMessage));
  }

  public void clearInput() {
    inputArea.setText("");
  }

  // ---------------- UI ----------------

  private void buildUI() {
    setBackground(Theme.BG_APP);

    headerLabel.setOpaque(true);
    headerLabel.setBackground(Theme.BG_HEADER);
    headerLabel.setForeground(Theme.TEXT_MAIN);
    headerLabel.setFont(Theme.fontTitle(16));
    headerLabel.setBorder(new EmptyBorder(12, 16, 12, 16));
    add(headerLabel, BorderLayout.NORTH);

    add(messagesView, BorderLayout.CENTER);

    // --- selection bar setup (hidden by default)
    selectionBar.setOpaque(true);
    selectionBar.setBackground(Theme.BG_HEADER);
    selectionBar.setBorder(new EmptyBorder(8, 12, 8, 12));

    selectedLabel.setForeground(Theme.TEXT_MAIN);
    selectedLabel.setFont(Theme.fontBold(13));

    JPanel rightBtns = new JPanel(new java.awt.FlowLayout(java.awt.FlowLayout.RIGHT, 8, 0));
    rightBtns.setOpaque(false);
    rightBtns.add(deleteSelectedBtn);
    rightBtns.add(cancelSelectBtn);

    selectionBar.add(selectedLabel, BorderLayout.WEST);
    selectionBar.add(rightBtns, BorderLayout.EAST);

    deleteSelectedBtn.setEnabled(false);

    deleteSelectedBtn.addActionListener(e -> {
      List<MessageItem> selected = messagesView.getSelectedItems();
      if (selected.isEmpty())
        return;
      deleteSelectedListener.onDeleteSelected(selected);
      // after delete, exit selection mode
      messagesView.setSelectionMode(false);
      updateSelectionBarVisibility();
    });

    cancelSelectBtn.addActionListener(e -> {
      messagesView.setSelectionMode(false);
      updateSelectionBarVisibility();
    });

    // keep selection bar updated
    messagesView.setOnSelectionCountChanged(count -> {
      selectedLabel.setText("Selected: " + count);
      deleteSelectedBtn.setEnabled(count > 0);
      updateSelectionBarVisibility();
    });

    // --- bottom input area (with selection bar above it)
    JPanel bottomContainer = new JPanel(new BorderLayout());
    bottomContainer.setBackground(Theme.BG_APP);

    JPanel bottom = new JPanel(new BorderLayout(10, 0));
    bottom.setBorder(new EmptyBorder(10, 10, 10, 10));
    bottom.setBackground(Theme.BG_APP);

    inputArea.setLineWrap(true);
    inputArea.setWrapStyleWord(true);
    UiComponents.styleTextArea(inputArea, Theme.RADIUS_XL);

    JScrollPane inputScroll = new JScrollPane(inputArea);
    inputScroll.setBorder(null);
    inputScroll.setPreferredSize(new Dimension(0, 56));
    inputScroll.getViewport().setBackground(Theme.SURFACE_1);

    sendBtn.setPreferredSize(new Dimension(110, 42));

    bottom.add(inputScroll, BorderLayout.CENTER);
    bottom.add(sendBtn, BorderLayout.EAST);

    bottomContainer.add(selectionBar, BorderLayout.NORTH);
    bottomContainer.add(bottom, BorderLayout.SOUTH);

    add(bottomContainer, BorderLayout.SOUTH);

    updateSelectionBarVisibility();

    // Send
    sendBtn.addActionListener(e -> fireSend());

    // Ctrl+Enter sends
    inputArea.getInputMap().put(javax.swing.KeyStroke.getKeyStroke("ctrl ENTER"), "send");
    inputArea.getActionMap().put("send", new javax.swing.AbstractAction() {
      @Override
      public void actionPerformed(java.awt.event.ActionEvent e) {
        fireSend();
      }
    });

    // Typing debounce
    inputArea.getDocument().addDocumentListener(new javax.swing.event.DocumentListener() {
      @Override
      public void insertUpdate(javax.swing.event.DocumentEvent e) {
        typingChanged();
      }

      @Override
      public void removeUpdate(javax.swing.event.DocumentEvent e) {
        typingChanged();
      }

      @Override
      public void changedUpdate(javax.swing.event.DocumentEvent e) {
      }
    });
  }

  private void updateSelectionBarVisibility() {
    boolean show = messagesView.isSelectionMode();
    selectionBar.setVisible(show);
    revalidate();
    repaint();
  }

  private void fireSend() {
    String text = inputArea.getText();
    if (text == null)
      return;
    text = text.trim();
    if (text.isEmpty())
      return;

    // Don't send while selecting messages
    if (messagesView.isSelectionMode())
      return;

    sendListener.onSend(text);
  }

  private void typingChanged() {
    if (!typingEnabled)
      return;
    if (messagesView.isSelectionMode())
      return;

    typingListener.onTyping(true);

    if (typingTimer != null)
      typingTimer.stop();
    typingTimer = new Timer(1200, e -> typingListener.onTyping(false));
    typingTimer.setRepeats(false);
    typingTimer.start();
  }
}