const { ethers } = require('hardhat');
require('dotenv').config();

async function main() {
    const factoryAddress = process.env.FACTORY_ADDRESS; // Uniswap Factory address
    if (!factoryAddress) {
        throw new Error('FACTORY_ADDRESS not found in .env file');
    }

    const factoryContract = await ethers.getContractAt('IUniswapV2Factory', factoryAddress);
    const [owner] = await ethers.getSigners();

    // Tokens for creating the pair
    const tokenA = process.env.BASE_TOKEN_ADDRESS;
    const tokenB = '0x021DBfF4A864Aa25c51F0ad2Cd73266Fde66199d'; // Mock Token address

    console.log(`Checking if pair exists for tokens ${tokenA} and ${tokenB}...`);

    // Check if the pair already exists
    const existingPair = await factoryContract.getPair(tokenA, tokenB);
    if (existingPair !== ethers.constants.AddressZero) {
        console.log(`Pair already exists at address: ${existingPair}`);
        return; // Exit if the pair exists
    }

    console.log(`Creating pair for tokens ${tokenA} and ${tokenB}...`);
    const tx = await factoryContract.connect(owner).createPair(tokenA, tokenB);
    const receipt = await tx.wait();

    console.log('PairCreated Event Emitted:', receipt.events);

    const event = receipt.events.find((e) => e.event === 'PairCreated');
    if (event) {
        console.log('Detected PairCreated:', {
            token0: event.args.token0,
            token1: event.args.token1,
            pair: event.args.pair,
        });
    } else {
        console.error('PairCreated event not found in transaction receipt.');
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
