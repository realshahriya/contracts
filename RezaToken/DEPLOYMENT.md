# RezaToken Deployment Guide 🚀

This guide provides step-by-step instructions for deploying and managing RezaToken contracts on the TON blockchain.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Node.js** (v18 or higher)
2. **TON Blueprint** framework
3. **Testnet TON** for gas fees
4. **Wallet setup** with sufficient balance

## 🛠️ Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd RezaToken

# Install dependencies
npm install

# Install Blueprint globally (if not already installed)
npm install -g @ton/blueprint
```

## 🏗️ Project Structure

```tree
RezaToken/
├── contracts/                 # Tact smart contracts
│   ├── RezaTokenMinter.tact   # Main Jetton minter
│   ├── CustomJettonWallet.tact # Custom wallet with sale approval
│   └── PriceFeed.tact         # TON/USD price oracle
├── scripts/                   # Deployment and management scripts
│   ├── deploy.ts              # Main deployment script
│   ├── deploy-testnet.ts      # Testnet-specific deployment
│   ├── mintTokens.ts          # Token minting script
│   ├── updatePrice.ts         # Price feed update script
│   ├── approveSale.ts         # Sale approval script
│   └── checkBalance.ts        # Balance checking script
├── wrappers/                  # TypeScript contract wrappers
├── tests/                     # Test suite
└── build/                     # Compiled contracts (auto-generated)
```

## 🧪 Testnet Deployment

### Step 1: Prepare Your Environment

```bash
# Set up environment variables (optional)
export TONCENTER_API_KEY="your-api-key"  # Get from https://toncenter.com

# Compile contracts
npm run build
```

### Step 2: Deploy to Testnet

```bash
# Deploy all contracts to testnet
npm run deploy:testnet

# Or use Blueprint directly
npx blueprint run deploy-testnet
```

The deployment script will:

1. Deploy the PriceFeed contract
2. Deploy the RezaTokenMinter contract
3. Mint initial test tokens
4. Display contract addresses and explorer links

### Step 3: Verify Deployment

After deployment, you'll see output like:

```output
🎉 Testnet Deployment Complete!
================================
PriceFeed: EQD1...abc123
RezaTokenMinter: EQA2...def456
Your Wallet: EQB3...ghi789
Testnet Explorer: https://testnet.tonscan.org/address/EQA2...def456
```

## 🌐 Mainnet Deployment

### Step 1: Update Configuration

```bash
# Update blueprint.config.ts for mainnet
# Change network endpoint to mainnet
```

### Step 2: Deploy to Mainnet

```bash
# Deploy to mainnet (use with caution!)
npm run deploy

# Or specify mainnet explicitly
npx blueprint run deploy --network mainnet
```

⚠️ **Warning**: Mainnet deployment costs real TON. Test thoroughly on testnet first!

## 🔧 Post-Deployment Management

### Minting Tokens

```bash
# Mint tokens to a specific address
npm run mint
# Follow the prompts to specify amount and receiver

# Or use Blueprint
npx blueprint run mintTokens
```

### Updating Price Feed

```bash
# Update TON/USD price
npm run price
# Enter new price when prompted

# Or specify contract address
npx blueprint run updatePrice EQD1...abc123
```

### Approving Sales

```bash
# Approve token sales for a user
npm run approve
# Enter user address and USD amount limit

# Or with contract address
npx blueprint run approveSale EQA2...def456
```

### Checking Balances

```bash
# Check token balance
npm run balance
# Enter wallet address or minter + user address

# Or directly
npx blueprint run checkBalance EQB3...ghi789
```

## 📊 Contract Addresses

After deployment, save these addresses for future reference:

### Testnet

- **PriceFeed**: `EQD1...abc123`
- **RezaTokenMinter**: `EQA2...def456`
- **Your Wallet**: `EQB3...ghi789`

### Mainnet

- **PriceFeed**: `TBD`
- **RezaTokenMinter**: `TBD`

## 🔒 Security Considerations

### Owner Responsibilities

As the contract owner, you can:

- ✅ Mint new tokens (while minting is enabled)
- ✅ Update TON/USD price feed
- ✅ Approve token sales for users
- ✅ Permanently disable minting

### Best Practices

1. **Test Everything**: Always test on testnet first
2. **Secure Keys**: Never commit private keys to version control
3. **Monitor Prices**: Keep price feed updated regularly
4. **Audit Sales**: Review sale approvals periodically
5. **Consider Multisig**: Use multisig wallets for mainnet

## 🧪 Testing

Run the test suite to verify contract functionality:

```bash
# Run all tests
npm test

# Run with verbose output
VERBOSE_TESTS=true npm test

# Run specific test file
npm test -- RezaToken.test.ts
```

## 🔍 Monitoring and Verification

### Explorer Links

- **Testnet**: <https://testnet.tonscan.org/address/{contract-address}>
- **Mainnet**: <https://tonscan.org/address/{contract-address}>

### API Endpoints

- **Testnet**: <https://testnet.toncenter.com/api/v2/>
- **Mainnet**: <https://toncenter.com/api/v2/>

### Contract Verification

Verify your contracts on TON explorers by:

1. Uploading source code
2. Providing constructor parameters
3. Confirming compilation matches

## 🆘 Troubleshooting

### Common Issues

1. **Insufficient Gas**: Increase gas amount in deployment scripts
2. **Network Timeout**: Check internet connection and API endpoints
3. **Invalid Address**: Verify address format and network
4. **Permission Denied**: Ensure you're the contract owner

### Getting Help

- 📚 [TON Documentation](https://docs.ton.org/)
- 💬 [TON Developer Chat](https://t.me/tondev_eng)
- 🐛 [Report Issues](https://github.com/your-repo/issues)

## 📝 Deployment Checklist

### Pre-Deployment

- [ ] Contracts compiled successfully
- [ ] Tests passing
- [ ] Testnet deployment tested
- [ ] Security audit completed (for mainnet)
- [ ] Sufficient TON for gas fees

### Post-Deployment

- [ ] Contract addresses saved
- [ ] Explorer verification completed
- [ ] Initial tokens minted
- [ ] Price feed configured
- [ ] Sale approvals set up
- [ ] Monitoring systems active

## 🎉 Success

Your RezaToken contracts are now deployed and ready to use!

Remember to:

- Keep your private keys secure
- Monitor contract activity
- Update price feeds regularly
- Test all functionality thoroughly

Happy tokenizing! 🪙
