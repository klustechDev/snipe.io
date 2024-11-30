// scripts/tradingLogic.js

const { executePurchase } = require('./tradingOperations');
const { logMessage } = require('./logging');
const settings = require('./settings');
const { evaluatePair } = require('./utils');
const { isHoneypot } = require('./tokenAnalysis'); // Ensure this module exists and is correctly implemented

/**
 * Executes the purchase logic for a detected pair.
 * @param {string} pairAddress - The address of the pair contract.
 * @param {string} token0 - Address of token0.
 * @param {string} token1 - Address of token1.
 */
async function executePurchaseLogic(pairAddress, token0, token1) {
    try {
        logMessage(`Preparing to execute purchase for pair ${pairAddress}.`, {});

        const baseTokenAddress = settings.BASE_TOKEN_ADDRESS.toLowerCase();
        if (
            token0.toLowerCase() !== baseTokenAddress &&
            token1.toLowerCase() !== baseTokenAddress
        ) {
            logMessage('Pair does not include base token. Ignoring.', {}, 'info');
            return;
        }

        const newTokenAddress =
            token0.toLowerCase() === baseTokenAddress ? token1 : token0;

        logMessage(`New Token Address: ${newTokenAddress}`, {});

        // Evaluate the pair based on predefined criteria
        const isPairViable = await evaluatePair(pairAddress, token0, token1);
        if (!isPairViable) {
            logMessage('Pair evaluation failed. Ignoring.', {}, 'info');
            return;
        }

        // Check if the token is a honeypot
        const honeypotStatus = await isHoneypot(newTokenAddress);
        if (honeypotStatus) {
            logMessage('Token is identified as a honeypot. Skipping purchase.', {}, 'info');
            return;
        }

        // Execute the purchase
        await executePurchase(pairAddress, token0, token1);
    } catch (error) {
        logMessage(`Error executing purchase logic: ${error.message}`, {}, 'error');
    }
}

module.exports = {
    executePurchaseLogic,
};
