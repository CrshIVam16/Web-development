package client.ui;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dimension;
import java.awt.FlowLayout;
import java.awt.Font;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;

import common.TextUtil;
import common.Theme;

/**
 * "Create Group" dialog:
 * - Group name field
 * - Search users
 * - All users list (filtered)
 * - Selected members list
 *
 * Usage:
 *   GroupDialog.Result r = GroupDialog.show(this, usersList);
 *   if (r != null) { r.name, r.members }
 */
public final class GroupDialog {

  private GroupDialog() {}

  public static final class Result {
    public final String name;
    public final List<String> members;
    Result(String name, List<String> members) {
      this.name = name;
      this.members = members;
    }
  }

  /** Opens a modal dialog. Returns null if cancelled. */
  public static Result show(JFrame parent, List<String> allUsers) {
    JDialog dlg = new JDialog(parent, "Create Group", true);
    dlg.setDefaultCloseOperation(WindowConstants.DISPOSE_ON_CLOSE);

    JPanel root = new JPanel(new BorderLayout(12, 12));
    root.setBorder(new EmptyBorder(12, 12, 12, 12));
    root.setBackground(Theme.BG_APP);

    // ---- Top: group name + search ----
    JPanel top = new JPanel(new BorderLayout(10, 10));
    top.setOpaque(false);

    JTextField nameField = new JTextField();
    UiComponents.styleTextField(nameField, Theme.RADIUS_MD);
    nameField.setBorder(BorderFactory.createTitledBorder("Group name"));

    JTextField searchField = new JTextField();
    UiComponents.styleTextField(searchField, Theme.RADIUS_MD);
    searchField.setBorder(BorderFactory.createTitledBorder("Search users"));

    top.add(nameField, BorderLayout.NORTH);
    top.add(searchField, BorderLayout.SOUTH);

    // ---- Center: two lists ----
    DefaultListModel<String> allModel = new DefaultListModel<>();
    DefaultListModel<String> selectedModel = new DefaultListModel<>();

    // Keep insertion order + no duplicates
    Set<String> selectedSet = new LinkedHashSet<>();

    // Populate allModel
    if (allUsers != null) {
      for (String u : allUsers) if (u != null && !u.isBlank()) allModel.addElement(u.trim());
    }

    JList<String> allList = new JList<>(allModel);
    allList.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
    allList.setFont(new Font(Theme.FONT_FAMILY, Font.PLAIN, 14));
    allList.setBackground(Theme.BG_SIDEBAR);
    allList.setForeground(Theme.TEXT_MAIN);

    JList<String> selectedList = new JList<>(selectedModel);
    selectedList.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
    selectedList.setFont(new Font(Theme.FONT_FAMILY, Font.PLAIN, 14));
    selectedList.setBackground(Theme.BG_SIDEBAR);
    selectedList.setForeground(Theme.TEXT_MAIN);

    JScrollPane allScroll = new JScrollPane(allList);
    allScroll.setBorder(BorderFactory.createTitledBorder("All users"));
    allScroll.setPreferredSize(new Dimension(260, 260));
    allScroll.getViewport().setBackground(Theme.BG_SIDEBAR);

    JScrollPane selScroll = new JScrollPane(selectedList);
    selScroll.setBorder(BorderFactory.createTitledBorder("Selected members"));
    selScroll.setPreferredSize(new Dimension(260, 260));
    selScroll.getViewport().setBackground(Theme.BG_SIDEBAR);

    JPanel lists = new JPanel(new FlowLayout(FlowLayout.CENTER, 10, 0));
    lists.setOpaque(false);
    lists.add(allScroll);

    // ---- Middle buttons (Add/Remove) ----
    JPanel midBtns = new JPanel(new FlowLayout(FlowLayout.CENTER, 10, 10));
    midBtns.setOpaque(false);

    JButton addBtn    = UiComponents.roundedButton("Add →", Theme.SURFACE_2, Theme.RADIUS_MD);
    JButton removeBtn = UiComponents.roundedButton("← Remove", Theme.SURFACE_2, Theme.RADIUS_MD);

    midBtns.add(addBtn);
    midBtns.add(removeBtn);

    JPanel mid = new JPanel(new BorderLayout());
    mid.setOpaque(false);
    mid.add(midBtns, BorderLayout.CENTER);

    lists.add(mid);
    lists.add(selScroll);

    // ---- Bottom: Create / Cancel ----
    JPanel bottom = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 0));
    bottom.setOpaque(false);

    JButton cancel = UiComponents.roundedButton("Cancel", Theme.SURFACE_2, Theme.RADIUS_MD);
    JButton create = UiComponents.roundedButton("Create", Theme.ACCENT_GREEN, Theme.RADIUS_MD);

    bottom.add(cancel);
    bottom.add(create);

    // ---- Filtering logic ----
    List<String> originalUsers = (allUsers == null) ? List.of() : new ArrayList<>(allUsers);

    Runnable refreshAll = () -> {
      String q = TextUtil.safe(searchField.getText()).trim().toLowerCase();
      allModel.clear();
      for (String u : originalUsers) {
        if (u == null || u.isBlank()) continue;
        String t = u.trim();
        if (q.isEmpty() || t.toLowerCase().contains(q)) allModel.addElement(t);
      }
    };

    searchField.getDocument().addDocumentListener(new DocumentListener() {
      @Override public void insertUpdate(DocumentEvent e) { refreshAll.run(); }
      @Override public void removeUpdate(DocumentEvent e) { refreshAll.run(); }
      @Override public void changedUpdate(DocumentEvent e) {}
    });

    // ---- Add / Remove behavior ----
    addBtn.addActionListener(e -> {
      String u = allList.getSelectedValue();
      if (u == null) return;
      u = u.trim();
      if (u.isEmpty()) return;
      if (selectedSet.add(u)) selectedModel.addElement(u);
    });

    removeBtn.addActionListener(e -> {
      String u = selectedList.getSelectedValue();
      if (u == null) return;
      u = u.trim();
      if (u.isEmpty()) return;
      if (selectedSet.remove(u)) selectedModel.removeElement(u);
    });

    // Double-click add/remove
    allList.addMouseListener(new java.awt.event.MouseAdapter() {
      @Override public void mouseClicked(java.awt.event.MouseEvent e) {
        if (e.getClickCount() == 2) addBtn.doClick();
      }
    });
    selectedList.addMouseListener(new java.awt.event.MouseAdapter() {
      @Override public void mouseClicked(java.awt.event.MouseEvent e) {
        if (e.getClickCount() == 2) removeBtn.doClick();
      }
    });

    // ---- Dialog result handling ----
    final Result[] resultHolder = new Result[1];

    cancel.addActionListener(e -> {
      resultHolder[0] = null;
      dlg.dispose();
    });

    create.addActionListener(e -> {
      String name = TextUtil.safe(nameField.getText()).trim();
      if (name.isEmpty()) {
        JOptionPane.showMessageDialog(dlg, "Group name is required");
        return;
      }

      // It's okay to create group with 0 selected members (server always adds creator)
      List<String> members = new ArrayList<>(selectedSet);
      resultHolder[0] = new Result(name, members);
      dlg.dispose();
    });

    // Assemble
    root.add(top, BorderLayout.NORTH);
    root.add(lists, BorderLayout.CENTER);
    root.add(bottom, BorderLayout.SOUTH);

    dlg.setContentPane(root);
    dlg.pack();
    dlg.setLocationRelativeTo(parent);
    dlg.setVisible(true);

    return resultHolder[0];
  }
}