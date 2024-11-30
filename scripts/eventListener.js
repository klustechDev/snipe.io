// scripts/eventListener.js

/**
 * eventListener.js
 * 
 * Manages the bot's lifecycle, handles blockchain events, and interacts with the database.
 */

const { ethers } = require('ethers');
const {
    initContracts,
    getFactoryContract,
    getRouterContract,
    getProvider,
    getWallet,
} = require('./contracts');
const { logMessage, getLogs } = require('./logging');
const { monitorTokenPrice, evaluatePair } = require('./utils');
const { isHoneypot } = require('./tokenAnalysis');
const { insertTrade, getAllTrades, closeDatabase } = require('./database');
const { getSettings, updateSettings } = require('./settings');

let botRunning = false;

/**
 * Initializes the SQLite database.
 */
function initializeDatabase() {
    logMessage('Database initialized.', {}, 'info');
}

/**
 * Start the bot: Initialize contracts, database, and set up event listeners.
 */
async function startBot() {
    if (botRunning) {
        logMessage('Bot is already running.', {}, 'info');
        return;
    }

    try {
        await initContracts();
        initializeDatabase();
        botRunning = true;
        logMessage('Bot started.', {}, 'info');

        const factoryContract = getFactoryContract();

        // Listen for PairCreated Events
        factoryContract.on('PairCreated', async (token0, token1, pairAddress) => {
            logMessage('Detected PairCreated Event:', { token0, token1, pairAddress }, 'info');
            await handlePairCreated(token0, token1, pairAddress);
        });

        logMessage('Listener for PairCreated events has been set up successfully.', {}, 'info');
    } catch (error) {
        logMessage(`Failed to start bot: ${error.message}`, {}, 'error');
        botRunning = false;
    }
}

/**
 * Stops the bot by removing event listeners and closing the database connection.
 */
function stopBot() {
    if (!botRunning) {
        logMessage('Bot is not running.', {}, 'info');
        return;
    }

    try {
        const factoryContract = getFactoryContract();
        factoryContract.removeAllListeners('PairCreated');
        closeDatabase(); // Properly closes the database connection
        botRunning = false;
        logMessage('Bot stopped.', {}, 'info');
    } catch (error) {
        logMessage(`Failed to stop bot: ${error.message}`, {}, 'error');
    }
}

/**
 * Returns the current status of the bot.
 * @returns {string} 'Running' or 'Stopped'
 */
function getStatus() {
    return botRunning ? 'Running' : 'Stopped';
}

/**
 * Retrieves detected pairs.
 * @returns {Array} Array of detected pairs
 */
function getDetectedPairs() {
    // Implement logic to fetch detected pairs if stored
    return []; // Placeholder
}

/**
 * Retrieves successful trades from the database.
 * @returns {Promise<Array>} Array of trade records
 */
async function getSuccessfulTrades() {
    try {
        const trades = await getAllTrades(100); // Fetch the last 100 trades
        return trades.filter(trade => trade.type === 'sell'); // Filter for 'sell' trades
    } catch (error) {
        logMessage(`Error fetching trades: ${error.message}`, {}, 'error');
        return [];
    }
}

/**
 * Retrieves recent initialization logs.
 * @returns {Array} Array of log entries
 */
function getInitializationLogs() {
    // Implement logic to fetch initialization logs if available
    return []; // Placeholder
}

/**
 * Retrieves general logs.
 * @returns {Promise<Array>} Array of log entries
 */
async function getGeneralLogs() {
    try {
        const logs = await getLogs(100); // Fetch the last 100 logs
        return logs;
    } catch (error) {
        logMessage(`Error fetching logs: ${error.message}`, {}, 'error');
        return [];
    }
}

/**
 * Handles the PairCreated event by evaluating the pair and executing a purchase if viable.
 * @param {string} token0 - Address of token0
 * @param {string} token1 - Address of token1
 * @param {string} pairAddress - Address of the pair
 */
async function handlePairCreated(token0, token1, pairAddress) {
    try {
        const baseTokenAddress = getSettings().BASE_TOKEN_ADDRESS.toLowerCase();
        const newTokenAddress = token0.toLowerCase() === baseTokenAddress ? token1 : token0;

        logMessage(`New Token Address: ${newTokenAddress}`, {}, 'info');

        // Evaluate Pair
        const isViable = await evaluatePair(pairAddress, token0, token1);
        if (!isViable) {
            logMessage(`Pair ${pairAddress} did not pass evaluation. Ignoring.`, {}, 'info');
            return;
        }

        // Check if Honeypot
        const honeypot = await isHoneypot(newTokenAddress);
        if (honeypot) {
            logMessage(`Token ${newTokenAddress} is identified as a honeypot. Skipping purchase.`, {}, 'info');
            return;
        }

        // Execute Purchase
        await executePurchase(newTokenAddress, pairAddress);
    } catch (error) {
        logMessage(`Error handling PairCreated event for ${pairAddress}: ${error.message}`, {}, 'error');
    }
}

