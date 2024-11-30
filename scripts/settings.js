// scripts/settings.js

require('dotenv').config();

const settings = {
    BASE_TOKEN_ADDRESS: process.env.BASE_TOKEN_ADDRESS,
    FACTORY_ADDRESS: process.env.FACTORY_ADDRESS,
    ROUTER_ADDRESS: process.env.ROUTER_ADDRESS,
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    RPC_URL_MAINNET: process.env.RPC_URL_MAINNET,
    RPC_URL_LOCAL: process.env.RPC_URL_LOCAL,
    ETH_AMOUNT_TO_SWAP: process.env.ETH_AMOUNT_TO_SWAP || '0.1',
    GAS_PRICE_MULTIPLIER: parseInt(process.env.GAS_PRICE_MULTIPLIER) || 120,
    MIN_RESERVE_AMOUNT: process.env.MIN_RESERVE_AMOUNT || '1000',
    MONITOR_DURATION: parseInt(process.env.MONITOR_DURATION) || 300,
    PROFIT_THRESHOLD: parseFloat(process.env.PROFIT_THRESHOLD) || 5,
    CHECK_INTERVAL: parseInt(process.env.CHECK_INTERVAL) || 60,
    DATABASE_PATH: process.env.DATABASE_PATH || './database/trades.db',
    LOG_FILE: process.env.LOG_FILE || './logs/bot.log',
};

console.log('Loaded Environment Variables:', settings);

module.exports = settings;
