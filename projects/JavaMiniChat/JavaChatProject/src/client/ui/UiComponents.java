package client.ui;
import java.awt.Color;
import java.awt.Component;
import java.awt.Cursor;
import java.awt.Font;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.Insets;
import java.awt.RenderingHints;

import javax.swing.JButton;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.border.AbstractBorder;

import common.Theme;

/**
 * UiComponents:
 * Small reusable UI helpers to keep code DRY.
 * Uses Theme for consistent fonts/colors.
 */
public final class UiComponents {

  private UiComponents() {}

  // ---------- Text fields ----------

  /** Apply common styling to a text field (colors + rounded border). */
  public static void styleTextField(JTextField f, int radius) {
    if (f == null) return;
    f.setFont(Theme.fontBody(15));
    f.setForeground(Theme.TEXT_MAIN);
    f.setBackground(Theme.SURFACE_1);
    f.setCaretColor(Theme.TEXT_MAIN);
    f.setBorder(new RoundedBorder(radius, Theme.BORDER));
  }

  /** Apply common styling to a text area (colors + rounded border). */
  public static void styleTextArea(JTextArea a, int radius) {
    if (a == null) return;
    a.setFont(Theme.fontBody(14));
    a.setForeground(Theme.TEXT_MAIN);
    a.setBackground(Theme.SURFACE_1);
    a.setCaretColor(Theme.TEXT_MAIN);
    a.setBorder(new RoundedBorder(radius, Theme.BORDER));
    a.setMargin(new Insets(8, 10, 8, 10));
  }

  // ---------- Buttons ----------

  /** Create a rounded button with common styling. */
  public static JButton roundedButton(String text, Color bg, int radius) {
    RoundedButton b = new RoundedButton(text, radius);
    b.setBackground(bg == null ? Theme.SURFACE_2 : bg);
    b.setForeground(Theme.TEXT_MAIN);
    b.setFont(Theme.fontBold(14));
    b.setCursor(new Cursor(Cursor.HAND_CURSOR));
    return b;
  }

  // ---------- Borders ----------

  /** Rounded border for text fields / panels. */
  public static final class RoundedBorder extends AbstractBorder {
    private final int radius;
    private final Color color;

    public RoundedBorder(int radius, Color color) {
      this.radius = radius;
      this.color = (color == null) ? Theme.BORDER : color;
    }

    @Override
    public void paintBorder(Component c, Graphics g, int x, int y, int width, int height) {
      Graphics2D g2 = (Graphics2D) g.create();
      g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
      g2.setColor(color);
      g2.drawRoundRect(x, y, width - 1, height - 1, radius, radius);
      g2.dispose();
    }

    @Override
    public Insets getBorderInsets(Component c) {
      return new Insets(10, 14, 10, 14);
    }

    @Override
    public Insets getBorderInsets(Component c, Insets insets) {
      insets.left = insets.right = 14;
      insets.top = insets.bottom = 10;
      return insets;
    }
  }

  // ---------- Rounded button ----------

  /** JButton that paints its own rounded background. */
  public static final class RoundedButton extends JButton {
    private final int radius;

    public RoundedButton(String text, int radius) {
      super(text);
      this.radius = radius;
      setFocusPainted(false);
      setBorderPainted(false);
      setContentAreaFilled(false);
      setOpaque(false);
      setMargin(new Insets(10, 16, 10, 16));
    }

    @Override
    protected void paintComponent(Graphics g) {
      Graphics2D g2 = (Graphics2D) g.create();
      g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

      Color bg = getBackground();
      if (getModel().isArmed()) bg = bg.darker();

      g2.setColor(bg);
      g2.fillRoundRect(0, 0, getWidth(), getHeight(), radius, radius);
      g2.dispose();

      super.paintComponent(g);
    }
  }
}