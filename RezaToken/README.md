# RezaToken 🚀

A modern Jetton (TON token) implementation built with Tact programming language for the TON blockchain.

## 📋 Overview

RezaToken is a fully-featured Jetton (fungible token) smart contract that follows the TEP-74 standard. It includes:

- ✅ **Mintable tokens** with owner control
- ✅ **Transfer functionality** between wallets
- ✅ **Burn mechanism** for token destruction
- ✅ **Owner-only minting** with ability to close minting
- ✅ **Standard Jetton interface** compatibility
- ✅ **Comprehensive test suite**

## 🏗️ Project Structure

```tree
rezatoken/
├── toncli.toml                     # TON project configuration
├── build/                         # Compiled contracts (auto-generated)
├── contracts/
│   └── RezaToken.tact             # Main smart contract code
├── func/                          # (Optional) Low-level TON logic
├── tests/
│   └── RezaToken.test.ts          # Unit tests
├── wallet/
│   └── wallet.testnet.txt         # Wallet configuration (testnet)
├── .ton-global.config             # Global TON CLI config
├── .gitignore                     # Git ignore rules
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
# Install Tact compiler globally
npm install -g @tact-lang/compiler

# If using Blueprint framework
npm install -g @ton/blueprint
```

### 2. Compile the Contract

```bash
# Compile using Tact
tact --config toncli.toml

# Or if using Blueprint
npx blueprint build
```

### 3. Run Tests

```bash
# Install test dependencies
npm install

# Run tests
npm test
```

### 4. Deploy to Testnet

1. **Setup your wallet:**
   - Edit `wallet/wallet.testnet.txt` with your testnet wallet details
   - Get testnet TON from [faucets](#-testnet-faucets)

2. **Deploy the contract:**

   ```bash
   # Using TON CLI
   toncli deploy --network testnet

   # Or using Blueprint
   npx blueprint run
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
