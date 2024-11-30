// scripts/database.js

const sqlite3 = require('sqlite3').verbose();
const { logMessage } = require('./logging');
const settings = require('./settings');

let db;

/**
 * Initializes the SQLite database and creates the trades table if it doesn't exist.
 */
function initDatabase() {
    db = new sqlite3.Database(settings.DATABASE_PATH, (err) => {
        if (err) {
            logMessage(`Error connecting to the database: ${err.message}`, {}, 'error');
            process.exit(1);
        }
        logMessage('Connected to the trades database.', {});

        // Create trades table if it doesn't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS trades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                tokenAddress TEXT NOT NULL,
                amountIn TEXT NOT NULL,
                txHash TEXT NOT NULL,
                type TEXT NOT NULL
            )
        `, (err) => {
            if (err) {
                logMessage(`Error creating trades table: ${err.message}`, {}, 'error');
                process.exit(1);
            }
            logMessage('Trades table is ready.', {});
        });
    });

    return db;
}

/**
 * Inserts a trade record into the trades table.
 * @param {Object} trade - The trade details.
 * @param {string} trade.timestamp - ISO timestamp of the trade.
 * @param {string} trade.tokenAddress - Address of the token traded.
 * @param {string} trade.amountIn - Amount of ETH or token input.
 * @param {string} trade.txHash - Transaction hash.
 * @param {string} trade.type - 'buy' or 'sell'.
 * @returns {Promise<void>}
 */
function insertTrade(trade) {
    return new Promise((resolve, reject) => {
        const { timestamp, tokenAddress, amountIn, txHash, type } = trade;
        db.run(`
            INSERT INTO trades (timestamp, tokenAddress, amountIn, txHash, type)
            VALUES (?, ?, ?, ?, ?)
        `, [timestamp, tokenAddress, amountIn, txHash, type], function(err) {
            if (err) {
                logMessage(`Failed to insert trade: ${err.message}`, {}, 'error');
                return reject(err);
            }
            logMessage(`Trade inserted with ID: ${this.lastID}`, {});
            resolve();
        });
    });
}

const dbInstance = initDatabase();

module.exports = { db: dbInstance, insertTrade };
