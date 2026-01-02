# Rock-Paper-Scissors Game 🎮✊✋✌️

A simple **Rock-Paper-Scissors** game built with **HTML, CSS, and JavaScript**.
The game keeps track of your scores (wins, losses, ties, and total games) and **persists them even after page reloads** using `localStorage`.

---

## Features ✅

* Play against the computer by choosing Rock, Paper, or Scissors.
* Displays the result of each game: Win, Lose, or Tie.
* Tracks **total games, wins, losses, and ties**.
* Scores **persist across page reloads** using `localStorage`.
* Reset button to clear all scores and start fresh.
* Interactive UI with images for Rock, Paper, and Scissors.
* Responsive buttons with hover effects for better user experience.

---

## Demo 🎥

You can try the game live here: [Your Live Demo Link]
*(replace with your GitHub Pages or deployed URL)*

---

## Installation / Usage 💻

1. **Clone the repository**

```bash
git clone <repo url>
```

2. **Open `index.html`** in your favorite browser.

3. **Play the game** by clicking on one of the Rock, Paper, or Scissors buttons.

4. **Check your stats** under the results section.

5. **Reset scores** anytime using the "Reset" button.

---

## File Structure 📂

```
Rock-Paper-Scissors/
│
├── rock-paper-scissors.html            # Normal file with both .css & .js code
├── rock-paper-scissors_2.O
|    ├── images/          # Images for Rock, Paper, Scissors
|    │   ├── rock-emoji.png
|    │   ├── paper-emoji.png
|    │   └── scissors-emoji.png
|    ├── rock-paper-scissors.html       # Main HTML file
|    ├── style.css                      # Styling for the game
|    ├── script.js                      # Game logic and score handling
└── README.md                           # This file
```
---

## How It Works ⚙️

1. When you select a choice (Rock, Paper, or Scissors), the computer randomly selects a choice.
2. The game compares both choices and determines the outcome: Win, Lose, or Tie.
3. The **scores are updated** and stored in `localStorage` to persist even after reloads.
4. Clicking the **Reset** button clears all scores and the result display.

---

## Technologies Used 🛠️

* **HTML5** – Structure and layout
* **CSS3** – Styling, hover effects, and responsiveness
* **JavaScript** – Game logic, score tracking, and `localStorage`
