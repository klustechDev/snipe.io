// scripts/tradingOperations.js

const { getProvider, getRouterContract, getWallet } = require('./contracts'); // Import getter functions
const { logMessage } = require('./logging');
const settings = require('./settings');
const { getAdjustedGasPrice, monitorTokenPrice } = require('./utils');
const { ethers } = require('ethers');
const { successfulTrades } = require('./state'); // Ensure this module exists and is correctly implemented
const { insertTrade } = require('./database'); // Ensure this module exists and is correctly implemented

/**
 * Executes a purchase transaction on a specified pair.
 * @param {string} pairAddress - The address of the pair contract.
 * @param {string} token0 - Address of token0.
 * @param {string} token1 - Address of token1.
 */
async function executePurchase(pairAddress, token0, token1) {
    try {
        logMessage(`Executing purchase on pair ${pairAddress}...`, {});

        const baseTokenAddress = settings.BASE_TOKEN_ADDRESS.toLowerCase();
        const tokenToBuy = token1.toLowerCase() === baseTokenAddress ? token0 : token1;

        const path = [baseTokenAddress, tokenToBuy];
        const deadline = Math.floor(Date.now() / 1000) + settings.MONITOR_DURATION;

        const gasPrices = await getAdjustedGasPrice();

        const amountOutMin = 0; // For safety, consider setting a realistic minimum to prevent front-running

        const routerContract = getRouterContract();
        const wallet = getWallet();

        const tx = await routerContract.swapExactETHForTokens(
            amountOutMin,
            path,
            wallet.address,
            deadline,
            {
                value: ethers.utils.parseEther(settings.ETH_AMOUNT_TO_SWAP),
                maxFeePerGas: gasPrices.maxFeePerGas,
                maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas,
                gasLimit: 300000, // Adjust based on estimated gas
            }
        );

        logMessage(`Purchase transaction submitted. Tx Hash: ${tx.hash}`, {});

        const receipt = await tx.wait();

        logMessage(`Purchase executed on pair ${pairAddress}. Tx Hash: ${tx.hash}`, {});

        // Record successful trade
        const tradeDetails = {
            timestamp: new Date().toISOString(),
            tokenAddress: tokenToBuy,
            amountIn: settings.ETH_AMOUNT_TO_SWAP,
            txHash: tx.hash,
            type: 'buy',
        };
        successfulTrades.push(tradeDetails);
        await insertTrade(tradeDetails);

        // Optionally, monitor the token price after purchase
        await monitorTokenPrice(tokenToBuy);

    } catch (error) {
        logMessage(`Error executing purchase on pair ${pairAddress}: ${error.reason || error.message}`, {}, 'error');
        console.error('Error in executePurchase:', error);
    }
}

/**
 * Executes a sell transaction for a specified token.
 * @param {string} tokenAddress - The address of the token to sell.
 */
async function executeSell(tokenAddress) {
    try {
        logMessage(`Executing sell for token ${tokenAddress}...`, {});

        const routerContract = getRouterContract();
        const wallet = getWallet();
        const provider = getProvider();

        // Ensure routerContract has allowance to spend the token
        const tokenContract = new ethers.Contract(tokenAddress, [
            'function approve(address spender, uint256 amount) external returns (bool)',
            'function allowance(address owner, address spender) view returns (uint256)',
            'function balanceOf(address owner) view returns (uint256)',
        ], wallet);

        const allowance = await tokenContract.allowance(wallet.address, routerContract.address);
        const balance = await tokenContract.balanceOf(wallet.address);

        if (allowance.lt(balance)) {
            const gasPrices = await getAdjustedGasPrice();
            const approveTx = await tokenContract.approve(routerContract.address, ethers.constants.MaxUint256, {
                gasLimit: 100000,
                maxFeePerGas: gasPrices.maxFeePerGas,
                maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas,
            });
            await approveTx.wait();
            logMessage('Token allowance set for router.', {});
        }

        const path = [tokenAddress, settings.BASE_TOKEN_ADDRESS];
        const amountIn = balance; // Sell entire balance
        const deadline = Math.floor(Date.now() / 1000) + settings.MONITOR_DURATION;

        const gasPrices = await getAdjustedGasPrice();

        const tx = await routerContract.swapExactTokensForETHSupportingFeeOnTransferTokens(
            amountIn.toString(),
            0, // amountOutMin (set a realistic minimum)
            path,
            wallet.address,
            deadline,
            {
                maxFeePerGas: gasPrices.maxFeePerGas,
                maxPriorityFeePerGas: gasPrices.maxPriorityFeePerGas,
                gasLimit: 300000, // Adjust based on estimated gas
            }
        );

        logMessage(`Sell transaction submitted. Tx Hash: ${tx.hash}`, {});

        const receipt = await tx.wait();

        logMessage(`Sell executed for token ${tokenAddress}. Tx Hash: ${tx.hash}`, {});

        // Record successful trade
        const tradeDetails = {
            timestamp: new Date().toISOString(),
            tokenAddress: tokenAddress,
            amountIn: ethers.utils.formatUnits(amountIn, 18),
            txHash: tx.hash,
            type: 'sell',
        };
        successfulTrades.push(tradeDetails);
        await insertTrade(tradeDetails);

    } catch (error) {
        logMessage(`Error executing sell for token ${tokenAddress}: ${error.reason || error.message}`, {}, 'error');
        console.error('Error in executeSell:', error);
    }
}

module.exports = {
    executePurchase,
    executeSell,
};
