// scripts/test_provider.js

const { ethers } = require("hardhat");
require("dotenv").config();

(async () => {
    // Ethers.js v5 does not have a version property
    console.log("Ethers.js version: Not available in Ethers.js v5");

    // Configuration from .env
    const provider = ethers.provider;
    console.log("Provider:", provider);
    console.log("Has getGasPrice method:", typeof provider.getGasPrice === "function");

    try {
        // Example: Fetch and format wallet balance
        const walletAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"; // Replace with your wallet address if different
        const balance = await provider.getBalance(walletAddress);
        const formattedBalance = ethers.utils.formatEther(balance); // Correct usage
        console.log(`Wallet Balance: ${formattedBalance} ETH`);
    } catch (error) {
        console.error("Error during provider methods:", error.message);
    }
})()
.catch((error) => {
    console.error("Error occurred in execution:", error.message);
    process.exit(1);
});
