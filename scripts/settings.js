// scripts/settings.js

/**
 * settings.js
 *
 * Centralizes the loading and management of environment variables and persists settings to a JSON file.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Load environment variables from .env file

const SETTINGS_FILE = path.resolve(__dirname, '../settings.json');

let settings = {
    // Ethereum Addresses
    BASE_TOKEN_ADDRESS: process.env.BASE_TOKEN_ADDRESS || '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // Default to WETH
    FACTORY_ADDRESS: process.env.FACTORY_ADDRESS,
    ROUTER_ADDRESS: process.env.ROUTER_ADDRESS,

    // Private Key
    PRIVATE_KEY: process.env.PRIVATE_KEY,

    // RPC URLs
    RPC_URL_MAINNET: process.env.RPC_URL_MAINNET,
    RPC_URL_LOCAL: process.env.RPC_URL_LOCAL,

    // Trading Settings
    ETH_AMOUNT_TO_SWAP: parseFloat(process.env.ETH_AMOUNT_TO_SWAP) || 0.1,
    SLIPPAGE_TOLERANCE: parseFloat(process.env.SLIPPAGE_TOLERANCE) || 5,
    GAS_PRICE_MULTIPLIER: parseFloat(process.env.GAS_PRICE_MULTIPLIER) || 1.2,
    PROFIT_THRESHOLD: parseFloat(process.env.PROFIT_THRESHOLD) || 5,
    DEADLINE_BUFFER: parseInt(process.env.DEADLINE_BUFFER, 10) || 60,
    MINIMUM_LOCKED_ETH: parseFloat(process.env.MINIMUM_LOCKED_ETH) || 0.5,
    MAX_GAS_PRICE: parseInt(process.env.MAX_GAS_PRICE, 10) || 200,

    MONITOR_DURATION: parseInt(process.env.MONITOR_DURATION, 10) || 300,
    CHECK_INTERVAL: parseInt(process.env.CHECK_INTERVAL, 10) || 60,

    // Database Settings
    DATABASE_PATH: process.env.DATABASE_PATH || './database/trades.db',

    // Log Settings
    LOG_FILE: process.env.LOG_FILE || './logs/bot.log',

    // Token Lists
    TOKEN_WHITELIST: process.env.TOKEN_WHITELIST ? process.env.TOKEN_WHITELIST.split(',') : [],
    TOKEN_BLACKLIST: process.env.TOKEN_BLACKLIST ? process.env.TOKEN_BLACKLIST.split(',') : [],
};

/**
 * Loads settings from the settings.json file if it exists.
 * Otherwise, defaults to environment variables or predefined defaults.
 */
function loadSettings() {
    if (fs.existsSync(SETTINGS_FILE)) {
        try {
            const fileData = fs.readFileSync(SETTINGS_FILE, 'utf-8');
            const fileSettings = JSON.parse(fileData);
            settings = { ...settings, ...fileSettings };
            console.log('Settings loaded from settings.json.');
        } catch (error) {
            console.error('Error reading settings.json:', error.message);
            console.error('Falling back to environment variables for settings.');
        }
    } else {
        console.log('settings.json not found. Using environment variables for settings.');
    }
}

/**
 * Saves the current settings to the settings.json file.
 * Only saves settings that can be updated dynamically.
 */
function saveSettings() {
    try {
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
        console.error('Error saving settings:', error.message);
    }
}

/**
 * Updates the settings with new values.
 * @param {Object} newSettings - An object containing the settings to update.
 */
function updateSettings(newSettings) {
    // Validate numerical settings
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

    // Update settings in memory
    settings = { ...settings, ...newSettings };

    // Save the updated settings to the settings.json file
    saveSettings();
}

/**
 * Retrieves the current settings.
 * @returns {Object} The current settings object.
 */
function getSettings() {
    return settings;
}

// Load settings upon module initialization
loadSettings();

module.exports = { getSettings, updateSettings };
