# RezaToken (RTZ) - DEX-Compatible Jetton

A fully compliant TEP-74 Jetton token designed specifically for seamless integration with TON blockchain decentralized exchanges (DEXs) like DeDust, STON.fi, and others.

## 🎯 Key Features

- **100% TEP-74 Compliant**: Follows the official Jetton standard exactly
- **DEX-Ready**: Compatible with all major TON DEXs out of the box
- **No Complex Logic**: Clean, simple implementation without unnecessary features that could break DEX compatibility
- **Standard Gas Costs**: Optimized for minimal transaction fees
- **Owner Controls**: Mint/burn capabilities with owner permissions

## 🚀 Quick Start

### Prerequisites

```bash
npm install
```

### 1. Deploy Token

```bash
npx blueprint run deploytoken
```

This will deploy your RezaToken contract and show you the contract address.

### 2. Mint Initial Supply

```bash
npx blueprint run mint-tokens
```

This will mint 1,000,000 RTZ tokens to your wallet.

### 3. Add to DEX

Your token is now ready to be added to any TON DEX! 

## 🔧 Configuration

Edit `scripts/config.ts` to customize:

- Contract address (after deployment)
- Owner address
- Gas fees
- Mint amounts

## 📊 Token Details

- **Name**: RezaToken
- **Symbol**: RTZ
- **Decimals**: 9
- **Max Supply**: 1,000,000,000 RTZ
- **Initial Supply**: 0 (mint as needed)

## 🏪 DEX Integration

### DeDust.io

1. Go to [DeDust.io](https://dedust.io)
2. Connect your wallet
3. Navigate to "Create Pool"
4. Enter your token contract address
5. Add TON/RTZ liquidity pair

### STON.fi

1. Visit [STON.fi](https://ston.fi)
2. Connect wallet
3. Go to "Pools" → "Create Pool"
4. Add your RTZ token address
5. Create TON/RTZ pair

### Other DEXs

This token follows the standard TEP-74 specification, so it will work with any compliant DEX on TON.

## 🛠 Available Scripts

- `deploytoken` - Deploy the token contract
- `mint-tokens` - Mint tokens to specified address
- `check-contract-state` - View current token state
- `get-all-data` - Get comprehensive token information

## 📋 Contract Interface

### Standard Jetton Methods

```typescript
// Get token metadata
get_jetton_data(): JettonData

// Get wallet address for owner
get_wallet_address(owner: Address): Address
```

### Owner-Only Operations

```typescript
// Mint tokens
Mint { amount: Int, receiver: Address }

// Close/open minting
"Owner: MintClose"
"Owner: MintOpen"
```

## 🔒 Security Features

- Owner-only minting controls
- Standard burn functionality
- Bounce handling for failed transfers
- Gas optimization for all operations

## 🧪 Testing

```bash
npm test
```

Runs comprehensive tests including:
- Token deployment
- Minting operations
- Transfer functionality
- DEX compatibility checks

## 📁 Project Structure

```
rezatoken/
├── contracts/
│   └── token.tact          # Main token contract
├── scripts/
│   ├── deploytoken.ts      # Deployment script
│   ├── mint-tokens.ts      # Minting script
│   └── config.ts           # Configuration
├── wrappers/
│   └── RezaToken.ts        # TypeScript wrapper
└── tests/                  # Test files
```

## 🤝 Why This Token Works with DEXs

Unlike complex tokens with custom logic, this implementation:

1. **Follows TEP-74 exactly** - No custom message types that confuse DEXs
2. **Standard gas costs** - Predictable fees for DEX smart contracts
3. **Clean transfers** - No transaction limits or complex validation
4. **Proper bouncing** - Handles failed transactions correctly
5. **Standard metadata** - DEXs can read token info properly

## 🆘 Troubleshooting

### Token not showing in DEX?

1. Verify contract is deployed: Check on [TONScan](https://tonscan.org)
2. Ensure you have minted tokens
3. Check if DEX supports your token (some have whitelists)

### Transfers failing?

1. Check wallet has sufficient TON for gas
2. Verify recipient address is correct
3. Ensure token balance is sufficient

### Can't add liquidity?

1. Make sure you have both TON and RTZ in your wallet
2. Check if the DEX requires minimum liquidity amounts
3. Verify token contract address is correct

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your token follows TEP-74 standard
3. Test transfers manually before adding to DEX
4. Ensure sufficient gas for all operations

## 📄 License

MIT License - feel free to use and modify as needed.

---

**Ready to trade!** 🚀 Your RezaToken is now fully compatible with TON DEXs.
