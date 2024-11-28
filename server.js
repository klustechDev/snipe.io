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
} = require('./scripts/index');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Endpoint to start the bot
app.post('/api/start', (req, res) => {
  startBot();
  res.json({ status: 'Bot started' });
});

// Endpoint to stop the bot
app.post('/api/stop', (req, res) => {
  stopBot();
  res.json({ status: 'Bot stopped' });
});

// Endpoint to get bot status
app.get('/api/status', (req, res) => {
  res.json({ status: getStatus() });
});

// Endpoint to get logs
app.get('/api/logs', (req, res) => {
  res.json(getLogs());
});

// Endpoint to get successful trades
app.get('/api/trades', (req, res) => {
  res.json(getSuccessfulTrades());
});

// Endpoint to get detected pairs
app.get('/api/detected-pairs', (req, res) => {
  res.json(getDetectedPairs());
});

// Endpoint to update settings
app.post('/api/settings', (req, res) => {
  const newSettings = req.body;
  updateSettings(newSettings);
  res.json({ status: 'Settings updated' });
});

// Endpoint to get current settings
app.get('/api/settings', (req, res) => {
  res.json(getSettings());
});

app.listen(port, () => {
  console.log(`Backend server is running on port ${port}`);
});
