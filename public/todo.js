const username = localStorage.getItem("loggedUser");
const role = localStorage.getItem("loggedRole");

document.getElementById("user").textContent = username;

const tbody = document.querySelector("#task-table tbody");
const adminForm = document.getElementById("admin-form");

// טופס למנהלים בלבד
if (role === "admin") {
  adminForm.style.display = "block";

  document.getElementById("task-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const taskUser = document.getElementById("taskUser").value;
    const taskText = document.getElementById("taskText").value;

    await fetch("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: taskUser, task: taskText })
    });

    location.reload();
  });
}

// טעינת משימות מהשרת
async function loadTasks() {
  const res = await fetch("/tasks");
  const data = await res.json();

  tbody.innerHTML = "";
  data.forEach((task, index) => {
    const isMine = task.user === username;
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${task.user}</td>
      <td>${task.task}</td>
      <td>
        <input type="checkbox"
               ${task.done === 'true' ? 'checked' : ''}
               ${role !== "admin" && !isMine ? 'disabled' : ''}
               onchange="toggleDone(${index}, this.checked)" />
      </td>
      <td>
        ${role === "admin" ? `<button onclick="editTask(${index})">✏️ ערוך</button>` : ''}
      </td>
    `;
    if (role === "admin" || isMine) {
      tbody.appendChild(tr);
    }
  });
}

// סימון משימה כבוצעה
async function toggleDone(row, value) {
  await fetch(`/tasks/${row}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ done: value })
  });
}

// עריכת טקסט של משימה (admin בלבד)
async function editTask(row) {
  const newTask = prompt("הזן טקסט חדש למשימה:");
  if (newTask) {
    await fetch(`/tasks/${row}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: newTask })
    });
    loadTasks();
  }
}

// הרצת טעינה ראשונית
loadTasks();
