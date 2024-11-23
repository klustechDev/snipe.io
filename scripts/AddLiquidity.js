// scripts/AddLiquidity.js
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()));

    const tokenAddress = "0x4ea0Be853219be8C9cE27200Bdeee36881612FF2"; // Your MockToken address
    const routerAddress = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Mainnet Router for Uniswap V2

    const Router = await ethers.getContractAt("IUniswapV2Router02", routerAddress);
    const Token = await ethers.getContractAt("ERC20", tokenAddress);

    // Approve the router to move your MockToken
    let amountTokenDesired = ethers.utils.parseUnits("1000", 18);
    await Token.approve(routerAddress, amountTokenDesired);

    // Details for liquidity addition
    let amountTokenMin = ethers.utils.parseUnits("900", 18);
    let amountETHMin = ethers.utils.parseEther("1");
    let deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes from the current time

    // Add liquidity
    const tx = await Router.addLiquidityETH(
        tokenAddress,
        amountTokenDesired,
        amountTokenMin,
        amountETHMin,
        deployer.address,
        deadline,
        { value: ethers.utils.parseEther("1.5") }
    );

    const receipt = await tx.wait();
    console.log(`Liquidity Added | Transaction Hash: ${receipt.transactionHash}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
