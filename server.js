// index.js
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
app.use(express.json());

// ✅ Allow all origins (wildcard)
app.use(cors());

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

// ✅ Health check route
app.get('/test', (req, res) => {
  res.send('✅ Backend is alive');
});

// ✅ Save cookie info to Sheet1
app.post('/track-cookie', async (req, res) => {
  try {
    const { time, browser, location, ip } = req.body;
    await appendToSheet('Sheet1!A2:D', [time, browser, location, ip]);
    res.status(200).json({ message: 'Cookie saved' });
  } catch (err) {
    console.error('Cookie error:', err.message);
    res.status(500).json({ error: 'Error saving cookie', details: err.message });
  }
});

// ✅ Save click info to Sheet2
app.post('/track-click', async (req, res) => {
  try {
    const { time, tag, id, className, text } = req.body;
    await appendToSheet('Sheet2!A1:E', [time, tag, id, className, text]);
    res.status(200).json({ message: 'Click saved' });
  } catch (err) {
    console.error('Click error:', err.message);
    res.status(500).json({ error: 'Error saving click', details: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
