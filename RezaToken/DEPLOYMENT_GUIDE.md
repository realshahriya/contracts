# RezaToken Deployment Guide

## Prerequisites

1. **Node.js and npm** installed
2. **TON wallet** with testnet TON for deployment
3. **Wallet mnemonic phrase** (24 words)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Wallet

Edit the `.env` file and replace the placeholder with your actual mnemonic:

```env
# Replace with your actual 24-word mnemonic phrase
WALLET_MNEMONIC="word1 word2 word3 ... word24"
WALLET_VERSION=v4R2
NETWORK=testnet
```

**⚠️ Security Warning:** Never commit your `.env` file to version control!

### 3. Get Testnet TON

- Install Tonkeeper or another TON wallet
- Switch to testnet mode
- Get testnet TON from: <https://t.me/testgiver_ton_bot>
- You'll need approximately 0.2 TON for deployment

### 4. Build Contracts

```bash
npm run build
```

### 5. Deploy Contracts

```bash
npm run start
```

Then select:

- Network: `testnet`
- Wallet: `Mnemonic`

## Deployment Process

The deployment script will:

1. **Deploy PriceFeed Contract**
   - Sets default TON/USD rate to $2.50
   - Owner can update the rate later

2. **Deploy RezaTokenMinter Contract**
   - Creates the main token contract
   - Links to the PriceFeed contract
   - Sets up token metadata (name: RezaToken, symbol: RTZ, decimals: 18)

## Post-Deployment Actions

After successful deployment, you can:

### 1. Mint Initial Tokens

Send a `Mint` message to the RezaTokenMinter contract:

```typescript
await token.send(sender, { value: toNano('0.05') }, {
    $$type: 'Mint',
    amount: toNano('1000'), // 1000 RTZ
    receiver: receiverAddress
});
```

### 2. Update TON/USD Price

Send an `UpdatePrice` message to the PriceFeed contract:

```typescript
await priceFeed.send(sender, { value: toNano('0.05') }, {
    $$type: 'UpdatePrice',
    tonUsdRate: 3000000 // $3.00 per TON (multiply by 1e6)
});
```

### 3. Approve Sales for Users

Send an `ApproveSale` message to allow users to sell tokens:

```typescript
await token.send(sender, { value: toNano('0.05') }, {
    $$type: 'ApproveSale',
    user: userAddress,
    amountUsd: 100000000 // $100 USD (multiply by 1e6)
});
```

## Contract Features

### RezaTokenMinter

- **Mintable Jetton**: Owner can mint new tokens
- **Sale Approval System**: Restricts token sales based on USD value
- **Price Feed Integration**: Uses external price oracle for USD calculations
- **Burn Mechanism**: Owner can burn tokens

### PriceFeed

- **Price Oracle**: Provides TON/USD exchange rate
- **Owner Controlled**: Only owner can update prices
- **Default Rate**: Starts with $2.50 per TON

## Security Notes

- 🔒 Only the owner can mint tokens
- 🔒 Only the owner can update price feeds
- 🔒 Sale approvals are required for transfers above $1 USD
- 🔒 All contracts are ownable and controlled by the deployer

## Troubleshooting

### Common Issues

1. **Insufficient Balance**: Ensure you have enough testnet TON
2. **Invalid Mnemonic**: Check that your 24-word phrase is correct
3. **Network Issues**: Verify you're connected to the correct network

### Getting Help

- Check the console output for detailed error messages
- Verify all environment variables are set correctly
- Ensure contracts are built before deployment

## Contract Addresses

After deployment, save these addresses:

- **PriceFeed**: `[Will be displayed after deployment]`
- **RezaTokenMinter**: `[Will be displayed after deployment]`
- **Owner**: `[Your wallet address]`

## Next Steps

1. Test token minting and transfers
2. Set up proper price feed updates
3. Configure sale approvals for your users
4. Consider deploying to mainnet when ready
