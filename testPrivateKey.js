const { Wallet } = require('ethers');
const privateKey = '0x34b4b38bd2b33c7bd86be5f80ccb9f885dd0a8c688e0b3b0e4777d9b3f49cde8'; // Replace with your private key
try {
    const wallet = new Wallet(privateKey);
    console.log(`Wallet address: ${wallet.address}`);
} catch (error) {
    console.error(`Error: ${error.message}`);
}
