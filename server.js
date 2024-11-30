// server.js

/**
 * server.js
 * 
 * Sets up the Express server and defines API endpoints.
 */

const express = require('express');
const cors = require('cors');
const {
    startBot,
    stopBot,
    getStatus,
    getDetectedPairs,
    getSuccessfulTrades,
    getInitializationLogs,
    getGeneralLogs,
    getSettings,
    updateSettings,
} = require('./scripts/eventListener');
const { logMessage } = require('./scripts/logging');
const { getLogs } = require('./scripts/logging');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// API Endpoints

/**
 * Get Bot Status
 */
app.get('/api/status', (req, res) => {
    res.json({ status: getStatus() });
});

/**
 * Get Detected Pairs
 */
app.get('/api/detected-pairs', (req, res) => {
    res.json(getDetectedPairs());
});

/**
 * Get Successful Trades
 */
app.get('/api/trades', async (req, res) => {
    try {
        const trades = await getSuccessfulTrades();
        res.json(trades);
    } catch (error) {
        logMessage(`Error fetching trades: ${error.message}`, {}, 'error');
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get Logs
 */
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await getLogs(100); // Fetch the last 100 logs
        res.json(logs);
    } catch (error) {
        logMessage(`Error fetching logs: ${error.message}`, {}, 'error');
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get Current Settings
 */
app.get('/api/settings', (req, res) => {
    try {
        const currentSettings = getSettings();
        res.json(currentSettings);
    } catch (error) {
        logMessage(`Error fetching settings: ${error.message}`, {}, 'error');
        res.status(500).json({ error: error.message });
    }
});

/**
 * Update Settings
 */
app.post('/api/settings', (req, res) => {
    try {
        const newSettings = req.body;
        updateSettings(newSettings);
        logMessage('Settings updated successfully.', {}, 'info');
        res.json({ status: 'Settings updated successfully.' });
    } catch (error) {
        logMessage(`Error updating settings: ${error.message}`, {}, 'error');
        res.status(500).json({ error: error.message });
    }
});

/**
 * Start Bot
 */
app.post('/api/start', async (req, res) => {
    try {
        await startBot();
        res.json({ status: 'Bot started successfully.' });
    } catch (error) {
        logMessage(`Error starting bot: ${error.message}`, {}, 'error');
        res.status(500).json({ error: error.message });
    }
});

/**
 * Stop Bot
 */
app.post('/api/stop', (req, res) => {
    try {
        stopBot();
        res.json({ status: 'Bot stopped successfully.' });
    } catch (error) {
        logMessage(`Error stopping bot: ${error.message}`, {}, 'error');
        res.status(500).json({ error: error.message });
    }
});

/**
 * Start Server
 */
app.listen(PORT, () => logMessage(`Backend server is running on port ${PORT}`, {}, 'info'));
