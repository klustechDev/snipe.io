// testProvider.js
const { ethers } = require('ethers');
const settings = require('./scripts/settings'); // Import settings from the correct path

(async () => {
    try {
        if (!settings.RPC_URL_MAINNET) {
            throw new Error('RPC_URL_MAINNET is not set.');
        }

        const provider = new ethers.providers.JsonRpcProvider(settings.RPC_URL_MAINNET);
        const blockNumber = await provider.getBlockNumber();
        console.log('Successfully connected to the blockchain. Current block number:', blockNumber);
    } catch (error) {
        console.error('Failed to connect to the blockchain:', error.message);
    }
})();
