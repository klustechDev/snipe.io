// hardhat.config.js

require("@nomiclabs/hardhat-ethers");  // Correct for interacting with ethers.js
require("@nomiclabs/hardhat-waffle"); // Correct for Waffle integration

require("dotenv").config();

module.exports = {
  solidity: "0.8.20", // Updated Solidity version
  networks: {
    hardhat: {
      forking: {
        url: process.env.MAINNET_URL,
        blockNumber: 17500000,
      },
      chainId: 1337,
    },
    sepolia: {
      url: process.env.SEPOLIA_URL,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
    mainnet: { // Ensure mainnet configuration exists as per previous steps
      url: process.env.MAINNET_URL,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
      chainId: 1,
    },
  },
};
