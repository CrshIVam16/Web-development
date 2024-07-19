// ** First way **

// let calculation = '';

// // document.getElementById('display').innerText = '100'; //This will change the number inside the input box from 0 to 100.

// function appendCalculation(value) {
//   calculation += value;
//   updateDisplay();
// }

// // function calculateResult() {
// //   try {
// //     calculation = eval(calculation).toString();
// //     updateDisplay();
// //   } catch (error) {
// //     calculation = 'Error';
// //     updateDisplay();
// //   }
// // }

// function calculateResult() {
//   try {
//     calculation = String(Function(`"use strict"; return (${calculation})`)());
//     updateDisplay();
//   } catch(e) {
//     calculation = 'Error';
//     updateDisplay();
//   }
// }

// function clearCalculation() {
//   calculation = '';
//   updateDisplay();
// }

// function updateDisplay() {
//   document.getElementById('display').textContent = calculation || '0'; // change id back from calc to display for the code to function
// }

//************************************************************************************************** */

// ** Second way **
let calculation = '';

function handleThroughKey(event) {
  if (isNumber(event.key)) {
    updateDisplay();
  }
}

function appendCalculation(value) {
  calculation += value;
  console.log(calculation);
  updateDisplay();
}

function calculateResult() {
  try {
    calculation = eval(calculation).toString();
    console.log(calculation);
  } catch (e) {
    calculation = 'Error';
    console.log(e);
  }
  updateDisplay();
}

function clearCalculation() {
  calculation = '';
  console.log('Cleared.');
  updateDisplay();
}

function updateDisplay() {
  // document.getElementById('calc').textContent = calculation || '0'; //OR
  // document.getElementById('calc').textContent = calculation || '∅'; //OR
  // document.getElementById('calc').innerHTML = calculation || '&#8709;';  //use innerHTML to use hash code //OR
  document.querySelector('.input-style').innerHTML = calculation || '&#8709;';  //use innerHTML to use hash code 
}
