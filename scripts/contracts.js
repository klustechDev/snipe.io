// scripts/contracts.js

/**
 * contracts.js
 * 
 * Initializes blockchain contracts and related providers.
 */

const { ethers } = require('ethers');
const { FlashbotsBundleProvider } = require('@flashbots/ethers-provider-bundle');
const { logMessage } = require('./logging');
const { getSettings } = require('./settings');

let provider, wallet, factoryContract, routerContract, flashbotsProvider;

/**
 * Initializes the blockchain contracts and related providers.
 * @returns {Object} An object containing the initialized provider, wallet, contracts, and flashbotsProvider.
 */
async function initContracts() {
    try {
        logMessage('Initializing contracts...', {}, 'info');

        // Validate and format PRIVATE_KEY
        let privateKey = getSettings().PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('PRIVATE_KEY is missing in .env file.');
        }
        if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
            if (/^[a-fA-F0-9]{64}$/.test(privateKey)) {
                // Add '0x' prefix if missing
                privateKey = '0x' + privateKey;
            } else {
                throw new Error('Invalid PRIVATE_KEY format in .env file.');
            }
        }

        // Validate RPC_URL
        const RPC_URL = getSettings().RPC_URL_MAINNET;
        if (!RPC_URL) {
            throw new Error('RPC_URL_MAINNET must be defined in .env file.');
        }

        // Initialize WebSocketProvider with reconnection logic
        const initializeProvider = () => {
            try {
                provider = new ethers.providers.WebSocketProvider(RPC_URL);

                // WebSocket error handling
                provider._websocket.on('error', (error) => {
                    logMessage(`WebSocket error: ${error.message}`, {}, 'error');
                });

                provider._websocket.on('close', (code, reason) => {
                    logMessage(`WebSocket closed: ${code} - ${reason || 'No reason provided'}`, {}, 'error');
                    logMessage('Attempting to reconnect in 5 seconds...', {}, 'info');
                    setTimeout(() => initializeProvider(), 5000); // Reconnect
                });

                provider._websocket.on('open', () => {
                    logMessage('WebSocket connection established.', {}, 'info');
                });

                logMessage('WebSocketProvider initialized.', {}, 'info');
            } catch (error) {
                logMessage(`Error initializing WebSocketProvider: ${error.message}`, {}, 'error');
                throw new Error('Failed to initialize WebSocketProvider. Check RPC URL.');
            }
        };

        initializeProvider();

        // Initialize Wallet
        wallet = new ethers.Wallet(privateKey, provider);
        logMessage(`Wallet initialized: ${wallet.address}`, {}, 'info');

        // Initialize Flashbots Provider
        flashbotsProvider = await FlashbotsBundleProvider.create(
            provider,
            wallet,
            'https://relay.flashbots.net/' // Ensure this URL is correct or replace with your relay URL
        );
        logMessage('FlashbotsBundleProvider initialized.', {}, 'info');

        // Initialize Contracts
        const FACTORY_ADDRESS = ethers.utils.getAddress(getSettings().FACTORY_ADDRESS);
        const ROUTER_ADDRESS = ethers.utils.getAddress(getSettings().ROUTER_ADDRESS);

        const factoryABI = [
            'event PairCreated(address indexed token0, address indexed token1, address pair, uint)',
        ];
        const routerABI = [
            'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable',
            'function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory)',
            'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external',
        ];

        factoryContract = new ethers.Contract(FACTORY_ADDRESS, factoryABI, provider);
        routerContract = new ethers.Contract(ROUTER_ADDRESS, routerABI, wallet);
        logMessage('Factory and Router contracts initialized.', {}, 'info');

        // Validate connection
        const blockNumber = await provider.getBlockNumber();
        logMessage(`Connected to the blockchain. Current block number: ${blockNumber}`, {}, 'info');

        return { provider, wallet, factoryContract, routerContract, flashbotsProvider };
    } catch (error) {
        logMessage(`Error initializing contracts: ${error.message}`, {}, 'error');
        throw error; // Exit if contracts fail to initialize
    }
}

/**
 * Getter for the factory contract.
 * @returns {ethers.Contract} The factory contract instance.
 */
function getFactoryContractInstance() {
    if (!factoryContract) {
        throw new Error('Factory contract is not initialized. Call initContracts() first.');
    }
    return factoryContract;
}

/**
 * Getter for the router contract.
 * @returns {ethers.Contract} The router contract instance.
 */
function getRouterContractInstance() {
    if (!routerContract) {
        throw new Error('Router contract is not initialized. Call initContracts() first.');
    }
    return routerContract;
}

/**
 * Getter for the provider.
 * @returns {ethers.providers.WebSocketProvider} The provider instance.
 */
function getProviderInstance() {
    if (!provider) {
        throw new Error('Provider is not initialized.');
    }
    return provider;
}

/**
 * Getter for the wallet.
 * @returns {ethers.Wallet} The wallet instance.
 */
function getWalletInstance() {
    if (!wallet) {
        throw new Error('Wallet is not initialized.');
    }
    return wallet;
}

module.exports = {
    initContracts,
    getFactoryContract: getFactoryContractInstance,
    getRouterContract: getRouterContractInstance,
    getProvider: getProviderInstance,
    getWallet: getWalletInstance,
};
