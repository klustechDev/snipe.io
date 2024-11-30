// scripts/tokenAnalysis.js

const { ethers } = require('ethers');
const { logMessage } = require('./logging');
const { getProvider, getRouterContract, getWallet } = require('./contracts');
const settings = require('./settings');

/**
 * Checks if a token is a honeypot by attempting to estimate gas for selling.
 * This is a basic implementation and may not cover all honeypot checks.
 * @param {string} tokenAddress - The address of the token to check.
 * @returns {Promise<boolean>} - True if it's a honeypot, else false.
 */
async function isHoneypot(tokenAddress) {
    try {
        const provider = getProvider();
        const wallet = getWallet();

        // Create a contract instance for the token
        const tokenABI = [
            'function transfer(address to, uint amount) returns (bool)',
            'function approve(address spender, uint256 amount) external returns (bool)',
            'function allowance(address owner, address spender) view returns (uint)',
            'function balanceOf(address owner) view returns (uint)',
        ];
        const tokenContract = new ethers.Contract(tokenAddress, tokenABI, wallet);

        // Check balance
        const balance = await tokenContract.balanceOf(wallet.address);
        if (balance.isZero()) {
            logMessage(`No balance for token ${tokenAddress}. Cannot check honeypot.`, {}, 'error');
            return true;
        }

        // Approve router to spend tokens if not already approved
        const routerContract = getRouterContract();
        const allowance = await tokenContract.allowance(wallet.address, routerContract.address);
        if (allowance.lt(balance)) {
            logMessage(`Approving router to spend token ${tokenAddress}.`, {});
            const approveTx = await tokenContract.approve(routerContract.address, ethers.constants.MaxUint256, {
                gasLimit: 100000,
            });
            await approveTx.wait();
            logMessage(`Router approved to spend token ${tokenAddress}.`, {});
        }

        // Attempt to estimate gas for selling
        const path = [tokenAddress, settings.BASE_TOKEN_ADDRESS];
        const amountIn = balance.div(2); // Try to sell half

        try {
            const gasEstimate = await routerContract.estimateGas.swapExactTokensForETHSupportingFeeOnTransferTokens(
                amountIn,
                0, // amountOutMin
                path,
                wallet.address,
                Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from now
            );

            logMessage(`Token ${tokenAddress} is not a honeypot. Gas Estimate: ${gasEstimate.toString()}`, {}, 'info');
            return false;
        } catch (error) {
            logMessage(`Token ${tokenAddress} is likely a honeypot. Error during check: ${error.message}`, {}, 'error');
            return true;
        }
    } catch (error) {
        logMessage(`Error in isHoneypot for ${tokenAddress}: ${error.message}`, {}, 'error');
        return true;
    }
}

module.exports = { isHoneypot };
