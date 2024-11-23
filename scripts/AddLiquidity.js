// scripts/AddLiquidity.js

const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Adding liquidity with the account:", deployer.address);
    console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

    const routerAddress = ethers.utils.getAddress(process.env.ROUTER_ADDRESS); // Uniswap V2 Router
    const factoryAddress = ethers.utils.getAddress(process.env.FACTORY_ADDRESS); // Uniswap V2 Factory
    const baseTokenAddress = ethers.utils.getAddress(process.env.BASE_TOKEN_ADDRESS); // WETH
    const mockTokenAddress = ethers.utils.getAddress(process.env.MOCK_TOKEN_ADDRESS); // MockToken

    // ABIs
    const routerABI = [
        "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
        "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)"
    ];

    const erc20ABI = [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function balanceOf(address account) external view returns (uint256)"
    ];

    // Create contract instances with fully qualified names
    const router = await ethers.getContractAt("UniswapV2Router02", routerAddress, deployer);
    const mockToken = await ethers.getContractAt("contracts/interfaces/IERC20.sol:IERC20", mockTokenAddress, deployer);
    const baseToken = await ethers.getContractAt("contracts/interfaces/IERC20.sol:IERC20", baseTokenAddress, deployer);

    // Approve router to spend MockToken
    const amountTokenDesired = ethers.utils.parseUnits("1000", 18); // 1000 MockTokens
    const approvalTx = await mockToken.approve(routerAddress, amountTokenDesired);
    console.log(`Approving ${ethers.utils.formatUnits(amountTokenDesired, 18)} MockTokens for Router...`);
    await approvalTx.wait();
    console.log("Approval transaction confirmed.");

    // Define slippage and deadline
    const slippage = 5; // 5%
    const amountTokenMin = amountTokenDesired.mul(100 - slippage).div(100); // 95% of desired
    const amountETHMin = ethers.utils.parseEther("0.05"); // Minimum ETH to add

    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

    // Amount of ETH to add
    const amountETH = ethers.utils.parseEther("1"); // 1 ETH

    console.log("Adding liquidity to Uniswap V2...");

    // Execute addLiquidityETH
    try {
        const tx = await router.addLiquidityETH(
            mockTokenAddress,
            amountTokenDesired,
            amountTokenMin,
            amountETHMin,
            deployer.address,
            deadline,
            {
                value: amountETH,
                gasPrice: ethers.utils.parseUnits('50', 'gwei'), // Adjust as needed
                gasLimit: 300000
            }
        );

        console.log(`Transaction submitted: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log("Liquidity added successfully!");
        console.log(`Transaction Receipt:`, receipt);
    } catch (error) {
        console.error("Error adding liquidity:", error.reason || error.message);
    }
}

main().catch((error) => {
    console.error("Error in AddLiquidity script:", error);
    process.exit(1);
});
