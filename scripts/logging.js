// scripts/logging.js

const fs = require('fs');
const path = require('path');
const { getSettings } = require('./settings');

/**
 * Logs a message to both the console and a log file.
 * @param {string} message - The message to log.
 * @param {Object} data - Additional data to log.
 * @param {string} level - The log level ('info', 'error', 'warn', etc.).
 */
function logMessage(message, data = {}, level = 'info') {
    try {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, level, message, data };

        // Log to console based on level
        switch (level) {
            case 'info':
                console.log(JSON.stringify(logEntry, null, 2));
                break;
            case 'error':
                console.error(JSON.stringify(logEntry, null, 2));
                break;
            case 'warn':
                console.warn(JSON.stringify(logEntry, null, 2));
                break;
            default:
                console.log(JSON.stringify(logEntry, null, 2));
        }

        // Resolve log file path
        const logFilePath = getSettings().LOG_FILE
            ? path.resolve(getSettings().LOG_FILE)
            : path.resolve('./logs/default.log'); // Fallback to a default log file

        // Ensure log file directory exists
        const logDir = path.dirname(logFilePath);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        // Append log entry to file
        fs.appendFile(logFilePath, JSON.stringify(logEntry) + '\n', (err) => {
            if (err) {
                console.error(`Failed to write to log file: ${err.message}`);
            }
        });
    } catch (err) {
        // Fallback logging for critical errors
        console.error('Critical error in logMessage:', err.message, { message, data, level });
    }
}

/**
 * Retrieves logs for frontend consumption.
 * @param {number} limit - The maximum number of logs to retrieve.
 * @returns {Array} - An array of log entries.
 */
function getLogs(limit = 100) {
    try {
        const logFilePath = path.resolve(getSettings().LOG_FILE);

        if (!fs.existsSync(logFilePath)) {
            return [];
        }

        const logData = fs.readFileSync(logFilePath, 'utf-8');
        const logs = logData
            .split('\n')
            .filter((line) => line.trim() !== '') // Remove empty lines
            .map((line) => JSON.parse(line));

        return logs.slice(-limit).reverse(); // Return the most recent logs
    } catch (err) {
        console.error(`Error reading logs: ${err.message}`);
        return [];
    }
}

/**
 * Clears the log file.
 */
function clearLogs() {
    try {
        const logFilePath = path.resolve(getSettings().LOG_FILE);

        if (fs.existsSync(logFilePath)) {
            fs.truncateSync(logFilePath, 0); // Clear the log file
            console.log('Log file cleared.');
        } else {
            console.warn('Log file does not exist. Nothing to clear.');
        }
    } catch (err) {
        console.error(`Error clearing logs: ${err.message}`);
    }
}

module.exports = { logMessage, getLogs, clearLogs };
