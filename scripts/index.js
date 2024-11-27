// scripts/index.js

const { ethers } = require('ethers');
require('dotenv').config();
const axios = require('axios');

// Default Configuration Constants
let settings = {
    ETH_AMOUNT_TO_SWAP: '0.05', // ETH amount to swap
    SLIPPAGE_TOLERANCE: 5, // Slippage tolerance in percentage
    GAS_PRICE_MULTIPLIER: 1.2, // Gas price multiplier
    PROFIT_THRESHOLD: 10, // Profit threshold in percentage
    DEADLINE_BUFFER: 60, // Deadline buffer in seconds
    MINIMUM_LOCKED_ETH: '500', // Minimum locked ETH in pool
};

let botRunning = false;
let logs = [];
let successfulTrades = [];
let wallet;
let provider;
let factoryContract;
let routerContract;

// Function to log messages with details
function logMessage(message, details = {}) {
    const timestamp = new Date();
    const logEntry = {
        timestamp,
        message,
        tokenAddress: details.tokenAddress || null,
        pairAddress: details.pairAddress || null,
        liquidity: details.liquidity || null,
    };
    logs.push(logEntry);
    console.log(`[${timestamp.toLocaleString()}] ${message}`);
}

// Function to start the bot
function startBot() {
    if (!botRunning) {
        botRunning = true;
        logMessage('Bot started.');
        listenForPairCreated();
    } else {
        logMessage('Bot is already running.');
    }
}

// Function to stop the bot
function stopBot() {
    if (botRunning) {
        botRunning = false;
        logMessage('Bot stopped.');
        factoryContract.removeAllListeners('PairCreated');
    } else {
        logMessage('Bot is already stopped.');
    }
}

// Function to get bot status
function getStatus() {
    return botRunning ? 'Running' : 'Stopped';
}

// Function to get logs (only last 100 entries)
function getLogs() {
    return logs.slice(-100);
}

// Function to get successful trades
function getSuccessfulTrades() {
    return successfulTrades.slice(-100);
}

// Function to update settings
function updateSettings(newSettings) {
    settings = { ...settings, ...newSettings };
    logMessage('Bot settings updated.');
}

// Function to get current settings
function getSettings() {
    return settings;
}

// Function to fetch liquidity
const fetchLiquidity = async (pairAddress) => {
    try {
        const pairABI = [
            'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
            'function token0() external view returns (address)',
            'function token1() external view returns (address)',
        ];

        const pairContract = new ethers.Contract(pairAddress, pairABI, provider);

        const [reserve0, reserve1] = await pairContract.getReserves();
        const token0 = await pairContract.token0();
        const token1 = await pairContract.token1();

        let reserveWETH;
        if (token0.toLowerCase() === process.env.BASE_TOKEN_ADDRESS.toLowerCase()) {
            reserveWETH = reserve0;
        } else if (token1.toLowerCase() === process.env.BASE_TOKEN_ADDRESS.toLowerCase()) {
            reserveWETH = reserve1;
        } else {
            logMessage('Pair does not include base token. Ignoring.');
            return ethers.BigNumber.from('0');
        }

        return reserveWETH;
    } catch (error) {
        logMessage(`Error fetching liquidity: ${error.message}`);
        return ethers.BigNumber.from('0');
    }
};

// Function to evaluate pair profitability
const evaluatePair = async (pairAddress, token0, token1) => {
    const reserveWETH = await fetchLiquidity(pairAddress);
    const liquidityInETH = ethers.utils.formatEther(reserveWETH);
    logMessage(`Reserve WETH for Pair ${pairAddress}: ${liquidityInETH} ETH`);

    const liquidityThreshold = ethers.utils.parseEther(settings.MINIMUM_LOCKED_ETH);

    if (reserveWETH.gte(liquidityThreshold)) {
        const newTokenAddress = token0.toLowerCase() === process.env.BASE_TOKEN_ADDRESS.toLowerCase() ? token1 : token0;
        logMessage(`Pair ${pairAddress} meets liquidity criteria.`, {
            tokenAddress: newTokenAddress,
            pairAddress: pairAddress,
            liquidity: liquidityInETH,
        });
        return true;
    }
    logMessage(`Pair ${pairAddress} does not meet liquidity criteria.`);
    return false;
};

