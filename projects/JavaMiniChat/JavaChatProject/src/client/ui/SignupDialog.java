package client.ui;
import java.awt.BorderLayout;
import java.awt.FlowLayout;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;

import javax.swing.JDialog;
import javax.swing.JFrame;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JTextField;
import javax.swing.WindowConstants;
import javax.swing.border.EmptyBorder;

import common.TextUtil;
import common.Theme;

/**
 * Minimal Sign Up dialog:
 * - Username
 * - Password
 *
 * Returns Result or null if cancelled.
 */
public final class SignupDialog {

  private SignupDialog() {}

  public static final class Result {
    public final String username;
    public final String password;

    Result(String username, String password) {
      this.username = username;
      this.password = password;
    }
  }

  public static Result show(JFrame parent) {
    JDialog dlg = new JDialog(parent, "Sign Up", true);
    dlg.setDefaultCloseOperation(WindowConstants.DISPOSE_ON_CLOSE);

    JPanel root = new JPanel(new BorderLayout(12, 12));
    root.setBorder(new EmptyBorder(16, 16, 16, 16));
    root.setBackground(Theme.BG_APP);

    javax.swing.JLabel title = new javax.swing.JLabel("Create your account");
    title.setForeground(Theme.TEXT_MAIN);
    title.setFont(Theme.fontTitle(18));
    title.setBorder(new EmptyBorder(2, 2, 10, 2));
    root.add(title, BorderLayout.NORTH);

    JPanel form = new JPanel(new GridBagLayout());
    form.setOpaque(false);

    GridBagConstraints gbc = new GridBagConstraints();
    gbc.insets = new Insets(10, 10, 10, 10);
    gbc.fill = GridBagConstraints.HORIZONTAL;

    // Username
    gbc.gridx = 0; gbc.gridy = 0;
    form.add(fieldLabel("Username"), gbc);

    gbc.gridx = 1;
    JTextField usernameField = new JTextField(18);
    UiComponents.styleTextField(usernameField, Theme.RADIUS_MD);
    form.add(usernameField, gbc);

    // Password
    gbc.gridx = 0; gbc.gridy = 1;
    form.add(fieldLabel("Password"), gbc);

    gbc.gridx = 1;
    JPasswordField passField = new JPasswordField(18);
    UiComponents.styleTextField(passField, Theme.RADIUS_MD);
    form.add(passField, gbc);

    root.add(form, BorderLayout.CENTER);

    javax.swing.JButton cancel = UiComponents.roundedButton("Cancel", Theme.SURFACE_2, Theme.RADIUS_MD);
    javax.swing.JButton create = UiComponents.roundedButton("Create", Theme.ACCENT_GREEN, Theme.RADIUS_MD);

    JPanel bottom = new JPanel(new FlowLayout(FlowLayout.RIGHT, 10, 0));
    bottom.setOpaque(false);
    bottom.add(cancel);
    bottom.add(create);
    root.add(bottom, BorderLayout.SOUTH);

    final Result[] result = new Result[1];

    cancel.addActionListener(e -> {
      result[0] = null;
      dlg.dispose();
    });

    create.addActionListener(e -> {
      String u = TextUtil.safe(usernameField.getText()).trim();
      String p = new String(passField.getPassword());

      if (u.isEmpty() || p.isBlank()) {
        JOptionPane.showMessageDialog(dlg, "Username and password are required");
        return;
      }

      result[0] = new Result(u, p);
      dlg.dispose();
    });

    dlg.setContentPane(root);
    dlg.pack();
    dlg.setLocationRelativeTo(parent);
    dlg.setVisible(true);

    return result[0];
  }

  private static javax.swing.JLabel fieldLabel(String text) {
    javax.swing.JLabel l = new javax.swing.JLabel(text);
    l.setForeground(Theme.TEXT_MAIN);
    l.setFont(Theme.fontBold(13));
    return l;
  }
}