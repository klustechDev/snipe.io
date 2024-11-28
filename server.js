// server.js

const express = require('express');
const cors = require('cors');
const {
  startBot,
  stopBot,
  getStatus,
  getLogs,
  updateSettings,
  getSettings,
  getSuccessfulTrades,
  getDetectedPairs,
  logMessage,
} = require('./scripts/index');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Initialize bot
startBot();

// API Endpoints
app.get('/api/status', (req, res) => {
  res.json({ status: getStatus() });
});

app.get('/api/logs', (req, res) => {
  res.json(getLogs());
});

app.get('/api/detected-pairs', (req, res) => {
  res.json(getDetectedPairs());
});

app.get('/api/successful-trades', (req, res) => {
  res.json(getSuccessfulTrades());
});

app.get('/api/settings', (req, res) => {
  res.json(getSettings());
});

app.post('/api/settings', (req, res) => {
  updateSettings(req.body);
  res.json({ status: 'Settings updated successfully.' });
});

app.post('/api/start', (req, res) => {
  startBot();
  res.json({ status: 'Bot started.' });
});

app.post('/api/stop', (req, res) => {
  stopBot();
  res.json({ status: 'Bot stopped.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