// Function to execute purchase
const executePurchase = async (pairAddress, token0, token1) => {
    try {
        if (
            token0.toLowerCase() !== process.env.BASE_TOKEN_ADDRESS.toLowerCase() &&
            token1.toLowerCase() !== process.env.BASE_TOKEN_ADDRESS.toLowerCase()
        ) {
            logMessage('Pair does not include base token. Ignoring.');
            return;
        }

        let newToken;
        if (token0.toLowerCase() === process.env.BASE_TOKEN_ADDRESS.toLowerCase()) {
            newToken = token1;
        } else {
            newToken = token0;
        }

        newToken = ethers.utils.getAddress(newToken);

        const isProfitable = await evaluatePair(pairAddress, token0, token1);
        if (!isProfitable) {
            return;
        }

        const path = [process.env.BASE_TOKEN_ADDRESS, newToken];
        const amountIn = ethers.utils.parseEther(settings.ETH_AMOUNT_TO_SWAP);

        const feeData = await provider.getFeeData();
        let gasPrice = feeData.gasPrice || ethers.utils.parseUnits('10', 'gwei');

        gasPrice = gasPrice.mul(ethers.BigNumber.from(Math.floor(settings.GAS_PRICE_MULTIPLIER * 100))).div(100);

        const amountsOut = await routerContract.getAmountsOut(amountIn, path);
        const amountOutMin = amountsOut[1].mul(100 - settings.SLIPPAGE_TOLERANCE).div(100);

        const deadline = Math.floor(Date.now() / 1000) + settings.DEADLINE_BUFFER;

        logMessage(`Executing swap: Sending ${settings.ETH_AMOUNT_TO_SWAP} ETH to buy new token...`, {
            tokenAddress: newToken,
            pairAddress: pairAddress,
            liquidity: ethers.utils.formatEther(await fetchLiquidity(pairAddress)),
        });

        const tx = await routerContract.swapExactETHForTokens(
            amountOutMin.toString(),
            path,
            wallet.address,
            deadline,
            {
                value: amountIn,
                gasPrice: gasPrice,
                gasLimit: 300000,
            }
        );

        logMessage(`Transaction Submitted: ${tx.hash}`);

        const receipt = await tx.wait();
        logMessage('Transaction Confirmed!');

        successfulTrades.push({
            timestamp: new Date(),
            token: newToken,
            amountIn: settings.ETH_AMOUNT_TO_SWAP,
            txHash: tx.hash,
        });

        // Monitor and sell logic (not included for brevity)
        // ...

    } catch (error) {
        logMessage(`Error executing purchase: ${error.reason || error.message}`);
    }
};

// Function to listen for PairCreated events
function listenForPairCreated() {
    try {
        factoryContract.on('PairCreated', async (token0, token1, pairAddress) => {
            if (!botRunning) return;

            const newTokenAddress = token0.toLowerCase() === process.env.BASE_TOKEN_ADDRESS.toLowerCase() ? token1 : token0;

            logMessage(`New Pair Detected: ${pairAddress}`, {
                tokenAddress: newTokenAddress,
                pairAddress: pairAddress,
            });

            await executePurchase(pairAddress, token0, token1);
        });

        logMessage('Listening for PairCreated events...');
    } catch (error) {
        logMessage(`Error setting up event listeners: ${error.message}`);
    }
}

// Initialization
(async () => {
    const ROUTER_ADDRESS = ethers.utils.getAddress(process.env.ROUTER_ADDRESS);
    const FACTORY_ADDRESS = ethers.utils.getAddress(process.env.FACTORY_ADDRESS);
    const BASE_TOKEN_ADDRESS = ethers.utils.getAddress(process.env.BASE_TOKEN_ADDRESS);
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const RPC_URL = process.env.RPC_URL;

    provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const factoryABI = [
        'event PairCreated(address indexed token0, address indexed token1, address pair, uint)',
    ];
    const routerABI = [
        'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
        'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
    ];

    factoryContract = new ethers.Contract(FACTORY_ADDRESS, factoryABI, provider);
    routerContract = new ethers.Contract(ROUTER_ADDRESS, routerABI, wallet);

    logMessage('Sniping Bot is Ready.');
})().catch((error) => {
    console.error(`Error occurred in execution: ${error.message}`);
    process.exit(1);
});

// Export Functions for Backend API
module.exports = {
    startBot,
    stopBot,
    getStatus,
    getLogs,
    updateSettings,
    getSettings,
    getSuccessfulTrades,
};
