// scripts/index.js

const { initContracts, getFactoryContract } = require('./contracts');
const { executePurchaseLogic } = require('./tradingLogic');
const { logMessage } = require('./logging');

async function startBot() {
    try {
        logMessage('Starting bot...');
        
        // Initialize contracts and related providers
        await initContracts();

        // Get Factory contract
        const factoryContract = getFactoryContract();

        logMessage('Setting up event listeners...', {});

        // Set up listener for PairCreated events
        factoryContract.on('PairCreated', async (token0, token1, pairAddress, event) => {
            logMessage('Detected PairCreated Event:', { token0, token1, pairAddress, event });

            try {
                await executePurchaseLogic(pairAddress, token0, token1);
            } catch (error) {
                logMessage(`Error executing purchase logic: ${error.message}`, {}, 'error');
            }
        });

        logMessage('Listener for PairCreated events has been set up successfully.');
        logMessage('Bot started successfully.');
        logMessage('Sniping Bot is Ready.');
    } catch (error) {
        logMessage(`Error starting the bot: ${error.message}`, {}, 'error');
        process.exit(1);
    }
}

startBot();