/**
 * Executes a purchase of the specified token.
 * @param {string} tokenAddress - Address of the token to purchase
 * @param {string} pairAddress - Address of the liquidity pair
 */
async function executePurchase(tokenAddress, pairAddress) {
    try {
        const routerContract = getRouterContract();
        const wallet = getWallet();
        const provider = getProvider();

        const settings = getSettings();
        const ethAmountToSwap = settings.ETH_AMOUNT_TO_SWAP;
        const amountIn = ethers.utils.parseEther(ethAmountToSwap);
        const path = [settings.BASE_TOKEN_ADDRESS, tokenAddress];
        const deadline = Math.floor(Date.now() / 1000) + settings.MONITOR_DURATION;

        // Estimate Gas
        const gasPrices = await provider.getFeeData();
        const txOptions = {
            gasLimit: 200000,
            maxFeePerGas: gasPrices.maxFeePerGas.mul(settings.GAS_PRICE_MULTIPLIER).div(100),
            maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas.mul(settings.GAS_PRICE_MULTIPLIER).div(100),
        };

        // Execute Swap
        const tx = await routerContract.swapExactETHForTokens(
            0,
            path,
            wallet.address,
            deadline,
            { ...txOptions, value: amountIn }
        );

        logMessage(`Purchase transaction submitted. Tx Hash: ${tx.hash}`, {}, 'info');

        const receipt = await tx.wait();

        logMessage(`Purchase executed for token ${tokenAddress}. Tx Hash: ${tx.hash}`, {}, 'info');

        // Record Trade
        const trade = {
            timestamp: new Date().toISOString(),
            tokenAddress,
            pairAddress,
            amountIn: ethAmountToSwap,
            txHash: tx.hash,
            type: 'buy',
        };

        await insertTrade(trade);

        // Start Monitoring Price for Selling
        monitorTokenPrice(tokenAddress);
    } catch (error) {
        logMessage(`Error executing purchase for token ${tokenAddress}: ${error.message}`, {}, 'error');
    }
}

/**
 * Executes a sell operation for the specified token.
 * @param {string} tokenAddress - Address of the token to sell
 */
async function executeSell(tokenAddress) {
    try {
        const routerContract = getRouterContract();
        const wallet = getWallet();
        const provider = getProvider();

        // Get Token Balance
        const tokenABI = [
            'function balanceOf(address owner) view returns (uint)',
            'function approve(address spender, uint256 amount) external returns (bool)',
        ];
        const tokenContract = new ethers.Contract(tokenAddress, tokenABI, wallet);
        const balance = await tokenContract.balanceOf(wallet.address);

        if (balance.isZero()) {
            logMessage(`No balance of token ${tokenAddress} to sell.`, {}, 'info');
            return;
        }

        // Approve Router if necessary
        const allowance = await tokenContract.allowance(wallet.address, routerContract.address);
        if (allowance.lt(balance)) {
            const approveTx = await tokenContract.approve(routerContract.address, ethers.constants.MaxUint256, {
                gasLimit: 100000,
            });
            await approveTx.wait();
            logMessage(`Router approved to spend token ${tokenAddress}.`, {}, 'info');
        }

        const settings = getSettings();
        const path = [tokenAddress, settings.BASE_TOKEN_ADDRESS];
        const amountIn = balance;
        const deadline = Math.floor(Date.now() / 1000) + settings.MONITOR_DURATION;

        // Estimate Gas
        const gasPrices = await provider.getFeeData();
        const txOptions = {
            gasLimit: 200000,
            maxFeePerGas: gasPrices.maxFeePerGas.mul(settings.GAS_PRICE_MULTIPLIER).div(100),
            maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas.mul(settings.GAS_PRICE_MULTIPLIER).div(100),
        };

        // Execute Swap
        const tx = await routerContract.swapExactTokensForETHSupportingFeeOnTransferTokens(
            amountIn,
            0,
            path,
            wallet.address,
            deadline,
            txOptions
        );

        logMessage(`Sell transaction submitted. Tx Hash: ${tx.hash}`, {}, 'info');

        const receipt = await tx.wait();

        logMessage(`Sell executed for token ${tokenAddress}. Tx Hash: ${tx.hash}`, {}, 'info');

        // Record Trade
        const trade = {
            timestamp: new Date().toISOString(),
            tokenAddress,
            pairAddress: '', // Include pairAddress if available
            amountIn: ethers.utils.formatUnits(amountIn, 18),
            txHash: tx.hash,
            type: 'sell',
        };

        await insertTrade(trade);
    } catch (error) {
        logMessage(`Error executing sell for token ${tokenAddress}: ${error.message}`, {}, 'error');
    }
}

module.exports = {
    startBot,
    stopBot,
    getStatus,
    getDetectedPairs,
    getSuccessfulTrades,
    getInitializationLogs,
    getGeneralLogs,
    getSettings,
    updateSettings,
};
