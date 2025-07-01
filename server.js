const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
app.use(express.json());

// ✅ CORS Setup (Allow localhost + production frontend)
app.use(cors({
  origin: ['http://localhost:5175', 'https://decovista.in/'], // Replace with real site
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// ✅ Preflight handler
app.options('*', cors());

// ✅ Google Auth from .env
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
  console.log('✅ Received POST to /track-cookie');
  try {
    const { time, browser, location, ip } = req.body;
    await appendToSheet('Sheet1!A2:D', [time, browser, location, ip]);
    res.status(200).json({ message: 'Cookie saved' });
  } catch (err) {
    console.error('❌ Cookie error:', err.message);
    res.status(500).json({ error: 'Error saving cookie', details: err.message });
  }
});

// ✅ Click tracking route
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

// ✅ Run server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
