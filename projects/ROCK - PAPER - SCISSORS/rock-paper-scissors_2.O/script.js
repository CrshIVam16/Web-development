// ------------------------------
// Load saved game statistics
// ------------------------------
const savedStats = JSON.parse(localStorage.getItem('rps-stats')) || {
  total: 0,
  wins: 0,
  losses: 0,
  ties: 0
};

let total = savedStats.total;
let wins = savedStats.wins;
let losses = savedStats.losses;
let ties = savedStats.ties;

// Update UI on page load
updateUI();

// ------------------------------
// Play Game Function
// ------------------------------
function playGame(playerChoice) {
  const choices = ['rock', 'paper', 'scissors'];
  const computerChoice = choices[Math.floor(Math.random() * choices.length)];

  const resultElement = document.getElementById('result');

  if (playerChoice === computerChoice) {
    ties++;
    resultElement.textContent = `It's a tie! Both chose ${playerChoice}.`;
  } else if (
    (playerChoice === 'rock' && computerChoice === 'scissors') ||
    (playerChoice === 'paper' && computerChoice === 'rock') ||
    (playerChoice === 'scissors' && computerChoice === 'paper')
  ) {
    wins++;
    resultElement.textContent = `You win! ${playerChoice} beats ${computerChoice}.`;
  } else {
    losses++;
    resultElement.textContent = `You lose! ${computerChoice} beats ${playerChoice}.`;
  }

  total++;

  saveToLocalStorage();
  updateUI();
}

// ------------------------------
// Reset Game Function
// ------------------------------
function reset() {
  total = 0;
  wins = 0;
  losses = 0;
  ties = 0;

  localStorage.removeItem('rps-stats');
  document.getElementById('result').textContent = "Make your move!";
  updateUI();
}

// ------------------------------
// Helper Functions
// ------------------------------
function saveToLocalStorage() {
  localStorage.setItem(
    'rps-stats',
    JSON.stringify({ total, wins, losses, ties })
  );
}

function updateUI() {
  document.getElementById('total').textContent = total;
  document.getElementById('wins').textContent = wins;
  document.getElementById('losses').textContent = losses;
  document.getElementById('ties').textContent = ties;
}
