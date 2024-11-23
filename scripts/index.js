// scripts/index.js

const { ethers } = require("hardhat");
require("dotenv").config();
const axios = require('axios');

// -----------------------
// Configuration Constants
// -----------------------

// Amount of ETH the bot will use to buy new tokens
const ETH_AMOUNT_TO_SWAP = "0.05"; // 0.05 ETH

// Maximum acceptable slippage percentage to protect against price volatility
const SLIPPAGE_TOLERANCE = 5; // 5%

// Multiplier to increase gas price for transaction prioritization (front-running)
const GAS_PRICE_MULTIPLIER = 1.2; // 20% increase

// Profit percentage threshold at which the bot will sell the acquired tokens
const PROFIT_THRESHOLD = 10; // 10%

// Time buffer (in seconds) added to transaction deadlines to ensure timely processing
const DEADLINE_BUFFER = 60; // 60 seconds

// ------------------------------------
// Function to Fetch Liquidity
// ------------------------------------

// This function retrieves the WETH reserve from the Uniswap Pair contract,
// which serves as the liquidity measure for the pair.
const fetchLiquidity = async (pairAddress, provider, baseTokenAddress) => {
    try {
        // ABI for Uniswap Pair contract to interact with necessary functions
        const pairABI = [
            "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
            "function token0() external view returns (address)",
            "function token1() external view returns (address)"
        ];

        // Initialize the Pair contract
        const pairContract = new ethers.Contract(pairAddress, pairABI, provider);

        // Fetch reserves from the Pair contract
        const [reserve0, reserve1] = await pairContract.getReserves();

        // Fetch token0 and token1 addresses
        const token0 = await pairContract.token0();
        const token1 = await pairContract.token1();

        // Determine which reserve corresponds to WETH
        let reserveWETH;
        if (token0.toLowerCase() === baseTokenAddress.toLowerCase()) {
            reserveWETH = reserve0;
        } else if (token1.toLowerCase() === baseTokenAddress.toLowerCase()) {
            reserveWETH = reserve1;
        } else {
            // WETH is not part of the pair
            console.log("Pair does not include WETH. Ignoring.");
            return ethers.BigNumber.from("0");
        }

        // Return WETH reserve as liquidity
        return reserveWETH;
    } catch (error) {
        console.error("Error fetching liquidity:", error.message);
        // Return zero if there's an error to prevent the bot from acting on invalid data
        return ethers.BigNumber.from("0");
    }
};

// ------------------------------------
// Function to Evaluate Pair Profitability
// ------------------------------------

// This function evaluates whether a newly created trading pair is profitable
// based solely on its liquidity.
const evaluatePair = async (newTokenAddress, pairAddress, provider, baseTokenAddress) => {
    // Fetch the WETH reserve (liquidity) for the pair
    const reserveWETH = await fetchLiquidity(pairAddress, provider, baseTokenAddress);
    console.log(`Reserve WETH for Pair ${pairAddress}: ${ethers.utils.formatEther(reserveWETH)} WETH`);

    // Define the liquidity threshold (e.g., 500 WETH)
    const liquidityThreshold = ethers.utils.parseEther("500"); // 500 WETH

    // Check if the pair's liquidity meets the threshold
    if (reserveWETH.gte(liquidityThreshold)) {
        return true; // Pair is profitable based on liquidity
    }
    return false; // Pair does not meet liquidity criteria
};

// -------------------------
// Function to Execute Purchase
// -------------------------

