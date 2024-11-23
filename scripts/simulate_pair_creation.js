// scripts/simulate_pair_creation.js

const { ethers } = require("hardhat");
require("dotenv").config();

(async () => {
    console.log("Simulating PairCreated Event...");

    // Configuration from .env
    const provider = ethers.provider;
    console.log("Provider:", provider);
    console.log("Has getGasPrice method:", typeof provider.getGasPrice === "function");

    // Use WETH and MockToken addresses
    const tokenA = ethers.utils.getAddress("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"); // WETH
    const tokenB = ethers.utils.getAddress("0x4ea0Be853219be8C9cE27200Bdeee36881612FF2"); // MockToken (replace with actual)
    const factoryAddress = ethers.utils.getAddress(process.env.FACTORY_ADDRESS); // Uniswap V2 Factory

    // ABI for Uniswap V2 Factory
    const factoryABI = [
        "function createPair(address tokenA, address tokenB) external returns (address pair)",
        "function getPair(address tokenA, address tokenB) external view returns (address pair)"
    ];

    try {
        // Get signer and factory contract instance
        const [signer] = await ethers.getSigners();
        console.log(`Using Signer Address: ${signer.address}`);

        const factory = new ethers.Contract(factoryAddress, factoryABI, signer);

        // Check if the pair already exists
        const existingPair = await factory.getPair(tokenA, tokenB);
        if (existingPair !== ethers.constants.AddressZero) {
            console.log(`Pair already exists at address: ${existingPair}`);
            return; // Exit the script as the pair exists
        }

        console.log(`Creating pair for tokens ${tokenA} and ${tokenB}...`);
        const tx = await factory.createPair(tokenA, tokenB);
        console.log("Transaction Hash:", tx.hash);

        // Wait for transaction confirmation
        await tx.wait();
        console.log("Transaction Confirmed!");
    } catch (error) {
        console.error("Error occurred:", error.message);
    }
})()
.catch((error) => {
    console.error("Error occurred in execution:", error.message);
    process.exit(1);
});
