document.getElementById('login-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const res = await fetch(`/users`);
    if (!res.ok) throw new Error("שגיאה בעת שליפת נתונים מהשרת");

    const users = await res.json();
    const match = users.find(user =>
      user.username === username && user.password === password
    );

    if (match) {
      localStorage.setItem("loggedUser", match.username);
      localStorage.setItem("loggedRole", match.role); // שומר גם את הרמה
      window.location.href = "dashboard.html"; // או "todo.html" – לפי בחירה
    } else {
      document.getElementById('error').textContent = 'שם משתמש או סיסמה שגויים';
    }
  } catch (error) {
    console.error('שגיאה בעת התחברות:', error);
    document.getElementById('error').textContent = 'אירעה שגיאה בעת התחברות';
  }
});
