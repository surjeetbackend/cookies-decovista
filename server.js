// server.js
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
app.use(express.json());

// ✅ Allow local and live frontend
app.use(cors({
  origin: ['http://localhost:5175', 'https://your-live-site.com'], // update if needed
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.options('*', cors()); // Preflight

// ✅ Google Sheets Auth
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

const appendToSheet = async (range, values) => {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] }
  });
};

app.get('/test', (req, res) => {
  res.send('✅ Backend is alive');
});

app.post('/track-cookie', async (req, res) => {
  try {
    const { time, browser, location, ip } = req.body;
    await appendToSheet('Sheet1!A2:D', [time, browser, location, ip]);
    res.status(200).json({ message: 'Cookie saved' });
  } catch (err) {
    console.error('❌ Cookie error:', err.message);
    res.status(500).json({ error: 'Error saving cookie', details: err.message });
  }
});

app.post('/track-click', async (req, res) => {
  try {
    const { time, tag, id, className, text } = req.body;
    await appendToSheet('Sheet2!F2:K', [time, tag, id, className, text]);
    res.status(200).json({ message: 'Click saved' });
  } catch (err) {
    console.error('❌ Click error:', err.message);
    res.status(500).json({ error: 'Error saving click', details: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
