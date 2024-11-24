// scripts/index.js

const { ethers } = require("ethers");
require("dotenv").config();
const axios = require('axios');

// Configuration Constants
const ETH_AMOUNT_TO_SWAP = "0.05"; // 0.05 ETH
const SLIPPAGE_TOLERANCE = 5; // 5%
const GAS_PRICE_MULTIPLIER = 1.2; // 20% increase
const PROFIT_THRESHOLD = 10; // 10%
const DEADLINE_BUFFER = 60; // 60 seconds

// Bot Control and Logging
let botRunning = false;
let logs = [];
let wallet;
let provider;
let factoryContract;
let routerContract;

// Function to log messages
function logMessage(message) {
    const timestamp = new Date();
    logs.push({ timestamp, message });
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
        // Remove all listeners to prevent memory leaks
        factoryContract.removeAllListeners("PairCreated");
    } else {
        logMessage('Bot is already stopped.');
    }
}

// Function to get bot status
function getStatus() {
    return botRunning ? 'Running' : 'Stopped';
}

// Function to get logs
function getLogs() {
    return logs.slice(-100); // Return the last 100 logs
}

// Function to fetch liquidity
const fetchLiquidity = async (pairAddress, provider, baseTokenAddress) => {
    try {
        const pairABI = [
            "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
            "function token0() external view returns (address)",
            "function token1() external view returns (address)"
        ];

        const pairContract = new ethers.Contract(pairAddress, pairABI, provider);

        const [reserve0, reserve1] = await pairContract.getReserves();
        const token0 = await pairContract.token0();
        const token1 = await pairContract.token1();

        let reserveWETH;
        if (token0.toLowerCase() === baseTokenAddress.toLowerCase()) {
            reserveWETH = reserve0;
        } else if (token1.toLowerCase() === baseTokenAddress.toLowerCase()) {
            reserveWETH = reserve1;
        } else {
            logMessage("Pair does not include WETH. Ignoring.");
            return ethers.BigNumber.from("0");
        }

        return reserveWETH;
    } catch (error) {
        logMessage(`Error fetching liquidity: ${error.message}`);
        return ethers.BigNumber.from("0");
    }
};

// Function to evaluate pair profitability
const evaluatePair = async (newTokenAddress, pairAddress, provider, baseTokenAddress) => {
    const reserveWETH = await fetchLiquidity(pairAddress, provider, baseTokenAddress);
    logMessage(`Reserve WETH for Pair ${pairAddress}: ${ethers.utils.formatEther(reserveWETH)} WETH`);

    const liquidityThreshold = ethers.utils.parseEther("500"); // 500 WETH

    if (reserveWETH.gte(liquidityThreshold)) {
        logMessage(`Pair ${pairAddress} meets profitability criteria.`);
        return true;
    }
    logMessage(`Pair ${pairAddress} does not meet liquidity criteria.`);
    return false;
};

