Snipe.io Sniping Bot 🚀
Welcome to the Snipe.io Sniping Bot, a cutting-edge cryptocurrency trading bot crafted to detect and capitalize on profitable trading pairs on decentralized exchanges (DEXes) like Uniswap. This bot automates the identification of newly created liquidity pools and executes buy and sell orders based on predefined profitability criteria, ensuring you stay ahead in the fast-paced crypto market.



🛠️ Features
Real-Time Pair Detection: Instantly listens for PairCreated events to identify new trading pairs.
Automated Trading: Executes buy orders for tokens that meet your profitability thresholds.
Profit Monitoring: Continuously tracks token prices to execute sell orders once profit targets are achieved.
User-Friendly Control Panel: Easily start, stop, and monitor the bot's status and activity logs through a responsive frontend dashboard.
Secure Configuration: Manages sensitive credentials securely using environment variables.
Persistent Logging: Maintains comprehensive logs to monitor bot activities and performance.
Customizable Settings: Tailor trading parameters such as ETH amount, slippage tolerance, gas price multiplier, and profit thresholds to align with your trading strategy.
Whitelist & Blacklist Management: Control which tokens the bot interacts with, enhancing security and strategy alignment.
📈 Live Demo


📋 Table of Contents
Prerequisites
Installation
Configuration
Usage
Troubleshooting
Contributing
Security Notice
License
Acknowledgements
Contact
🔧 Prerequisites
Before setting up the sniping bot, ensure you have the following installed on your system:

Node.js (v14 or later)
npm (comes with Node.js)
Git (for version control)
💻 Installation
Clone the Repository

bash
Copy code
git clone git@github.com:klustechDev/snipe.io.git
cd snipe.io
Install Backend Dependencies

bash
Copy code
npm install
Navigate to Frontend Directory and Install Dependencies

bash
Copy code
cd frontend
npm install
⚙️ Configuration
1. Setup Environment Variables
Create a .env file in the root directory of your project (~/sniping-bot) and add the following variables:

dotenv
Copy code
# .env

# Ethereum Node RPC URLs
RPC_URL_MAINNET=YOUR_ETHEREUM_MAINNET_RPC_URL
RPC_URL_LOCAL=YOUR_ETHEREUM_LOCAL_RPC_URL

# Uniswap Router and Factory Addresses
ROUTER_ADDRESS=0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
FACTORY_ADDRESS=0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f

# Base Token Address (e.g., WETH)
BASE_TOKEN_ADDRESS=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2

# Mock Token Address (for testing purposes)
MOCK_TOKEN_ADDRESS=0x021DBfF4A864Aa25c51F0ad2Cd73266Fde66199d

# Your Wallet's Private Key (KEEP THIS SECURE!)
PRIVATE_KEY=YOUR_PRIVATE_KEY

# Trading Settings
ETH_AMOUNT_TO_SWAP=0.1
SLIPPAGE_TOLERANCE=5
GAS_PRICE_MULTIPLIER=1.2
PROFIT_THRESHOLD=5
DEADLINE_BUFFER=60
MINIMUM_LOCKED_ETH=0.05
MAX_GAS_PRICE=200
CHECK_INTERVAL=60
MONITOR_DURATION=300

# Database Settings
DATABASE_PATH=./database/trades.db

# Log Settings
LOG_FILE=./logs/bot.log

# Token Lists (comma-separated addresses)
TOKEN_WHITELIST=0x1234567890abcdef,0xabcdef1234567890
TOKEN_BLACKLIST=0xabcdef1234567890,0x1234567890abcdef
⚠️ Ensure that the .env file is not tracked by Git to prevent exposing sensitive information. The .gitignore is already configured to exclude .env.

2. Secure .env File
If not already done, ensure .env is added to .gitignore:

bash
Copy code
echo ".env" >> .gitignore
3. Verify Addresses and RPC URL
RPC_URL_MAINNET: Obtain from providers like Infura, Alchemy, or QuickNode.
ROUTER_ADDRESS & FACTORY_ADDRESS: Ensure they match the DEX you're targeting (default is Uniswap V2).
BASE_TOKEN_ADDRESS: Typically WETH for ETH-based pools.
PRIVATE_KEY: Keep this secure and never expose it publicly.
🚀 Usage
1. Start the Backend Server
bash
Copy code
cd ~/sniping-bot
npm start
Expected Output:

plaintext
Copy code
Ethers.js version: ethers/5.7.2
[01/12/2024, 11:19:10 AM] Verified Router Address: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
[01/12/2024, 11:19:10 AM] Verified Factory Address: 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f
[01/12/2024, 11:19:10 AM] Verified Base Token Address: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
[01/12/2024, 11:19:10 AM] Verified MockToken Address: 0x021DBfF4A864Aa25c51F0ad2Cd73266Fde66199d
[01/12/2024, 11:19:10 AM] Provider initialized.
[01/12/2024, 11:19:10 AM] Using Wallet Address: 0x3772316FD86F64C7aa672ef8f2D4a19A7394d53d
Backend server is running on port 3001
[01/12/2024, 11:19:11 AM] Wallet Balance: 0.0 ETH
[01/12/2024, 11:19:11 AM] Setting up event listener for PairCreated...
[01/12/2024, 11:19:11 AM] Listening for PairCreated events...
[01/12/2024, 11:19:11 AM] Sniping Bot is Running...
2. Start the Frontend Server
Open a new terminal window/tab and run:

