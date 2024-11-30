// scripts/settings.js

/**
 * settings.js
 * 
 * Centralizes the loading and management of environment variables.
 */

require('dotenv').config(); // Ensure environment variables are loaded

const settings = {
    // Ethereum Addresses
    BASE_TOKEN_ADDRESS: process.env.BASE_TOKEN_ADDRESS,
    FACTORY_ADDRESS: process.env.FACTORY_ADDRESS,
    ROUTER_ADDRESS: process.env.ROUTER_ADDRESS,

    // Private Key
    PRIVATE_KEY: process.env.PRIVATE_KEY,

    // RPC URLs
    RPC_URL_MAINNET: process.env.RPC_URL_MAINNET,
    RPC_URL_LOCAL: process.env.RPC_URL_LOCAL,

    // Trading Settings
    ETH_AMOUNT_TO_SWAP: process.env.ETH_AMOUNT_TO_SWAP || '0.1',
    GAS_PRICE_MULTIPLIER: parseInt(process.env.GAS_PRICE_MULTIPLIER, 10) || 120,
    MIN_RESERVE_AMOUNT: process.env.MIN_RESERVE_AMOUNT || '1000', // Keep as string for parseUnits
    MONITOR_DURATION: parseInt(process.env.MONITOR_DURATION, 10) || 300,
    PROFIT_THRESHOLD: parseFloat(process.env.PROFIT_THRESHOLD) || 5,
    CHECK_INTERVAL: parseInt(process.env.CHECK_INTERVAL, 10) || 60,

    // Database Settings
    DATABASE_PATH: process.env.DATABASE_PATH || './database/trades.db',

    // Log Settings
    LOG_FILE: process.env.LOG_FILE || './logs/bot.log',
};

/**
 * Updates the settings with new values.
 * @param {Object} newSettings - An object containing new settings to merge.
 */
function updateSettings(newSettings) {
    Object.assign(settings, newSettings);
}

/**
 * Retrieves the current settings.
 * @returns {Object} The settings object.
 */
function getSettings() {
    return settings;
}

module.exports = { getSettings, updateSettings };
