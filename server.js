// server.js

const express = require('express');
const { startBot, stopBot, getStatus, getLogs } = require('./scripts/index.js');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Endpoint to start the bot
app.post('/api/start', (req, res) => {
    startBot();
    res.send({ status: 'Bot started' });
});

// Endpoint to stop the bot
app.post('/api/stop', (req, res) => {
    stopBot();
    res.send({ status: 'Bot stopped' });
});

// Endpoint to get bot status
app.get('/api/status', (req, res) => {
    res.send({ status: getStatus() });
});

// Endpoint to get logs
app.get('/api/logs', (req, res) => {
    res.send(getLogs());
});

// Start the server
app.listen(port, () => {
    console.log(`Backend server is running on port ${port}`);
});
