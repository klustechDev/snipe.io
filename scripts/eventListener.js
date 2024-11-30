// scripts/eventListener.js

const { ethers } = require('ethers');
const { initContracts, getFactoryContract, getRouterContract, getProvider, getWallet } = require('./contracts');
const { logMessage } = require('./logging');
const { monitorTokenPrice, evaluatePair } = require('./utils');
const { isHoneypot } = require('./tokenAnalysis');
const { Database } = require('sqlite3').verbose();
const settings = require('./settings');

let botRunning = false;
let db;

// Initialize Database
function initializeDatabase() {
  db = new Database(settings.DATABASE_PATH, (err) => {
    if (err) {
      logMessage(`Failed to connect to database: ${err.message}`, {}, 'error');
      throw err;
    }
    logMessage('Connected to the trades database.', {});
  });

  // Create Trades Table if not exists
  const createTradesTable = `
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT,
      tokenAddress TEXT,
      pairAddress TEXT,
      amountIn TEXT,
      txHash TEXT,
      type TEXT
    )
  `;
  db.run(createTradesTable, (err) => {
    if (err) {
      logMessage(`Failed to create trades table: ${err.message}`, {}, 'error');
      throw err;
    }
    logMessage('Trades table is ready.', {});
  });
}

// Start Bot
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
    factoryContract.on('PairCreated', async (token0, token1, pairAddress, event) => {
      logMessage('Detected PairCreated Event:', { token0, token1, pairAddress });
      handlePairCreated(token0, token1, pairAddress);
    });

    logMessage('Listener for PairCreated events has been set up successfully.', {}, 'info');
  } catch (error) {
    logMessage(`Failed to start bot: ${error.message}`, {}, 'error');
    botRunning = false;
  }
}

// Stop Bot
function stopBot() {
  if (!botRunning) {
    logMessage('Bot is not running.', {}, 'info');
    return;
  }

  try {
    const factoryContract = getFactoryContract();
    factoryContract.removeAllListeners('PairCreated');
    db.close((err) => {
      if (err) {
        logMessage(`Error closing database: ${err.message}`, {}, 'error');
      } else {
        logMessage('Database connection closed.', {}, 'info');
      }
    });
    botRunning = false;
    logMessage('Bot stopped.', {}, 'info');
  } catch (error) {
    logMessage(`Failed to stop bot: ${error.message}`, {}, 'error');
  }
}

// Get Bot Status
function getStatus() {
  return botRunning ? 'Running' : 'Stopped';
}

// Get Initialization Logs (Recent Logs)
function getInitializationLogs() {
  // Implement logic to fetch initialization logs
  // For simplicity, return an empty array or implement as needed
  return [];
}

// Get General Logs
function getLogs() {
  // Implement logic to fetch general logs
  // For simplicity, return an empty array or implement as needed
  return [];
}

// Get Detected Pairs
function getDetectedPairs() {
  // Implement logic to fetch detected pairs
  // For simplicity, return an empty array or implement as needed
  return [];
}

// Get Successful Trades
function getSuccessfulTrades() {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM trades WHERE type = 'sell' ORDER BY id DESC LIMIT 100`;
    db.all(query, [], (err, rows) => {
      if (err) {
        logMessage(`Error fetching successful trades: ${err.message}`, {}, 'error');
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Handle PairCreated Event
async function handlePairCreated(token0, token1, pairAddress) {
  try {
    const baseTokenAddress = settings.BASE_TOKEN_ADDRESS.toLowerCase();
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

// Execute Purchase
async function executePurchase(tokenAddress, pairAddress) {
  try {
    const routerContract = getRouterContract();
    const wallet = getWallet();
    const provider = getProvider();

    const ethAmountToSwap = settings.ETH_AMOUNT_TO_SWAP;
    const amountIn = ethers.utils.parseEther(ethAmountToSwap);
    const path = [settings.BASE_TOKEN_ADDRESS, tokenAddress];
    const deadline = Math.floor(Date.now() / 1000) + settings.MONITOR_DURATION;

    // Estimate Gas
    const gasPrices = await routerContract.provider.getFeeData();
    const txOptions = {
      gasLimit: 200000,
      maxFeePerGas: gasPrices.maxFeePerGas.mul(ethers.BigNumber.from(settings.GAS_PRICE_MULTIPLIER)).div(100),
      maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas.mul(ethers.BigNumber.from(settings.GAS_PRICE_MULTIPLIER)).div(100),
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
      tokenAddress: tokenAddress,
      pairAddress: pairAddress,
      amountIn: ethers.utils.formatEther(amountIn),
      txHash: tx.hash,
      type: 'buy',
    };

    insertTrade(trade);

    // Start Monitoring Price for Selling
    monitorTokenPrice(tokenAddress);
  } catch (error) {
    logMessage(`Error executing purchase for token ${tokenAddress}: ${error.message}`, {}, 'error');
  }
}

// Execute Sell
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

    const path = [tokenAddress, settings.BASE_TOKEN_ADDRESS];
    const amountIn = balance;
    const deadline = Math.floor(Date.now() / 1000) + settings.MONITOR_DURATION;

    // Estimate Gas
    const gasPrices = await routerContract.provider.getFeeData();
    const txOptions = {
      gasLimit: 200000,
      maxFeePerGas: gasPrices.maxFeePerGas.mul(ethers.BigNumber.from(settings.GAS_PRICE_MULTIPLIER)).div(100),
      maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas.mul(ethers.BigNumber.from(settings.GAS_PRICE_MULTIPLIER)).div(100),
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
      tokenAddress: tokenAddress,
      pairAddress: '', // Optional: include pairAddress if available
      amountIn: ethers.utils.formatUnits(amountIn, 18),
      txHash: tx.hash,
      type: 'sell',
    };

    insertTrade(trade);
  } catch (error) {
    logMessage(`Error executing sell for token ${tokenAddress}: ${error.message}`, {}, 'error');
  }
}

// Insert Trade into Database
function insertTrade(trade) {
  const stmt = db.prepare(`
    INSERT INTO trades (timestamp, tokenAddress, pairAddress, amountIn, txHash, type)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    trade.timestamp,
    trade.tokenAddress,
    trade.pairAddress,
    trade.amountIn,
    trade.txHash,
    trade.type,
    (err) => {
      if (err) {
        logMessage(`Error inserting trade into database: ${err.message}`, {}, 'error');
      } else {
        logMessage(`Trade recorded: ${trade.type} ${trade.amountIn} ETH of ${trade.tokenAddress}`, {}, 'info');
      }
    }
  );
  stmt.finalize();
}

module.exports = {
  startBot,
  stopBot,
  getStatus,
  getLogs,
  getDetectedPairs,
  getSuccessfulTrades,
  getInitializationLogs,
  getSettings,
  updateSettings,
};
