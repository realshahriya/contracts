# RezaToken 🚀

A modern Jetton (TON token) implementation with advanced sale approval mechanism, built with Tact programming language for the TON blockchain.

## 📋 Overview

RezaToken is a sophisticated Jetton (fungible token) smart contract system that follows the TEP-74 standard with additional features:

- ✅ **Mintable tokens** with owner control
- ✅ **Sale approval mechanism** with USD-based limits
- ✅ **Price feed integration** for TON/USD rates
- ✅ **Custom wallet implementation** with transfer restrictions
- ✅ **Transfer functionality** between wallets
- ✅ **Burn mechanism** for token destruction
- ✅ **Owner-only minting** with ability to close minting
- ✅ **Standard Jetton interface** compatibility
- ✅ **Comprehensive test suite** and deployment scripts

## 🏗️ Project Structure

```tree
RezaToken/
├── contracts/                     # Tact smart contracts
│   ├── RezaTokenMinter.tact       # Main Jetton minter contract
│   ├── CustomJettonWallet.tact    # Custom wallet with sale approval
│   └── PriceFeed.tact             # TON/USD price oracle
├── scripts/                       # Deployment and management scripts
│   ├── deploy.ts                  # Main deployment script
│   ├── deploy-testnet.ts          # Testnet-specific deployment
│   ├── mintTokens.ts              # Token minting script
│   ├── updatePrice.ts             # Price feed update script
│   ├── approveSale.ts             # Sale approval script
│   └── checkBalance.ts            # Balance checking script
├── wrappers/                      # TypeScript contract wrappers
│   ├── RezaTokenMinter.ts         # Minter contract wrapper
│   ├── CustomJettonWallet.ts      # Wallet contract wrapper
│   └── PriceFeed.ts               # Price feed wrapper
├── tests/                         # Test suite
│   ├── RezaToken.test.ts          # Comprehensive contract tests
│   └── setup.ts                   # Test configuration
├── build/                         # Compiled contracts (auto-generated)
├── toncli.toml                    # TON project configuration
├── package.json                   # Node.js dependencies
├── blueprint.config.ts            # Blueprint framework config
├── tsconfig.json                  # TypeScript configuration
├── jest.config.js                 # Test configuration
├── DEPLOYMENT.md                  # Deployment guide
├── .env.example                   # Environment variables template
└── README.md                      # This file
```

## 🛠️ Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **Tact Compiler** - Install with: `npm install -g @tact-lang/compiler`
3. **TON CLI tools** (optional but recommended)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd RezaToken

# Install dependencies
npm install

# Install Blueprint globally (if not already installed)
npm install -g @ton/blueprint
```

### 2. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Add your mnemonic, API keys, etc.
```

### 3. Compile Contracts

```bash
# Compile all contracts
npm run build

# Or compile individually
tact --config toncli.toml
```

### 4. Run Tests

```bash
# Run comprehensive test suite
npm test

# Run with verbose output
VERBOSE_TESTS=true npm test
```

### 5. Deploy to Testnet

```bash
# Deploy all contracts to testnet
npm run deploy:testnet

# Or use Blueprint directly
npx blueprint run deploy-testnet
```

### 6. Manage Your Tokens

```bash
# Mint tokens
npm run mint

# Check balances
npm run balance

# Update price feed
npm run price

# Approve sales
npm run approve
```

## 🔧 Contract Features

### Core Functionality

- **Minting**: Only the contract owner can mint new tokens
- **Transfers**: Standard Jetton transfer between wallets
- **Burning**: Token holders can burn their tokens
- **Owner Controls**: Owner can close minting permanently

### Available Messages

| Message | Description | Access |
|---------|-------------|---------|
| `Mint` | Mint tokens to specified address | Owner only |
| `"Mint: 100"` | Quick mint 100 tokens to sender | Owner only |
| `"Owner: MintClose"` | Permanently disable minting | Owner only |
| `TokenTransfer` | Transfer tokens between wallets | Token holder |
| `TokenBurn` | Burn tokens from wallet | Token holder |

### Getter Methods

- `get_jetton_data()`: Returns total supply, mintable status, admin address, content, and wallet code
- `get_wallet_address(owner)`: Returns the wallet address for a given owner

## 🧪 Testing

The project includes comprehensive tests covering:

- Contract deployment
- Token minting (success and failure cases)
- Token transfers between users
- Token burning
- Owner-only operations
- Minting closure functionality

Run tests with:

```bash
npm test
```

## 🌐 Deployment Networks

### Testnet

- **Network**: TON Testnet
- **Explorer**: [testnet.tonscan.org](https://testnet.tonscan.org)
- **API**: `https://testnet.toncenter.com/api/v2/`

### Mainnet

- **Network**: TON Mainnet
- **Explorer**: [tonscan.org](https://tonscan.org)
- **API**: `https://toncenter.com/api/v2/`

## 🚰 Testnet Faucets

Get free testnet TON from:

- [TON Center Testnet](https://testnet.toncenter.com/)
- [Testgiver Bot](https://t.me/testgiver_ton_bot)

## 📚 Resources

- [Tact Documentation](https://docs.tact-lang.org/)
- [TON Documentation](https://docs.ton.org/)
- [Jetton Standard (TEP-74)](https://github.com/ton-blockchain/TEPs/blob/master/text/0074-jettons-standard.md)
- [TON Blueprint](https://github.com/ton-org/blueprint)

## 🔒 Security

- **Never commit private keys** to version control
- **Use testnet** for development and testing
- **Audit your contracts** before mainnet deployment
- **Follow security best practices** from TON documentation

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you have questions or need help:

- Check the [TON Developer Community](https://t.me/tondev_eng)
- Review the [Tact Documentation](https://docs.tact-lang.org/)
- Open an issue in this repository

---

### Happy Coding! 🎉
