//This part initializes the score from localStorage if available or sets it to default values. It then updates the HTML elements with the current scores.
const score = JSON.parse(localStorage.getItem('score')) || {
  losses: 0,
  wins: 0,
  total: 0
};

/*
Same as above logic written after the OR operator
if(!scores){
  score={
  wins:0,
  losses:0,
  total:0,
  };
}
*/

// Initialize scores on page load
document.getElementById('losses').textContent = score.losses;
document.getElementById('wins').textContent = score.wins;
document.getElementById('total').textContent = score.total;

function userChoice(playerChoice) {
  let choices = ['head', 'tails'];
  let computerChoice = choices[Math.floor(Math.random() * choices.length)];

  let lossesElement = document.getElementById('losses');
  let winsElement = document.getElementById('wins');
  let totalElement = document.getElementById('total');
  let resultElement = document.getElementById('result');

  if (playerChoice === computerChoice) {
    score.wins++;
  } else {
    score.losses++;
  }
  score.total++;

  resultElement.innerText = `You chose: ${playerChoice}\nComputer chose: ${computerChoice}`;
  lossesElement.textContent = score.losses;
  winsElement.textContent = score.wins;
  totalElement.textContent = score.total;

  localStorage.setItem('score', JSON.stringify(score)); // Store the updated scores in localStorage
}

function resetScores() {
  // Reset the score object
  score.losses = 0;
  score.wins = 0;
  score.total = 0;

  // Update the display
  document.getElementById('losses').textContent = score.losses;
  document.getElementById('wins').textContent = score.wins;
  document.getElementById('total').textContent = score.total;
  document.getElementById('result').textContent = 'Make your move!';

  // Clear the scores from localStorage
  localStorage.setItem('score', JSON.stringify(score));
}