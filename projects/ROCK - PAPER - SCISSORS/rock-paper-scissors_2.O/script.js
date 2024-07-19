// Initialize game statistics
let total = 0; // Total number of games played
let wins = 0; // Number of games the player has won
let losses = 0; // Number of games the player has lost
let ties = 0; // Number of games that ended in a tie

// Function to play the game
function playGame(playerChoice) {
  // Array of possible choices
  const choices = ['rock', 'paper', 'scissors'];
  // Randomly select a choice for the computer
  const computerChoice = choices[Math.floor(Math.random() * choices.length)];
  // Get references to the result and statistics elements
  const resultElement = document.getElementById('result');
  const totalElement = document.getElementById('total');
  const winsElement = document.getElementById('wins');
  const lossesElement = document.getElementById('losses');
  const tiesElement = document.getElementById('ties');

  // Determine the result of the game
  if (playerChoice === computerChoice) {
    // If both choices are the same, it's a tie
    ties++;
    resultElement.textContent = `It's a tie! Both chose ${playerChoice}.`;
  } else if (
    // Conditions for the player to win
    (playerChoice === 'rock' && computerChoice === 'scissors') ||
    (playerChoice === 'paper' && computerChoice === 'rock') ||
    (playerChoice === 'scissors' && computerChoice === 'paper')
  ) {
    wins++;
    resultElement.textContent = `You win! ${playerChoice} beats ${computerChoice}.`;
  } else {
    // If the player doesn't win and it's not a tie, the computer wins
    losses++;
    resultElement.textContent = `You lose! ${computerChoice} beats ${playerChoice}.`;
  }

  // Increment the total number of games played
  total++;
  // Update the statistics display
  totalElement.textContent = total;
  winsElement.textContent = wins;
  lossesElement.textContent = losses;
  tiesElement.textContent = ties;
}

// Function to reset the game statistics
function reset() {
  total = 0;
  wins = 0;
  losses = 0;
  ties = 0;

  document.getElementById('total').textContent = total;
  document.getElementById('wins').textContent = wins;
  document.getElementById('losses').textContent = losses;
  document.getElementById('ties').textContent = ties;
  document.getElementById('result').textContent = "Make your move!";
}