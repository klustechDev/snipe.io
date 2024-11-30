// server.js

const { startBot } = require('./scripts/eventListener');

const express = require('express');
const cors = require('cors');
const {
  startBot,
  stopBot,
  getStatus,
  getLogs,
  getDetectedPairs,
  getSuccessfulTrades,
  getInitializationLogs,
  getSettings,
  updateSettings,
} = require('./scripts/eventListener');
const { logMessage } = require('./scripts/logging'); // Ensure logMessage is correctly exported

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// API Endpoints

// Get Bot Status
app.get('/api/status', (req, res) => {
  res.json({ status: getStatus() });
});

// Get All Logs (Initialization Logs)
app.get('/api/init-logs', (req, res) => {
  res.json(getInitializationLogs());
});

// Get Detected Pairs
app.get('/api/detected-pairs', (req, res) => {
  res.json(getDetectedPairs());
});

// Get Successful Trades
app.get('/api/trades', (req, res) => {
  res.json(getSuccessfulTrades());
});

// Get All Logs (General Logs)
app.get('/api/logs', (req, res) => {
  res.json(getLogs());
});

// Get Current Settings
app.get('/api/settings', (req, res) => {
  res.json(getSettings());
});

// Update Settings
app.post('/api/settings', (req, res) => {
  const newSettings = req.body;
  updateSettings(newSettings);
  res.json({ status: 'Settings updated successfully.' });
});

// Start Bot
app.post('/api/start', async (req, res) => {
  try {
    await startBot();
    res.json({ status: 'Bot started successfully.' });
  } catch (error) {
    logMessage(`Error starting bot: ${error.message}`, {}, 'error');
    res.status(500).json({ status: 'Failed to start bot.', error: error.message });
  }
});

// Stop Bot
app.post('/api/stop', (req, res) => {
  try {
    stopBot();
    res.json({ status: 'Bot stopped successfully.' });
  } catch (error) {
    logMessage(`Error stopping bot: ${error.message}`, {}, 'error');
    res.status(500).json({ status: 'Failed to stop bot.', error: error.message });
  }
});

// Start Server
app.listen(PORT, () => logMessage(`Backend server is running on port ${PORT}`));
