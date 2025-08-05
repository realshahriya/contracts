# HYPEY Smart Contract Deployment Guide

## Prerequisites

1. **Node.js and npm** installed
2. **Testnet ETH** in your wallet (get from [Sepolia Faucet](https://sepoliafaucet.com/))
3. **Infura/Alchemy account** for RPC access
4. **Etherscan account** for contract verification

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
npm run setup
```

This will prompt you for:

- Sepolia RPC URL (from Infura/Alchemy)
- Your wallet private key
- Etherscan API key
- Multisig/admin wallet address
- Reserve burn address

### 3. Deploy to Sepolia Testnet

```bash
npm run deploy:sepolia
```

### 4. Verify Contracts

```bash
npm run verify:sepolia
```

## Manual Configuration

If you prefer to configure manually, create a `.env` file:

```env
# Network Configuration
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
ETHERSCAN_API_KEY=your_etherscan_api_key

# Wallet Configuration
PRIVATE_KEY=your_private_key_without_0x

# Deployment Addresses
MULTISIG_ADDRESS=0x1234567890123456789012345678901234567890
RESERVE_BURN_ADDRESS=0x1234567890123456789012345678901234567890
```

## Contract Architecture

The HYPEY ecosystem consists of:

1. **HYPEYToken** - ERC20 token with burn mechanics
2. **HYPEYTreasury** - Treasury for fund management
3. **HypeyVesting** - Token vesting contract
4. **MockTimelock** - Governance timelock controller

## Post-Deployment Setup

After deployment, you may want to:

1. **Distribute initial tokens** from the contract
2. **Set up burn exemptions** for system contracts
3. **Configure supported tokens** in treasury
4. **Create vesting schedules**

## Security Notes

- ⚠️ Never commit your `.env` file to version control
- 🔒 Use a multisig wallet for mainnet deployments
- 🛡️ All contracts are upgradeable via timelock governance
- 🔥 Burn mechanics are configurable by the owner

## Available Scripts

- `npm run compile` - Compile contracts
- `npm run test` - Run tests
- `npm run deploy:sepolia` - Deploy to Sepolia
- `npm run verify:sepolia` - Verify on Etherscan
- `npm run status:sepolia` - Check deployment status

## Troubleshooting

### Common Issues

1. **Insufficient funds**: Make sure you have enough testnet ETH
2. **RPC errors**: Check your Infura/Alchemy URL
3. **Verification fails**: Ensure Etherscan API key is correct

### Getting Help

- Check the test files for usage examples
- Review the contract documentation
- Ensure all environment variables are set correctly
