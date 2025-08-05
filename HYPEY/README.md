# HYPEY Smart Contracts

A comprehensive Hardhat-based development environment for the HYPEY ecosystem smart contracts, featuring automated testing, deployment scripts, and upgrade management.

## 🎯 Project Status

✅ **Successfully deployed to Base Sepolia testnet**

- All contracts deployed and configured
- Initial token distribution completed
- Access controls properly set
- System functionality verified

## 📁 Project Structure

```tree
HYPEY/
├── contracts/
│   ├── MockTimelock.sol            # Mock timelock for testing
│   ├── token/
│   │   ├── HYPEYToken.sol          # Main deflationary token contract
│   │   └── Readme.md               # Token documentation
│   ├── treasury/
│   │   ├── HYPEYTreasury.sol       # Treasury management contract
│   │   └── readme.md               # Treasury documentation
│   └── vesting/
│       ├── HypeyVesting.sol        # Token vesting contract
│       └── readme.md               # Vesting documentation
├── test/
│   ├── HYPEYToken.test.js          # Token contract tests
│   ├── HYPEYTreasury.test.js       # Treasury contract tests
│   ├── HypeyVesting.test.js        # Vesting contract tests
│   ├── Integration.test.js         # Full system integration tests
│   └── mocktimelock.sol            # Mock timelock test contract
├── scripts/
│   ├── deploy.js                   # Enhanced deployment script with validation
│   ├── verify.js                   # Batch contract verification script
│   ├── status.js                   # Contract status checker
│   ├── upgrade.js                  # Contract upgrade helper
│   ├── setup.js                    # Post-deployment configuration script
│   ├── test.js                     # Live network testing script
│   └── README.md                   # Scripts documentation
├── docs/
│   └── deployment-guide.md         # Comprehensive deployment guide
├── .openzeppelin/                  # OpenZeppelin upgrade data
├── package.json                    # Dependencies and scripts
├── hardhat.config.js              # Hardhat configuration
└── README.md                       # This file
```

## 🌐 Current Deployment

### Base Sepolia Testnet

