require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

// Default private key for local development (never use in production)
const DEFAULT_PRIVATE_KEY = "0x" + "0".repeat(64);

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.25",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: process.env.SEPOLIA_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "71fabd882327f9d9c10b2968800c651515355245309e992f17008ef203ebdeca" 
        ? [process.env.PRIVATE_KEY.startsWith('0x') ? process.env.PRIVATE_KEY : '0x' + process.env.PRIVATE_KEY] 
        : [DEFAULT_PRIVATE_KEY],
      chainId: 11155111,
      timeout: 60000,
      gasPrice: "auto",
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_URL || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "71fabd882327f9d9c10b2968800c651515355245309e992f17008ef203ebdeca" 
        ? [process.env.PRIVATE_KEY.startsWith('0x') ? process.env.PRIVATE_KEY : '0x' + process.env.PRIVATE_KEY] 
        : [DEFAULT_PRIVATE_KEY],
      chainId: 84532,
      timeout: 300000, // 5 minutes
      gasPrice: "auto",
      gasMultiplier: 2.0
    },
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_URL || "https://sepolia-rollup.arbitrum.io/rpc",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "71fabd882327f9d9c10b2968800c651515355245309e992f17008ef203ebdeca" 
        ? [process.env.PRIVATE_KEY.startsWith('0x') ? process.env.PRIVATE_KEY : '0x' + process.env.PRIVATE_KEY] 
        : [DEFAULT_PRIVATE_KEY],
      chainId: 421614,
      timeout: 60000,
      gasPrice: "auto",
    },
  },
  etherscan: {
    // Use single API key for Etherscan v2 (recommended approach)
    apiKey: process.env.ETHERSCAN_API_KEY || "J5XS1QDWTEP7I2PQ63N7TGXA2ETMUN5NC4",
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      },
      {
        network: "arbitrumSepolia", 
        chainId: 421614,
        urls: {
          apiURL: "https://api-sepolia.arbiscan.io/api",
          browserURL: "https://sepolia.arbiscan.io"
        }
      }
    ]
  },
  // Enable Sourcify verification as alternative to Etherscan
  sourcify: {
    enabled: true
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};