// Function to execute purchase
const executePurchase = async (pairAddress, token0, token1, provider, routerContract, baseTokenAddress, wallet) => {
    try {
        logMessage(`New Pair Detected: ${pairAddress}`);
        logMessage(`Token0: ${token0}`);
        logMessage(`Token1: ${token1}`);

        if (
            token0.toLowerCase() !== baseTokenAddress.toLowerCase() &&
            token1.toLowerCase() !== baseTokenAddress.toLowerCase()
        ) {
            logMessage("Pair does not include WETH. Ignoring.");
            return;
        }

        let newToken;
        if (token0.toLowerCase() === baseTokenAddress.toLowerCase()) {
            newToken = token1;
        } else {
            newToken = token0;
        }

        newToken = ethers.utils.getAddress(newToken);
        logMessage(`Attempting to buy new token: ${newToken}`);

        const isProfitable = await evaluatePair(newToken, pairAddress, provider, baseTokenAddress);
        if (!isProfitable) {
            logMessage("Pair does not meet profitability criteria. Ignoring.");
            return;
        }

        const path = [baseTokenAddress, newToken];
        const amountIn = ethers.utils.parseEther(ETH_AMOUNT_TO_SWAP);

        const feeData = await provider.getFeeData();
        let gasPrice = feeData.gasPrice || ethers.utils.parseUnits("10", "gwei");

        gasPrice = gasPrice.mul(ethers.BigNumber.from(Math.floor(GAS_PRICE_MULTIPLIER * 100))).div(100);
        logMessage(`Adjusted Gas Price: ${ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);

        const amountsOut = await routerContract.getAmountsOut(amountIn, path);
        const amountOutMin = amountsOut[1].mul(100 - SLIPPAGE_TOLERANCE).div(100);

        const deadline = Math.floor(Date.now() / 1000) + DEADLINE_BUFFER;

        logMessage(`Executing swap: Sending ${ethers.utils.formatEther(amountIn)} ETH to buy new token...`);

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
        logMessage("Transaction Confirmed!");

        const purchasePrice = amountsOut[1].div(amountIn);

        monitorAndSell(newToken, purchasePrice, routerContract, provider, baseToken_address, wallet);
    } catch (error) {
        logMessage(`Error executing purchase: ${error.reason || error.message}`);
    }
};

// Function to monitor and execute sell
const monitorAndSell = async (tokenAddress, purchasePrice, routerContract, provider, baseTokenAddress, wallet) => {
    try {
        const currentPrice = await getTokenPrice(tokenAddress);
        if (currentPrice === 0) {
            logMessage("Unable to fetch current price. Skipping profit-taking.");
            return;
        }
        logMessage(`Current Price of Token: $${currentPrice} USD`);

        const profitPercentage = ((currentPrice - purchasePrice) / purchasePrice) * 100;
        logMessage(`Profit Percentage: ${profitPercentage.toFixed(2)}%`);

        if (profitPercentage >= PROFIT_THRESHOLD) {
            logMessage(`Profit threshold met (${PROFIT_THRESHOLD}%). Executing sell...`);

            const tokenABI = [
                "function approve(address spender, uint amount) public returns (bool)",
                "function balanceOf(address owner) public view returns (uint)"
            ];
            const tokenContract = new ethers.Contract(tokenAddress, tokenABI, wallet);

            const tokenBalance = await tokenContract.balanceOf(wallet.address);

            const approveTx = await tokenContract.approve(process.env.ROUTER_ADDRESS, tokenBalance);
            logMessage(`Approve Transaction Submitted: ${approveTx.hash}`);
            await approveTx.wait();
            logMessage(`Approved ${ethers.utils.formatUnits(tokenBalance, 18)} tokens for Router.`);

            const path = [tokenAddress, baseTokenAddress];

            const amountsOutSell = await routerContract.getAmountsOut(tokenBalance, path);
            const amountOutMinSell = amountsOutSell[1].mul(100 - SLIPPAGE_TOLERANCE).div(100);

            const deadlineSell = Math.floor(Date.now() / 1000) + DEADLINE_BUFFER;

            logMessage(`Executing sell swap: Selling ${ethers.utils.formatUnits(tokenBalance, 18)} tokens for ETH...`);

            const txSell = await routerContract.swapExactTokensForETH(
                tokenBalance,
                amountOutMinSell.toString(),
                path,
                wallet.address,
                deadlineSell,
                {
                    gasPrice: await provider.getGasPrice(),
                    gasLimit: 300000,
                }
            );

            logMessage(`Sell Transaction Submitted: ${txSell.hash}`);

            const receiptSell = await txSell.wait();
            logMessage("Sell Transaction Confirmed!");

            const ethPrice = await getETHPrice();

            const profitETH = ethers.utils.formatEther(amountsOutSell[1]);
            const profitUSD = profitETH * ethPrice;
            logMessage(`Profit Secured: ${profitETH} ETH (~$${profitUSD.toFixed(2)} USD)`);
        } else {
            logMessage(`Profit threshold not met (${PROFIT_THRESHOLD}%). Waiting...`);
        }
    } catch (error) {
        logMessage(`Error in profit-taking: ${error.message}`);
    }
};

// Function to fetch token price
const getTokenPrice = async (tokenAddress) => {
    try {
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/ethereum`, {
            params: {
                contract_addresses: tokenAddress,
                vs_currencies: 'usd'
            }
        });
        const price = response.data[tokenAddress.toLowerCase()]?.usd || 0;
        return price;
    } catch (error) {
        logMessage(`Error fetching token price: ${error.message}`);
        return 0;
    }
};

