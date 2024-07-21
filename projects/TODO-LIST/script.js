/*
   // *** 1st way (uncomment it to use)***

   const todolist = [];
   
   function todo() {
     const inputElement = document.querySelector('input');
     const todoValue = inputElement.value.trim(); // Remove any extra whitespace
   
     if (todoValue) { // Only add if input is not empty
     todolist.push(todoValue); // Add the todo event to the array
     
     // Create a new <p> element for each todo item
           const newTodoElement = document.createElement('p');
           newTodoElement.textContent = todoValue;
           
           // Append the new <p> element to the .para container
             document.querySelector('.para').appendChild(newTodoElement);
             
             inputElement.value = ""; // Clear the input box after adding the todo event
     }
   }
   */

//*************************************************************

/*
// *** 2nd way demo (uncomment it to see the working)***
const todolist = ['shivam', 'singh', 'gangola'];
let todohtml = '';
for (let i = 0; i < todolist.length; i++) {
  const todovalue = todolist[i];
  const html = `<p>${todovalue}</p>`;
  todohtml += html;
}
console.log(todohtml);
document.querySelector('.para').innerHTML = todohtml;
*/


// *** 2nd way (uncomment it to use) ***
const todolist = JSON.parse(localStorage.getItem('todolist')) || [];


function rendertodolist() {
  let todohtml = '';
  for (let i = 0; i < todolist.length; i++) {
    const todoObjectvalue = todolist[i];
    // const { name, dueDate} = todoObjectvalue;
    const name = todoObjectvalue.name;
    const dueDate = todoObjectvalue.dueDate;
    const html = `
          <div> ${name}</div>
          <div> ${dueDate}</div>
          <button onclick="
          todolist.splice(${i},1);  updateLocalStorage();
          rendertodolist();
          " class="delete">Delete</button>
          `;
    todohtml += html;
  }
  console.log(todohtml);
  document.querySelector('.para').innerHTML = todohtml;
}

function addtodo() {
  const inputElement = document.querySelector('input');
  const todoObjectValue = inputElement.value.trim(); // Remove any extra whitespace
  const dateElement = document.querySelector('.date');
  const dateValue = dateElement.value.trim();

  if (todoObjectValue && dateElement) { // Only add if input is not empty
    todolist.push({
      name: todoObjectValue,
      dueDate: dateValue
    }); // Add the todo event to the array
    rendertodolist();
    updateLocalStorage();
    inputElement.value = "";
    dateElement.value = "";
  }
}
function updateLocalStorage() {
  localStorage.setItem('todolist', JSON.stringify(todolist));
}

// Render the todo list on page load
  rendertodolist();