bash
Copy code
cd ~/sniping-bot/frontend
npm start
Expected Output:

plaintext
Copy code
You can now view frontend in the browser.

  Local:            http://localhost:3002
  On Your Network:  http://172.21.26.18:3002

Note that the development build is not optimized.
To create a production build, use npm run build.

webpack compiled successfully
3. Access the Control Panel
Open your web browser and navigate to http://localhost:3002.
Control Panel Features:
Get Status: Retrieves the current status of the bot.
Start Bot: Initiates the sniping bot.
Stop Bot: Terminates the sniping bot.
Activity Logs: Displays real-time logs of the bot's activities, including detected pairs, transactions, and errors.
🛠️ Troubleshooting
1. Proxy Errors
Issue:

plaintext
Copy code
Proxy error: Could not proxy request /api/logs from localhost:3002 to http://localhost:3001.
See https://nodejs.org/api/errors.html#errors_common_system_errors for more information (ECONNREFUSED).
Solution:

Ensure Frontend Proxy Configuration Points to Backend Port (3001):
Open frontend/package.json.

Update the proxy field:

json
Copy code
"proxy": "http://localhost:3001",
Restart the frontend server:

bash
Copy code
cd ~/sniping-bot/frontend
npm start
2. Port Conflicts (EADDRINUSE)
Issue:

plaintext
Copy code
Error: listen EADDRINUSE: address already in use :::3001
Solution:

Identify and Terminate Processes Using Port 3001:

For Linux/Mac:

bash
Copy code
lsof -i :3001
kill -9 <PID>
For Windows:

bash
Copy code
netstat -ano | findstr :3001
taskkill /PID <PID> /F
Restart Backend Server:

bash
Copy code
cd ~/sniping-bot
npm start
3. Event Listener Errors
Issue:

plaintext
Copy code
Error setting up event listeners: events require a provider or a signer with a provider (operation="once", code=UNSUPPORTED_OPERATION, version=contracts/5.7.0)
Solution:

Ensure Proper Contract Initialization:

Factory Contract: Should be initialized with a provider.
Router Contract: Should be initialized with a wallet (which includes the signer).
Sample Initialization:

javascript
Copy code
factoryContract = new ethers.Contract(FACTORY_ADDRESS, factoryABI, provider);
routerContract = new ethers.Contract(ROUTER_ADDRESS, routerABI, wallet);
Avoid Re-initializing Contracts Inside Functions: Use globally defined instances.

Restart Backend Server After Changes:

bash
Copy code
cd ~/sniping-bot
npm start
4. Wallet Balance Issues
Issue:

plaintext
Copy code
Wallet Balance: 0.0 ETH
Solution:

Fund Your Wallet:
Transfer ETH to your wallet address: 0x3772316FD86F64C7aa672ef8f2D4a19A7394d53d.
Use Etherscan to verify the balance.
🤝 Contributing
Contributions to Snipe.io are welcome! Follow these steps to contribute:

Fork the Repository

Click the "Fork" button at the top-right corner of the repository page on GitHub.

Create a New Branch

bash
Copy code
git checkout -b feature/YourFeatureName
Make Your Changes

Implement your feature or fix.

Commit Your Changes

bash
Copy code
git commit -m "Add some feature"
Push to the Branch

bash
Copy code
git push origin feature/YourFeatureName
Open a Pull Request

Navigate to the original repository on GitHub and click "Compare & pull request".

🔒 Security Notice
⚠️ Your private key is compromised. Follow the URGENT SECURITY NOTICE below to secure your assets.

Important:

Never expose your private keys. Ensure your .env file is secure and not tracked by Git.
Regularly monitor your wallet for unauthorized activities.
Use environment variables and secure storage solutions to manage sensitive information.
URGENT SECURITY STEPS:
Transfer All Funds:

Move all assets from the compromised wallet to a new, secure wallet immediately.
Revoke Permissions:

Revoke any permissions or API keys associated with the compromised wallet.
Secure .env File:

Ensure your .env file is included in .gitignore to prevent accidental commits.
Use secure methods to store and access environment variables.
Enable Two-Factor Authentication (2FA):

Protect your GitHub account and other related services with 2FA.
📄 License
This project is licensed under the MIT License. See the LICENSE file for details.

🙏 Acknowledgements
Ethers.js
Uniswap
CoinGecko API
Express.js
React
Winston Logging Library
dotenv
📬 Contact
For any inquiries or support, please contact your.email@example.com.
