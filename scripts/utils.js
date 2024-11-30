// scripts/utils.js

/**
 * utils.js
 * 
 * Contains utility functions for the bot.
 */

const { ethers } = require('ethers');
const { logMessage } = require('./logging');
const { getSettings } = require('./settings'); // Import settings directly
const { getProvider, getRouterContract } = require('./contracts'); // Import getter functions

/**
 * Validates that the provider is initialized.
 * @returns {ethers.providers.Provider} The provider instance.
 * @throws Will throw an error if the provider is not initialized.
 */
function validateProvider() {
    const provider = getProvider(); // Use getter to get provider
    if (!provider) {
        throw new Error('Provider is not initialized. Ensure RPC configuration is correct.');
    }
    return provider;
}

/**
 * Evaluates whether a pair is worth purchasing based on predefined criteria.
 * @param {string} pairAddress - The address of the pair contract.
 * @param {string} token0 - Address of token0.
 * @param {string} token1 - Address of token1.
 * @returns {Promise<boolean>} - True if pair meets criteria, else false.
 */
async function evaluatePair(pairAddress, token0, token1) {
    try {
        logMessage(`Evaluating pair ${pairAddress} for viability.`, {}, 'info');

        // Validate provider initialization
        const provider = validateProvider();

        // Check if the pair contract exists by getting its code
        const code = await provider.getCode(pairAddress);
        if (!code || code === '0x') {
            logMessage(`No contract found at address ${pairAddress}`, {}, 'error');
            return false;
        }

        // Create a contract instance for the pair
        const pairABI = [
            'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
            'function token0() view returns (address)',
            'function token1() view returns (address)',
        ];
        const pairContract = new ethers.Contract(pairAddress, pairABI, provider);

        // Verify token0 and token1 from the contract match event data
        const pairToken0 = await pairContract.token0();
        const pairToken1 = await pairContract.token1();

        logMessage(`Pair token0: ${pairToken0}, token1: ${pairToken1}`, {}, 'info');

        if (
            pairToken0.toLowerCase() !== token0.toLowerCase() ||
            pairToken1.toLowerCase() !== token1.toLowerCase()
        ) {
            logMessage(
                `Pair tokens do not match event data. Expected token0: ${token0}, token1: ${token1}. Found token0: ${pairToken0}, token1: ${pairToken1}`,
                {},
                'error'
            );
            return false;
        }

        // Get reserves
        const reserves = await pairContract.getReserves();

        if (!reserves) {
            logMessage(`Failed to fetch reserves for pair ${pairAddress}`, {}, 'error');
            return false;
        }

        const reserve0 = reserves.reserve0.toString(); // Ensure string format
        const reserve1 = reserves.reserve1.toString();

        logMessage(`Pair Reserves: reserve0 = ${reserve0}, reserve1 = ${reserve1}`, {}, 'info');

        // Ensure reserves meet minimum threshold
        if (!reserve0 || !reserve1) {
            logMessage(`Invalid reserve values for pair ${pairAddress}`, {}, 'error');
            return false;
        }

        const minReserve = ethers.utils.parseUnits(getSettings().MIN_RESERVE_AMOUNT.toString(), 18);

        if (ethers.BigNumber.from(reserve0).lt(minReserve) || ethers.BigNumber.from(reserve1).lt(minReserve)) {
            logMessage(`Pair reserves too low. reserve0: ${reserve0}, reserve1: ${reserve1}`, {}, 'error');
            return false;
        }

        // Additional criteria can be added here (e.g., slippage, token properties)

        logMessage(`Pair ${pairAddress} passed evaluation.`, {}, 'info');

        return true;
    } catch (error) {
        logMessage(`Error evaluating pair ${pairAddress}: ${error.message}`, {}, 'error');
        console.error(`Error in evaluatePair for pair ${pairAddress}:`, error);
        return false;
    }
}

/**
 * Fetches and adjusts gas prices based on current network conditions and settings.
 * @returns {Promise<Object>} - An object containing maxFeePerGas and maxPriorityFeePerGas.
 */
