// validate.js

const { ethers } = require("ethers");
require("dotenv").config();

const addresses = [
    { name: "ROUTER_ADDRESS", address: process.env.ROUTER_ADDRESS },
    { name: "FACTORY_ADDRESS", address: process.env.FACTORY_ADDRESS },
    { name: "BASE_TOKEN_ADDRESS", address: process.env.BASE_TOKEN_ADDRESS }
];

addresses.forEach(({ name, address }) => {
    try {
        const checksummed = ethers.utils.getAddress(address);
        console.log(`${name} is valid and checksummed as: ${checksummed}`);
    } catch (error) {
        console.log(`${name} is invalid: ${error.message}`);
    }
});
