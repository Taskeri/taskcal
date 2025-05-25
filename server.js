const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const SHEET_ID = '1kpfrUXKNsztnbBKkQRu2hmzmTRGnjzZ1dOEevu5nh9g';

const auth = new google.auth.GoogleAuth({
  keyFile: 'credentials.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// ✅ שליפת משתמשים
app.get('/users', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'user!B2:D',
    });

    const rows = result.data.values || [];
    const users = rows.map(row => ({
      username: row[0],
      password: row[1],
      role: row[2] || 'user'
    }));

    res.json(users);
  } catch (err) {
    console.error('שגיאה בגישה ל-Google Sheets:', err.message);
    res.status(500).json({ error: "שגיאה בגישה ל-Google Sheets" });
  }
});

// ✅ שליפת היסטוריה לפי משתמש
app.get('/history', async (req, res) => {
  const username = req.query.user;
  if (!username) return res.status(400).json({ error: "Missing user param" });

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'history!A2:E',
    });

    const rows = result.data.values || [];
    const filtered = rows.filter(row =>
      row[0]?.trim().toLowerCase() === username.trim().toLowerCase()
    );
    res.json(filtered);
  } catch (err) {
    console.error('שגיאה בשליפת היסטוריה:', err.message);
    res.status(500).json({ error: "שגיאה בגישה ל-Google Sheets" });
  }
});

// ✅ שליפת כל המשימות
app.get('/tasks', async (req, res) => {
  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'history!A2:E',
    });

    const rows = result.data.values || [];
    const tasks = rows.map(row => ({
      user: row[0],
      date: row[1],
      time: row[2],
      task: row[3],
      done: row[4] || 'FALSE'
    }));

    res.json(tasks);
  } catch (err) {
    console.error('שגיאה בשליפת משימות:', err.message);
    res.status(500).json({ error: "שגיאה בגישה ל-Google Sheets" });
  }
});

// ✅ הוספת משימה חדשה
app.post('/tasks', async (req, res) => {
  const { user, task } = req.body;
  if (!user || !task) return res.status(400).json({ error: "Missing user or task" });

  try {
    const now = new Date();
    const values = [[
      user,
      now.toLocaleDateString('he-IL'),
      now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      task,
      false // ← תיבת סימון ריקה
    ]];

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'history!A:E',
      valueInputOption: 'USER_ENTERED', // ← קריטי
      requestBody: { values }
    });

    res.json({ status: "success" });
  } catch (err) {
    console.error('שגיאה בהוספת משימה:', err.message);
    res.status(500).json({ error: "שגיאה בהוספת משימה" });
  }
});

// ✅ עדכון משימה קיימת
app.patch('/tasks/:row', async (req, res) => {
  const row = Number(req.params.row) + 2;
  const { task, done } = req.body;

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    if (task !== undefined) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `history!D${row}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[task]] }
      });
    }

    if (done !== undefined) {
      const value = done === 'TRUE' || done === true ? true : false;

      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `history!E${row}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[value]] }
      });
    }

    res.json({ status: "updated" });
  } catch (err) {
    console.error('שגיאה בעדכון שורה:', err.message);
    res.status(500).json({ error: "שגיאה בעדכון שורה" });
  }
});

// ✅ הפעלת השרת
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ השרת פעיל על פורט ${PORT}`));