async function getAdjustedGasPrice() {
    try {
        const provider = validateProvider();

        const gasPriceData = await provider.getFeeData();
        let maxFeePerGas = gasPriceData.maxFeePerGas;
        let maxPriorityFeePerGas = gasPriceData.maxPriorityFeePerGas;

        if (getSettings().GAS_PRICE_MULTIPLIER) {
            maxFeePerGas = maxFeePerGas.mul(getSettings().GAS_PRICE_MULTIPLIER).div(100);
            maxPriorityFeePerGas = maxPriorityFeePerGas.mul(getSettings().GAS_PRICE_MULTIPLIER).div(100);
        }

        logMessage(`Adjusted Gas Prices: maxFeePerGas = ${ethers.utils.formatUnits(maxFeePerGas, 'gwei')} gwei, maxPriorityFeePerGas = ${ethers.utils.formatUnits(maxPriorityFeePerGas, 'gwei')} gwei`, {}, 'info');

        return {
            maxFeePerGas,
            maxPriorityFeePerGas,
        };
    } catch (error) {
        logMessage(`Error fetching gas prices: ${error.message}`, {}, 'error');
        // Return default gas prices if there's an error
        return {
            maxFeePerGas: ethers.utils.parseUnits('100', 'gwei'),
            maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei'),
        };
    }
}

/**
 * Monitors the price of a token and executes a sell if conditions are met.
 * @param {string} tokenAddress - The address of the token to monitor.
 */
async function monitorTokenPrice(tokenAddress) {
    try {
        logMessage(`Starting price monitoring for token ${tokenAddress}.`, {}, 'info');

        const targetProfitPercentage = getSettings().PROFIT_THRESHOLD; // e.g., 5 for 5%
        const checkPriceInterval = getSettings().CHECK_INTERVAL * 1000; // in milliseconds

        const initialPrice = await getTokenPrice(tokenAddress);
        if (initialPrice === 0) {
            logMessage(`Initial price of token ${tokenAddress} could not be fetched. Skipping monitoring.`, {}, 'error');
            return;
        }
        logMessage(`Initial price of token ${tokenAddress}: ${initialPrice} ETH`, {}, 'info');

        const interval = setInterval(async () => {
            try {
                const currentPrice = await getTokenPrice(tokenAddress);
                if (currentPrice === 0) {
                    logMessage(`Current price of token ${tokenAddress} could not be fetched. Continuing monitoring.`, {}, 'error');
                    return;
                }
                logMessage(`Current price of token ${tokenAddress}: ${currentPrice} ETH`, {}, 'info');

                const priceChange = ((currentPrice - initialPrice) / initialPrice) * 100;
                logMessage(`Price change: ${priceChange.toFixed(2)}%`, {}, 'info');

                if (priceChange >= targetProfitPercentage) {
                    logMessage(`Target profit of ${targetProfitPercentage}% reached. Initiating sell.`, {}, 'info');
                    clearInterval(interval);
                    const { executeSell } = require('./tradingOperations'); // Ensure this module exists
                    await executeSell(tokenAddress);
                }
            } catch (error) {
                logMessage(`Error during price monitoring: ${error.message}`, {}, 'error');
            }
        }, checkPriceInterval);

    } catch (error) {
        logMessage(`Error in monitorTokenPrice for ${tokenAddress}: ${error.message}`, {}, 'error');
    }
}

/**
 * Fetches the current price of a token in ETH.
 * @param {string} tokenAddress - The address of the token.
 * @returns {Promise<number>} - The current price in ETH.
 */
async function getTokenPrice(tokenAddress) {
    try {
        const routerContract = getRouterContract(); // Use getter to get routerContract
        const settings = getSettings();
        const path = [settings.BASE_TOKEN_ADDRESS, tokenAddress];
        const amountIn = ethers.utils.parseEther('1'); // 1 WETH

        const amounts = await routerContract.getAmountsOut(amountIn, path);
        const price = parseFloat(ethers.utils.formatEther(amounts[1]));

        return price;
    } catch (error) {
        logMessage(`Error fetching price for token ${tokenAddress}: ${error.message}`, {}, 'error');
        return 0;
    }
}

module.exports = {
    evaluatePair,
    getAdjustedGasPrice,
    monitorTokenPrice,
    getTokenPrice,
};
