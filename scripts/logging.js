// scripts/logging.js

/**
 * logging.js
 * 
 * Handles logging to both the console and a log file.
 * Prevents circular dependencies by lazy-loading settings.
 */

const fs = require('fs');
const path = require('path');

let settings;

/**
 * Logs a message to the console and appends it to a log file.
 * @param {string} message - The message to log.
 * @param {Object} [data={}] - Additional data to include.
 * @param {string} [level='info'] - The log level ('info', 'error', 'warn', etc.).
 */
function logMessage(message, data = {}, level = 'info') {
    try {
        if (!settings) {
            settings = require('./settings').getSettings();
        }

        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, level, message, data };

        // Console Logging
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

        // File Logging
        const logFilePath = typeof settings.LOG_FILE === 'string'
            ? path.resolve(settings.LOG_FILE)
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
 * Retrieves the most recent logs.
 * @param {number} [limit=100] - The number of logs to retrieve.
 * @returns {Array} An array of log entries.
 */
function getLogs(limit = 100) {
    try {
        if (!settings) {
            settings = require('./settings').getSettings();
        }

        if (typeof settings.LOG_FILE !== 'string') {
            throw new Error('LOG_FILE is not defined correctly in settings.');
        }

        const logFilePath = path.resolve(settings.LOG_FILE);

        if (!fs.existsSync(logFilePath)) {
            return [];
        }

        const logData = fs.readFileSync(logFilePath, 'utf-8');
        const logs = logData
            .split('\n')
            .filter((line) => line.trim() !== '') // Remove empty lines
            .map((line) => JSON.parse(line));

        return logs.slice(-limit).reverse(); // Most recent logs first
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
        if (!settings) {
            settings = require('./settings').getSettings();
        }

        if (typeof settings.LOG_FILE !== 'string') {
            throw new Error('LOG_FILE is not defined correctly in settings.');
        }

        const logFilePath = path.resolve(settings.LOG_FILE);

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
