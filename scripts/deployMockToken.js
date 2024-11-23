// scripts/deployMockToken.js

const { ethers } = require("hardhat");

(async () => {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with the account: ${deployer.address}`);

    const MockToken = await ethers.getContractFactory("MockToken");
    const initialSupply = 1000000; // 1,000,000 tokens
    const mockToken = await MockToken.deploy("Mock Token", "MTK", initialSupply, {
        maxFeePerGas: ethers.utils.parseUnits('100', 'gwei'), // Example: 100 gwei
        maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei') // Example: 2 gwei
    });
    await mockToken.deployed();

    console.log(`MockToken deployed at: ${mockToken.address}`);
})().catch((error) => {
    console.error("Error deploying MockToken:", error);
    process.exit(1);
});
