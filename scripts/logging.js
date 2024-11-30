// scripts/logging.js

const fs = require('fs');
const path = require('path');
const settings = require('./settings');

/**
 * Logs a message to both the console and a log file.
 * @param {string} message - The message to log.
 * @param {Object} data - Additional data to log.
 * @param {string} level - The log level ('info', 'error', etc.).
 */
function logMessage(message, data = {}, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, data };

    // Log to console
    if (level === 'info') {
        console.log(JSON.stringify(logEntry));
    } else if (level === 'error') {
        console.error(JSON.stringify(logEntry));
    } else {
        console.log(JSON.stringify(logEntry));
    }

    // Append to log file
    const logFilePath = path.resolve(settings.LOG_FILE);
    fs.appendFile(logFilePath, JSON.stringify(logEntry) + '\n', (err) => {
        if (err) {
            console.error(`Failed to write to log file: ${err.message}`);
        }
    });
}

module.exports = { logMessage };
