// scripts/database.js

const sqlite3 = require('sqlite3').verbose();
const { logMessage } = require('./logging');
const { getSettings } = require('./settings');

let db;

/**
 * Initializes the SQLite database and creates the trades table if it doesn't exist.
 * Ensures that the database connection is established only once.
 */
function initDatabase() {
    if (db) {
        logMessage('Database connection already initialized.', {}, 'info');
        return db;
    }

    db = new sqlite3.Database(getSettings().DATABASE_PATH, (err) => {
        if (err) {
            logMessage(`Error connecting to the database: ${err.message}`, {}, 'error');
            process.exit(1);
        }
        logMessage('Connected to the trades database.', {}, 'info');

        // Create trades table if it doesn't exist
        db.run(
            `
            CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                tokenAddress TEXT NOT NULL,
                pairAddress TEXT NOT NULL,
                amountIn TEXT NOT NULL,
                txHash TEXT NOT NULL,
                type TEXT NOT NULL
            )
        `,
            (err) => {
                if (err) {
                    logMessage(`Error creating trades table: ${err.message}`, {}, 'error');
                    process.exit(1);
                }
                logMessage('Trades table is ready.', {}, 'info');
            }
        );
    });

    return db;
}

/**
 * Inserts a trade record into the trades table.
 * @param {Object} trade - The trade details.
 * @param {string} trade.timestamp - ISO timestamp of the trade.
 * @param {string} trade.tokenAddress - Address of the token traded.
 * @param {string} trade.pairAddress - Address of the pair.
 * @param {string} trade.amountIn - Amount of ETH or token input.
 * @param {string} trade.txHash - Transaction hash.
 * @param {string} trade.type - 'buy' or 'sell'.
 * @returns {Promise<void>}
 */
function insertTrade(trade) {
    return new Promise((resolve, reject) => {
        const { timestamp, tokenAddress, pairAddress, amountIn, txHash, type } = trade;

        // Ensure the database is initialized
        const database = initDatabase();

        database.run(
            `
            INSERT INTO trades (timestamp, tokenAddress, pairAddress, amountIn, txHash, type)
            VALUES (?, ?, ?, ?, ?, ?)
        `,
            [timestamp, tokenAddress, pairAddress, amountIn, txHash, type],
            function (err) {
                if (err) {
                    logMessage(`Failed to insert trade: ${err.message}`, {}, 'error');
                    return reject(err);
                }
                logMessage(`Trade inserted with ID: ${this.lastID}`, {}, 'info');
                resolve();
            }
        );
    });
}

/**
 * Retrieves the most recent trades from the database.
 * @param {number} limit - The number of trades to retrieve.
 * @returns {Promise<Array>} - An array of trade records.
 */
function getAllTrades(limit = 100) {
    return new Promise((resolve, reject) => {
        // Ensure the database is initialized
        const database = initDatabase();

        database.all(
            'SELECT * FROM trades ORDER BY id DESC LIMIT ?',
            [limit],
            (err, rows) => {
                if (err) {
                    logMessage(`Error fetching trades: ${err.message}`, {}, 'error');
                    return reject(err);
                }
                resolve(rows);
            }
        );
    });
}

/**
 * Closes the database connection.
 */
function closeDatabase() {
    if (db) {
        db.close((err) => {
            if (err) {
                logMessage(`Error closing database: ${err.message}`, {}, 'error');
            } else {
                logMessage('Database connection closed.', {}, 'info');
            }
        });
        db = null;
    }
}

module.exports = { initDatabase, insertTrade, getAllTrades, closeDatabase };