// Function to fetch ETH price
const getETHPrice = async () => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
            params: {
                ids: 'ethereum',
                vs_currencies: 'usd'
            }
        });
        return response.data.ethereum.usd;
    } catch (error) {
        logMessage(`Error fetching ETH price: ${error.message}`);
        return 4000; // Fallback to $4000 if API fails
    }
};

// Function to monitor front-running (placeholder)
const monitorFrontRunning = async (pairAddress, newToken) => {
    logMessage(`Monitoring for front-running opportunities on pair: ${pairAddress}`);
    // Implement advanced logic with mempool access or services like Flashbots
};

// Function to listen for PairCreated events
const listenForPairCreated = async () => {
    try {
        factoryContract.on("PairCreated", async (token0, token1, pairAddress, event) => {
            if (!botRunning) return;
            logMessage(`New Pair Detected: ${pairAddress} - Token0: ${token0}, Token1: ${token1}`);
            await executePurchase(pairAddress, token0, token1, provider, routerContract, process.env.BASE_TOKEN_ADDRESS, wallet);
        });

        logMessage('Listening for PairCreated events...');
    } catch (error) {
        logMessage(`Error setting up event listeners: ${error.message}`);
    }
};

// Main Execution Block
(async () => {
    console.log("Ethers.js version:", ethers.version);

    let ROUTER_ADDRESS, FACTORY_ADDRESS, BASE_TOKEN_ADDRESS, MOCK_TOKEN_ADDRESS, PRIVATE_KEY, RPC_URL;
    try {
        ROUTER_ADDRESS = ethers.utils.getAddress(process.env.ROUTER_ADDRESS);
        FACTORY_ADDRESS = ethers.utils.getAddress(process.env.FACTORY_ADDRESS);
        BASE_TOKEN_ADDRESS = ethers.utils.getAddress(process.env.BASE_TOKEN_ADDRESS);
        MOCK_TOKEN_ADDRESS = ethers.utils.getAddress(process.env.MOCK_TOKEN_ADDRESS);
        PRIVATE_KEY = process.env.PRIVATE_KEY;
        RPC_URL = process.env.RPC_URL;
        if (!RPC_URL) throw new Error("RPC_URL is not defined in .env");
    } catch (error) {
        console.error(`Error verifying addresses or missing PRIVATE_KEY/RPC_URL: ${error.message}`);
        process.exit(1);
    }

    logMessage("Verified Router Address: " + ROUTER_ADDRESS);
    logMessage("Verified Factory Address: " + FACTORY_ADDRESS);
    logMessage("Verified Base Token Address: " + BASE_TOKEN_ADDRESS);
    logMessage("Verified MockToken Address: " + MOCK_TOKEN_ADDRESS);

    provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    logMessage("Provider initialized.");

    wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    logMessage(`Using Wallet Address: ${wallet.address}`);

    try {
        const balance = await provider.getBalance(wallet.address);
        const formattedBalance = ethers.utils.formatEther(balance);
        logMessage(`Wallet Balance: ${formattedBalance} ETH`);
    } catch (error) {
        logMessage(`Error fetching balance: ${error.message}`);
    }

    const factoryABI = [
        "event PairCreated(address indexed token0, address indexed token1, address pair, uint)"
    ];
    const routerABI = [
        "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
        "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)"
    ];

    factoryContract = new ethers.Contract(FACTORY_ADDRESS, factoryABI, provider);
    routerContract = new ethers.Contract(ROUTER_ADDRESS, routerABI, wallet);

    logMessage("Setting up event listener for PairCreated...");
    listenForPairCreated();

    process.on('unhandledRejection', (reason, promise) => {
        logMessage(`Unhandled Rejection at: ${promise} - reason: ${reason}`);
    });

    logMessage("Sniping Bot is Running...");
})()
.catch((error) => {
    console.error(`Error occurred in execution: ${error.message}`);
    process.exit(1);
});

// Export Functions for Backend API
module.exports = {
    startBot,
    stopBot,
    getStatus,
    getLogs
};
