const { ethers } = require("ethers");
require("dotenv").config();

const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

async function main() {
  const balance = await wallet.getBalance();
  console.log(`Wallet Address: ${wallet.address}`);
  console.log(`Balance: ${ethers.utils.formatEther(balance)} ETH`);
}

main();
