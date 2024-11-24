
const express = require('express');
const cors = require('cors');
const app = express();
const port = 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Example bot functions (placeholder)
let botRunning = false;
const logs = [];

const startBot = () => {
  botRunning = true;
  logs.push({ timestamp: Date.now(), message: 'Bot started' });
};

const stopBot = () => {
  botRunning = false;
  logs.push({ timestamp: Date.now(), message: 'Bot stopped' });
};

const getStatus = () => (botRunning ? 'Running' : 'Stopped');

const getLogs = () => logs;

// Start Bot
app.post('/api/start', (req, res) => {
  startBot();
  res.json({ message: 'Bot started' });
});

// Stop Bot
app.post('/api/stop', (req, res) => {
  stopBot();
  res.json({ message: 'Bot stopped' });
});

// Get Status
app.get('/api/status', (req, res) => {
  res.json({ status: getStatus() });
});

// Get Logs
app.get('/api/logs', (req, res) => {
  res.json(getLogs());
});

// Start Server
app.listen(port, () => {
  console.log(`Backend API running at http://localhost:${port}`);
});
