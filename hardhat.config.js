// hardhat.config.js

require("@nomiclabs/hardhat-ethers");  // Correct for interacting with ethers.js
require("@nomiclabs/hardhat-waffle"); // Correct for Waffle integration

require("dotenv").config();

const {
  MAINNET_URL,
  SEPOLIA_URL,
  PRIVATE_KEY,
} = process.env;

// Validate essential environment variables
if (!MAINNET_URL || !SEPOLIA_URL || !PRIVATE_KEY) {
  throw new Error("Please ensure MAINNET_URL, SEPOLIA_URL, and PRIVATE_KEY are set in your .env file.");
}

module.exports = {
  solidity: "0.8.20", // Specify the Solidity compiler version
  networks: {
    hardhat: {
      forking: {
        url: MAINNET_URL, // HTTP URL for mainnet forking
        blockNumber: 17500000, // Optional: Pin block number for deterministic results
      },
      chainId: 1337, // Chain ID for Hardhat local network
    },
    sepolia: {
      url: SEPOLIA_URL, // Sepolia RPC URL
      accounts: [`0x${PRIVATE_KEY}`], // Prepend '0x' since .env does not include it
      chainId: 11155111, // Sepolia Chain ID
    },
    mainnet: {
      url: MAINNET_URL, // Mainnet RPC URL
      accounts: [`0x${PRIVATE_KEY}`], // Prepend '0x' since .env does not include it
      chainId: 1, // Ethereum mainnet Chain ID
    },
  },
};