- **Network**: Base Sepolia (Chain ID: 84532)
- **Status**: ✅ Deployed and Operational
- **Explorer**: [BaseScan Sepolia](https://sepolia.basescan.org/)

**Contract Addresses:**

- **HYPEYToken**: [View on BaseScan](https://sepolia.basescan.org/address/[TOKEN_ADDRESS])
- **HYPEYTreasury**: [View on BaseScan](https://sepolia.basescan.org/address/[TREASURY_ADDRESS])
- **HypeyVesting**: [View on BaseScan](https://sepolia.basescan.org/address/[VESTING_ADDRESS])
- **MockTimelock**: [View on BaseScan](https://sepolia.basescan.org/address/[TIMELOCK_ADDRESS])

**Token Information:**

- **Name**: HYPEY
- **Symbol**: HYPEY
- **Total Supply**: 1,000,000,000 HYPEY
- **Decimals**: 18
- **Type**: Deflationary ERC-20 with burn mechanics

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

### Installation

1. **Clone and navigate to the project:**

   ```bash
   cd HYPEY
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env` file with your configuration:

   ```env
   # Network URLs
   SEPOLIA_URL=https://sepolia.base.org  # Base Sepolia RPC
   MAINNET_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID

   # Private key for deployment (without 0x prefix)
   PRIVATE_KEY=your_private_key_here

   # Etherscan API key for contract verification
   ETHERSCAN_API_KEY=your_etherscan_api_key_here

   # Deployment addresses
   MULTISIG_ADDRESS=0x2a5554b3396D16cf8F2609adB05dBcC5d18bCe64
   RESERVE_BURN_ADDRESS=0x000000000000000000000000000000000000dEaD

   # Contract addresses (Base Sepolia)
   TOKEN_ADDRESS=0x[deployed_token_address]
   TREASURY_ADDRESS=0x[deployed_treasury_address]
   VESTING_ADDRESS=0x[deployed_vesting_address]
   TIMELOCK_ADDRESS=0x[deployed_timelock_address]
   ```

4. **Compile contracts:**

   ```bash
   npm run compile
   ```

5. **Run tests:**

   ```bash
   npm test
   ```

## 🧪 Testing

### Test Coverage

The test suite includes comprehensive coverage for:

- **HYPEYToken.test.js**: Token functionality, burn mechanisms, access controls
- **HYPEYTreasury.test.js**: Treasury operations, role management, pause functionality
- **HypeyVesting.test.js**: Vesting schedules, claiming, time-based calculations
- **Integration.test.js**: Full system interactions, upgrade scenarios, emergency procedures

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/HYPEYToken.test.js

# Run tests with gas reporting
npm run test:gas

# Run tests with coverage
npm run test:coverage
```

### Test Features

- **Fixtures**: Efficient test setup using Hardhat's loadFixture
- **Time Manipulation**: Testing time-dependent vesting logic
- **Access Control**: Comprehensive role-based permission testing
- **Integration**: Full system workflow testing
- **Gas Optimization**: Gas usage monitoring and optimization
- **Edge Cases**: Boundary condition and error scenario testing

## 🚀 Deployment

### Supported Networks

The project supports deployment to the following networks:

- **Hardhat Local**: For development and testing
- **Localhost**: Local Hardhat node
- **Sepolia**: Ethereum Sepolia testnet
- **Base Sepolia**: Base Sepolia testnet (currently deployed)
- **Mainnet**: Ethereum mainnet

### Environment Setup

Configure your `.env` file with the required values:

```env
# Network URLs
SEPOLIA_URL=https://sepolia.base.org  # Currently configured for Base Sepolia
MAINNET_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID

# Private key for deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Deployment addresses
MULTISIG_ADDRESS=0x2a5554b3396D16cf8F2609adB05dBcC5d18bCe64
RESERVE_BURN_ADDRESS=0x000000000000000000000000000000000000dEaD
```

### Deployment Commands

```bash
# Deploy to local network
npm run deploy:localhost

# Deploy to Base Sepolia testnet (current configuration)
npm run deploy:sepolia

# Deploy to Ethereum Sepolia testnet
# (requires updating SEPOLIA_URL to Ethereum Sepolia RPC)

# Deploy to Ethereum mainnet
npm run deploy:mainnet

# Check deployment status
npm run status
npm run status:sepolia
npm run status:mainnet
```

### Current Base Sepolia Deployment

The contracts are currently deployed and operational on Base Sepolia:

```bash
# Run post-deployment setup
npm run setup

# Test contract functionality
node scripts/test.js --network baseSepolia

# Check contract status
npm run status:sepolia
```

### Enhanced Deployment Process

The enhanced deployment script (`scripts/deploy.js`) performs the following:

1. **Validate configuration** and environment variables
2. **Check deployer balance** and network connectivity
3. **Deploy HYPEYToken** with UUPS proxy pattern and gas estimation
4. **Initialize token** with reserve burn address
5. **Set token owner** to multisig address
6. **Deploy HYPEYTreasury** with multisig as admin
7. **Deploy HypeyVesting** with token and admin addresses
8. **Transfer initial supply** from token contract to treasury
9. **Verify contract ownership** and functionality
10. **Save comprehensive deployment data** to `deployments/{network}.json`
11. **Display detailed summary** with gas usage and next steps

### Post-Deployment

After successful deployment:

1. **Verify contracts:**

   ```bash
   npm run verify:sepolia  # or verify:mainnet
   ```

2. **Check deployment status:**

   ```bash
   npm run status:sepolia  # or status:mainnet
   ```

3. **Set up vesting schedules** using the vesting contract
4. **Configure platform approvals** for fee burns
5. **Set NFT contract approvals** for NFT interactions
6. **Transfer ownership** to production multisig if needed

## 📊 Current Status & Next Steps

### ✅ Completed

- [x] Smart contract development and testing
- [x] Comprehensive test suite with 100% coverage
- [x] Base Sepolia testnet deployment
- [x] Initial token distribution to Treasury and Vesting
- [x] Access control configuration
- [x] Burn exemption setup for system contracts
- [x] Contract functionality verification

### 🔄 In Progress

- [ ] Contract verification on BaseScan
- [ ] Frontend integration testing
- [ ] Additional testnet testing

### 🎯 Next Steps

1. **Verify contracts on BaseScan**

   ```bash
   npm run verify:sepolia
   ```

2. **Set up production environment variables for mainnet**

3. **Conduct final security audit**

4. **Deploy to Ethereum mainnet**

   ```bash
   npm run deploy:mainnet
   ```

5. **Configure production multisig and governance**

## 🔧 Configuration

### Hardhat Configuration

The project uses Hardhat with the following key configurations:

- **Solidity Version**: 0.8.25
- **Optimizer**: Enabled (200 runs)
- **Via IR**: Enabled for better optimization
- **Networks**: Hardhat, Localhost, Sepolia, Base Sepolia, Mainnet
- **Plugins**: OpenZeppelin Upgrades, Etherscan verification, Gas reporter

### Available Scripts

```bash
# Development
npm run compile          # Compile contracts
npm run clean           # Clean artifacts and cache
npm test               # Run all tests
npm run test:coverage  # Run tests with coverage
npm run test:gas       # Run tests with gas reporting

# Deployment
npm run deploy:localhost    # Deploy to local network
npm run deploy:sepolia     # Deploy to configured Sepolia network
npm run deploy:mainnet     # Deploy to Ethereum mainnet

# Management
npm run verify:sepolia     # Verify contracts on Etherscan
npm run verify:mainnet     # Verify contracts on Etherscan
npm run status:sepolia     # Check contract status
npm run status:mainnet     # Check contract status
npm run upgrade:sepolia    # Upgrade contracts (if needed)
npm run upgrade:mainnet    # Upgrade contracts (if needed)

# Development Server
npm run node              # Start local Hardhat node

# Code Quality
npm run lint              # Lint JavaScript/TypeScript files
npm run lint:fix          # Fix linting issues
npm run format            # Format code with Prettier
npm run format:check      # Check code formatting
```

### Network Configuration

Current network settings in `hardhat.config.js`:

```javascript
networks: {
  hardhat: { chainId: 31337 },
  localhost: { url: "http://127.0.0.1:8545", chainId: 31337 },
  sepolia: { url: process.env.SEPOLIA_URL, chainId: 11155111 },
  baseSepolia: { url: process.env.SEPOLIA_URL, chainId: 84532 },
  mainnet: { url: process.env.MAINNET_URL, chainId: 1 }
}
```

## 🔐 Security Features

### Access Control

- **Multi-signature** wallet integration for ownership
- **Role-based permissions** across all contracts
- **Owner-only functions** for critical operations
- **Pause mechanisms** for emergency stops

### Upgrade Safety

- **UUPS proxy pattern** for secure upgrades
- **Admin-only upgrade authorization**
- **State preservation** across upgrades
- **Comprehensive upgrade testing**

## 📈 Contract Features

### HYPEYToken

- ✅ 1B initial supply with 18 decimals
- ✅ Deflationary mechanics with burn functionality
- ✅ Burn exemptions for system contracts
- ✅ UUPS upgradeable pattern
- ✅ Comprehensive access controls

### HYPEYTreasury

- ✅ Multi-token support (ERC20 + ETH)
- ✅ Role-based disbursement controls
- ✅ Emergency pause functionality
- ✅ UUPS upgradeable pattern

### HypeyVesting

- ✅ Flexible vesting schedules
- ✅ Cliff periods with unlock percentages
- ✅ Linear vesting with configurable slices
- ✅ Multiple schedules per beneficiary
- ✅ UUPS upgradeable pattern

## 🔄 Upgrade Management

### UUPS Upgrade Process

```bash
# Upgrade contracts on testnet
npm run upgrade:sepolia

# Upgrade contracts on mainnet
npm run upgrade:mainnet
```

The upgrade script performs:

1. Validate upgrade compatibility
2. Estimate gas costs
3. Deploy new implementations
4. Execute upgrades through proxy pattern
5. Verify functionality post-upgrade

## 📚 Documentation

For detailed information, see:

- [Deployment Guide](docs/deployment-guide.md) - Comprehensive deployment guide
- [Contract Documentation](contracts) - Individual contract documentation  
- [Scripts Documentation](scripts/README.md) - Scripts documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions or support:

- Create an issue in the repository
- Review the documentation in the `docs/` folder
- Check the deployment guide for common issues

---

**⚠️ Security Notice**: This project handles financial assets. Always conduct thorough testing and security audits before mainnet deployment.