// This function handles the logic to purchase the new token if the pair is profitable.
const executePurchase = async (pairAddress, token0, token1, provider, routerContract, baseTokenAddress, wallet) => {
    try {
        console.log(`\nNew Pair Detected: ${pairAddress}`);
        console.log(`Token0: ${token0}`);
        console.log(`Token1: ${token1}`);

        // Verify if WETH is part of the pair
        if (
            token0.toLowerCase() !== baseTokenAddress.toLowerCase() &&
            token1.toLowerCase() !== baseTokenAddress.toLowerCase()
        ) {
            console.log("Pair does not include WETH. Ignoring.");
            return;
        }

        // Identify the new token (the one that's not WETH)
        let newToken;
        if (token0.toLowerCase() === baseTokenAddress.toLowerCase()) {
            newToken = token1;
        } else {
            newToken = token0;
        }

        // Ensure the new token address is checksummed
        newToken = ethers.utils.getAddress(newToken);
        console.log(`Attempting to buy new token: ${newToken}`);

        // Evaluate if the pair meets profitability criteria based on liquidity
        const isProfitable = await evaluatePair(newToken, pairAddress, provider, baseTokenAddress);
        if (!isProfitable) {
            console.log("Pair does not meet profitability criteria. Ignoring.");
            return;
        }

        // Define the swap path: WETH -> New Token
        const path = [baseTokenAddress, newToken];

        // Define the amount of ETH to swap (in wei)
        const amountIn = ethers.utils.parseEther(ETH_AMOUNT_TO_SWAP); // e.g., 0.05 ETH

        // Fetch current gas price from the provider
        const feeData = await provider.getFeeData();
        let gasPrice = feeData.gasPrice || ethers.utils.parseUnits("10", "gwei"); // Fallback gas price if undefined

        // Apply gas price multiplier for transaction prioritization
        gasPrice = gasPrice.mul(ethers.BigNumber.from(Math.floor(GAS_PRICE_MULTIPLIER * 100))).div(100);
        console.log(`Adjusted Gas Price: ${ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);

        // Calculate the minimum amount of tokens to receive based on slippage tolerance
        const amountsOut = await routerContract.getAmountsOut(amountIn, path);
        const amountOutMin = amountsOut[1].mul(100 - SLIPPAGE_TOLERANCE).div(100); // e.g., 5% slippage

        // Define the transaction deadline
        const deadline = Math.floor(Date.now() / 1000) + DEADLINE_BUFFER; // Current time + buffer

        console.log(`Executing swap: Sending ${ethers.utils.formatEther(amountIn)} ETH to buy new token...`);

        // Execute the swapExactETHForTokens function on Uniswap Router
        const tx = await routerContract.swapExactETHForTokens(
            amountOutMin.toString(),
            path,
            wallet.address,
            deadline,
            {
                value: amountIn, // Amount of ETH to send
                gasPrice: gasPrice, // Adjusted gas price
                gasLimit: 300000, // Gas limit (adjust based on network conditions)
            }
        );

        console.log(`Transaction Submitted: ${tx.hash}`);

        // Wait for the transaction to be mined and confirmed
        const receipt = await tx.wait();
        console.log("Transaction Confirmed!");

        // Fetch the purchase price (price per ETH)
        const purchasePrice = amountsOut[1].div(amountIn); // Price per ETH

        // Start monitoring the token for profit-taking
        monitorAndSell(newToken, purchasePrice, tx.hash, routerContract, provider, baseTokenAddress, wallet);
    } catch (error) {
        console.error("Error executing purchase:", error.reason || error.message);
    }
};

// -------------------------------------
// Function to Monitor and Execute Sell
// -------------------------------------

// This function monitors the token's price and executes a sell when the profit threshold is met.
const monitorAndSell = async (tokenAddress, purchasePrice, transactionHash, routerContract, provider, baseTokenAddress, wallet) => {
    try {
        // Fetch the current price of the token in USD
        const currentPrice = await getTokenPrice(tokenAddress);
        if (currentPrice === 0) {
            console.log("Unable to fetch current price. Skipping profit-taking.");
            return;
        }
        console.log(`Current Price of Token: $${currentPrice} USD`);

        // Calculate the profit percentage based on the purchase price
        const profitPercentage = ((currentPrice - purchasePrice) / purchasePrice) * 100;
        console.log(`Profit Percentage: ${profitPercentage.toFixed(2)}%`);

        // Check if the profit threshold is met
        if (profitPercentage >= PROFIT_THRESHOLD) {
            console.log(`Profit threshold met (${PROFIT_THRESHOLD}%). Executing sell...`);

            // Initialize the ERC20 token contract interface
            const tokenContract = await ethers.getContractAt("contracts/interfaces/IERC20.sol:IERC20", tokenAddress, wallet);

            // Fetch the token balance of the wallet
            const tokenBalance = await tokenContract.balanceOf(wallet.address);

            // Approve the Uniswap Router to spend the tokens
            await tokenContract.approve(ROUTER_ADDRESS, tokenBalance);
            console.log(`Approved ${ethers.utils.formatUnits(tokenBalance, 18)} tokens for Router.`);

            // Define the sell swap path: New Token -> WETH
            const path = [tokenAddress, baseTokenAddress];

            // Calculate the minimum amount of ETH to receive based on slippage tolerance
            const amountsOutSell = await routerContract.getAmountsOut(tokenBalance, path);
            const amountOutMinSell = amountsOutSell[1].mul(100 - SLIPPAGE_TOLERANCE).div(100); // e.g., 5% slippage

            // Define the transaction deadline
            const deadlineSell = Math.floor(Date.now() / 1000) + DEADLINE_BUFFER; // Current time + buffer

            console.log(`Executing sell swap: Selling ${ethers.utils.formatUnits(tokenBalance, 18)} tokens for ETH...`);

            // Execute the swapExactTokensForETH function on Uniswap Router
            const txSell = await routerContract.swapExactTokensForETH(
                tokenBalance,
                amountOutMinSell.toString(),
                path,
                wallet.address,
                deadlineSell,
                {
                    gasPrice: await provider.getGasPrice(), // Current gas price
                    gasLimit: 300000, // Gas limit (adjust based on network conditions)
                }
            );

            console.log(`Sell Transaction Submitted: ${txSell.hash}`);

            // Wait for the sell transaction to be mined and confirmed
            const receiptSell = await txSell.wait();
            console.log("Sell Transaction Confirmed!");

            // Fetch the current ETH price in USD
            const ethPrice = await getETHPrice();

            // Calculate and log the profit in ETH and USD
            const profitETH = ethers.utils.formatEther(amountsOutSell[1]);
            const profitUSD = profitETH * ethPrice;
            console.log(`Profit Secured: ${profitETH} ETH (~$${profitUSD.toFixed(2)} USD)`);
        } else {
            console.log(`Profit threshold not met (${PROFIT_THRESHOLD}%). Waiting...`);
            // Optionally, implement a scheduler or listener to re-check after some time
        }
    } catch (error) {
        console.error("Error in profit-taking:", error.message);
    }
};

// ------------------------
// Function to Fetch Token Price
// ------------------------

// This function retrieves the current price of a token in USD using the CoinGecko API.
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
        console.error("Error fetching token price:", error.message);
        return 0; // Return 0 or a fallback value if API call fails
    }
};

// ------------------------
// Function to Fetch ETH Price
// ------------------------

// This function retrieves the current price of ETH in USD using the CoinGecko API.
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
        console.error("Error fetching ETH price:", error.message);
        return 4000; // Fallback to $4000 if API fails
    }
};

// ---------------------------------
// Function to Monitor Front-Running (Placeholder)
// ---------------------------------

// This function is a placeholder for implementing advanced front-running strategies.
// Future enhancements can include integrating with services like Flashbots.
const monitorFrontRunning = async (pairAddress, newToken) => {
    console.log(`Monitoring for front-running opportunities on pair: ${pairAddress}`);
    // Implement advanced logic with mempool access or services like Flashbots
};

// ----------------------
// Main Execution Block
// ----------------------

(async () => {
    // -----------------------
    // Initial Logging
    // -----------------------
    console.log("Ethers.js version:", ethers.version.ethers);

    // -----------------------------------
    // Load and Verify Configuration
    // -----------------------------------
    let ROUTER_ADDRESS, FACTORY_ADDRESS, BASE_TOKEN_ADDRESS, MOCK_TOKEN_ADDRESS, PRIVATE_KEY;
    try {
        ROUTER_ADDRESS = ethers.utils.getAddress(process.env.ROUTER_ADDRESS); // Uniswap V2 Router
        FACTORY_ADDRESS = ethers.utils.getAddress(process.env.FACTORY_ADDRESS); // Uniswap V2 Factory
        BASE_TOKEN_ADDRESS = ethers.utils.getAddress(process.env.BASE_TOKEN_ADDRESS); // WETH
        MOCK_TOKEN_ADDRESS = ethers.utils.getAddress(process.env.MOCK_TOKEN_ADDRESS); // MockToken
        PRIVATE_KEY = process.env.PRIVATE_KEY;
    } catch (error) {
        console.error("Error verifying addresses or missing PRIVATE_KEY:", error.message);
        process.exit(1);
    }

    console.log("Verified Router Address:", ROUTER_ADDRESS);
    console.log("Verified Factory Address:", FACTORY_ADDRESS);
    console.log("Verified Base Token Address:", BASE_TOKEN_ADDRESS);
    console.log("Verified MockToken Address:", MOCK_TOKEN_ADDRESS);

    // -----------------------
    // Define Contract ABIs
    // -----------------------
    const factoryABI = [
        "event PairCreated(address indexed token0, address indexed token1, address pair, uint)"
    ];

    const routerABI = [
        "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
        "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
        "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] memory path, address to, uint deadline) external returns (uint[] memory amounts)",
        "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)"
    ];

    // -----------------------
    // Initialize Provider and Wallet
    // -----------------------
    const provider = ethers.provider;
    console.log("Provider:", provider);
    console.log("Has getGasPrice method:", typeof provider.getGasPrice === "function");

    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`Using Wallet Address: ${wallet.address}`);

    // -----------------------
    // Check Wallet Balance
    // -----------------------
    try {
        const balance = await provider.getBalance(wallet.address);
        const formattedBalance = ethers.utils.formatEther(balance);
        console.log(`Wallet Balance: ${formattedBalance} ETH`);
    } catch (error) {
        console.error("Error fetching balance:", error.message);
    }

    // -----------------------
    // Initialize Contracts
    // -----------------------
    const factoryContract = new ethers.Contract(FACTORY_ADDRESS, factoryABI, provider);
    const routerContract = new ethers.Contract(ROUTER_ADDRESS, routerABI, wallet);

    // -----------------------
    // Listen for PairCreated Events
    // -----------------------
    console.log("Setting up event listener for PairCreated...");
    factoryContract.on("PairCreated", async (token0, token1, pairAddress, event) => {
        console.log(`\nDetected PairCreated Event`);
        console.log(`Token0: ${token0}`);
        console.log(`Token1: ${token1}`);
        console.log(`PairAddress: ${pairAddress}`);
        await executePurchase(pairAddress, token0, token1, provider, routerContract, BASE_TOKEN_ADDRESS, wallet);
    });

    // -----------------------
    // Global Error Handling
    // -----------------------
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        // Application specific logging, throwing an error, or other logic here
    });

    // -----------------------
    // Keep the Script Running
    // -----------------------
    console.log("Sniping Bot is Running...");
})()
.catch((error) => {
    console.error("Error occurred in execution:", error.message);
    process.exit(1);
});
