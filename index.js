// index.js

const { ethers } = require("hardhat");
require("dotenv").config();

(async () => {
    // Ethers.js v5 does not have a version property
    console.log("Ethers.js version: Not available in Ethers.js v5");

    // Configuration from .env with checksum enforcement
    let ROUTER_ADDRESS, FACTORY_ADDRESS, BASE_TOKEN_ADDRESS;
    try {
        ROUTER_ADDRESS = ethers.utils.getAddress(process.env.ROUTER_ADDRESS); // Uniswap V2 Router
        FACTORY_ADDRESS = ethers.utils.getAddress(process.env.FACTORY_ADDRESS); // Uniswap V2 Factory
        BASE_TOKEN_ADDRESS = ethers.utils.getAddress(process.env.BASE_TOKEN_ADDRESS); // WETH
    } catch (error) {
        console.error("Error verifying addresses:", error.message);
        process.exit(1);
    }

    console.log("Verified Router Address:", ROUTER_ADDRESS);
    console.log("Verified Factory Address:", FACTORY_ADDRESS);
    console.log("Verified Base Token Address:", BASE_TOKEN_ADDRESS);

    // ABI for Uniswap V2 Factory (only PairCreated event)
    const factoryABI = [
        "event PairCreated(address indexed token0, address indexed token1, address pair, uint)"
    ];

    // ABI for Uniswap V2 Router (swapExactETHForTokens function)
    const routerABI = [
        "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
        "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)"
    ];

    // Initialize provider and wallet using Hardhat's provider
    const provider = ethers.provider;
    console.log("Provider:", provider);
    console.log("Has getGasPrice method:", typeof provider.getGasPrice === "function");

    // Retrieve signers
    const signers = await ethers.getSigners();
    const wallet = signers[0];
    console.log(`Using Wallet Address: ${wallet.address}`);

    // Check wallet balance
    try {
        const balance = await provider.getBalance(wallet.address);
        const formattedBalance = ethers.utils.formatEther(balance); // Correct usage
        console.log(`Wallet Balance: ${formattedBalance} ETH`);
    } catch (error) {
        console.error("Error fetching balance:", error.message);
    }

    // Initialize Factory and Router Contracts
    const factoryContract = new ethers.Contract(FACTORY_ADDRESS, factoryABI, provider);
    const routerContract = new ethers.Contract(ROUTER_ADDRESS, routerABI, wallet);

    // Function to execute purchase
    const executePurchase = async (pairAddress, token0, token1) => {
        try {
            console.log(`\nNew Pair Detected: ${pairAddress}`);
            console.log(`Token0: ${token0}`);
            console.log(`Token1: ${token1}`);

            // Check if WETH is part of the pair
            if (
                token0.toLowerCase() !== BASE_TOKEN_ADDRESS.toLowerCase() &&
                token1.toLowerCase() !== BASE_TOKEN_ADDRESS.toLowerCase()
            ) {
                console.log("Pair does not include WETH. Ignoring.");
                return;
            }

            // Determine which token is the new token (the one that's not WETH)
            let newToken;
            if (token0.toLowerCase() === BASE_TOKEN_ADDRESS.toLowerCase()) {
                newToken = token1;
            } else {
                newToken = token0;
            }

            // Ensure the newToken address is checksummed
            newToken = ethers.utils.getAddress(newToken);
            console.log(`Attempting to buy new token: ${newToken}`);

            // Define the path: WETH -> New Token
            const path = [BASE_TOKEN_ADDRESS, newToken];

            // Amount of ETH to send (in wei)
            const amountIn = ethers.utils.parseEther("0.05"); // 0.05 ETH

            // Get current fee data
            const feeData = await provider.getFeeData();
            const gasPrice = feeData.gasPrice || ethers.utils.parseUnits("10", "gwei"); // Fallback gas price
            console.log(`Current Gas Price: ${ethers.utils.formatUnits(gasPrice, "gwei")} gwei`);

            // Get amounts out for slippage calculation
            const amountsOut = await routerContract.getAmountsOut(amountIn, path);
            const amountOutMin = amountsOut[1].mul(95).div(100); // 5% slippage

            // Define deadline (1 minute from now)
            const deadline = Math.floor(Date.now() / 1000) + 60;

            console.log(`Executing swap: Sending ${ethers.utils.formatEther(amountIn)} ETH to buy new token...`);

            // Execute the swapExactETHForTokens function
            const tx = await routerContract.swapExactETHForTokens(
                amountOutMin.toString(),
                path,
                wallet.address,
                deadline,
                {
                    value: amountIn,
                    gasPrice: gasPrice,
                    gasLimit: 300000, // Adjust based on network conditions
                }
            );

            console.log(`Transaction Submitted: ${tx.hash}`);
            // Wait for transaction confirmation
            await tx.wait();
            console.log("Transaction Confirmed!");
        } catch (error) {
            console.error("Error executing purchase:", error.reason || error.message);
        }
    };

    // Listen for PairCreated events
    console.log("Setting up event listener for PairCreated...");
    factoryContract.on("PairCreated", (token0, token1, pairAddress, event) => {
        console.log(`\nDetected PairCreated Event`);
        console.log(`Token0: ${token0}`);
        console.log(`Token1: ${token1}`);
        console.log(`PairAddress: ${pairAddress}`);
        executePurchase(pairAddress, token0, token1);
    });

    // Keep the script running
    console.log("Sniping Bot is Running...");
})()
.catch((error) => {
    console.error("Error occurred in execution:", error.message);
    process.exit(1);
});
