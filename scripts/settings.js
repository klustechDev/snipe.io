// scripts/settings.js

/**
 * settings.js
 *
 * Centralizes the loading and management of environment variables and persists settings to a JSON file.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Ensure environment variables are loaded

const SETTINGS_FILE = path.resolve(__dirname, '../settings.json');

let settings = {
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
    SLIPPAGE_TOLERANCE: parseFloat(process.env.SLIPPAGE_TOLERANCE) || 5,
    GAS_PRICE_MULTIPLIER: parseFloat(process.env.GAS_PRICE_MULTIPLIER) || 1.2,
    PROFIT_THRESHOLD: parseFloat(process.env.PROFIT_THRESHOLD) || 5,
    DEADLINE_BUFFER: parseInt(process.env.DEADLINE_BUFFER, 10) || 60,
    MINIMUM_LOCKED_ETH: process.env.MINIMUM_LOCKED_ETH || '0.5',
    MAX_GAS_PRICE: process.env.MAX_GAS_PRICE || '200',

    MIN_RESERVE_AMOUNT: process.env.MIN_RESERVE_AMOUNT || '1000', // Keep as string for parseUnits
    MONITOR_DURATION: parseInt(process.env.MONITOR_DURATION, 10) || 300,
    CHECK_INTERVAL: parseInt(process.env.CHECK_INTERVAL, 10) || 60,

    // Database Settings
    DATABASE_PATH: process.env.DATABASE_PATH || './database/trades.db',

    // Log Settings
    LOG_FILE: process.env.LOG_FILE || './logs/bot.log',

    // Token Lists
    TOKEN_WHITELIST: [], // Initialize as empty array
    TOKEN_BLACKLIST: [], // Initialize as empty array
};

/**
 * Loads settings from the settings.json file if it exists.
 * Otherwise, uses the default settings from environment variables.
 */
function loadSettings() {
    if (fs.existsSync(SETTINGS_FILE)) {
        try {
            const fileData = fs.readFileSync(SETTINGS_FILE, 'utf-8');
            const fileSettings = JSON.parse(fileData);
            settings = { ...settings, ...fileSettings };
            console.log('Settings loaded from settings.json.');
        } catch (error) {
            console.error('Error reading settings.json:', error);
            console.error('Using environment variables for settings.');
        }
    } else {
        console.log('settings.json not found. Using environment variables for settings.');
    }
}

/**
 * Saves the current settings to the settings.json file.
 */
function saveSettings() {
    try {
        // Only save settings that are configurable via the frontend
        const settingsToSave = {
            ETH_AMOUNT_TO_SWAP: settings.ETH_AMOUNT_TO_SWAP,
            SLIPPAGE_TOLERANCE: settings.SLIPPAGE_TOLERANCE,
            GAS_PRICE_MULTIPLIER: settings.GAS_PRICE_MULTIPLIER,
            PROFIT_THRESHOLD: settings.PROFIT_THRESHOLD,
            DEADLINE_BUFFER: settings.DEADLINE_BUFFER,
            MINIMUM_LOCKED_ETH: settings.MINIMUM_LOCKED_ETH,
            MAX_GAS_PRICE: settings.MAX_GAS_PRICE,
            TOKEN_WHITELIST: settings.TOKEN_WHITELIST,
            TOKEN_BLACKLIST: settings.TOKEN_BLACKLIST,
        };
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settingsToSave, null, 2));
        console.log('Settings saved to settings.json.');
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

/**
 * Updates the settings with new values.
 * @param {Object} newSettings - An object containing new settings to merge.
 */
function updateSettings(newSettings) {
    // Validate newSettings before applying
    // Example: Ensure numerical fields are valid
    const numericalFields = [
        'ETH_AMOUNT_TO_SWAP',
        'SLIPPAGE_TOLERANCE',
        'GAS_PRICE_MULTIPLIER',
        'PROFIT_THRESHOLD',
        'DEADLINE_BUFFER',
        'MINIMUM_LOCKED_ETH',
        'MAX_GAS_PRICE',
    ];
    for (const field of numericalFields) {
        if (newSettings[field] !== undefined && isNaN(newSettings[field])) {
            throw new Error(`Invalid value for ${field}: must be a number.`);
        }
    }

    // Update settings
    settings = { ...settings, ...newSettings };

    // Save to settings.json
    saveSettings();
}

/**
 * Retrieves the current settings.
 * @returns {Object} The settings object.
 */
function getSettings() {
    return settings;
}

// Load settings on module initialization
loadSettings();

module.exports = { getSettings, updateSettings };

