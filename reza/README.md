# RezaToken (RTZ) Project

A specialized Jetton (TON blockchain token) implementation with unique sell restrictions built with FunC smart contracts and TypeScript integration.

## Overview

RezaToken (RTZ) is a Jetton token on the TON blockchain with a unique feature: **sales above $1 are restricted unless approved by the token creator, while purchases are unrestricted**. This implementation uses FunC smart contracts and includes a complete development environment with compilation, testing, and deployment tools.

## Token Specifications

- **Name**: RezaToken
- **Symbol**: RTZ  
- **Total Supply**: 1,000,000 RTZ
- **Decimals**: 9
- **Special Feature**: $1 sell limit restriction (approximately 1 TON)

This project implements a specialized jetton (fungible token) contract following the TEP-74 standard. The implementation includes:

- **Jetton Minter Contract** (`jetton-minter.fc`): Main contract that manages token supply, minting, and administration
- **Jetton Wallet Contract** (`jetton-wallet.fc`): Individual wallet contracts for each token holder
- **TypeScript Wrappers**: Easy-to-use interfaces for interacting with the contracts
- **Comprehensive Tests**: Full test coverage for all contract functionality

## Features

- ✅ Standard jetton functionality (transfer, burn, mint) with custom restrictions
- ✅ Sell limit restriction: Sales above $1 (≈1 TON) require admin approval
- ✅ Unrestricted purchases: No limits on buying/receiving tokens
- ✅ Admin sell approval: Token creator can approve large sells for specific addresses
- ✅ Admin controls (change admin, change content, modify sell limits)
- ✅ Wallet discovery and address calculation
- ✅ Proper error handling and security checks
- ✅ Gas optimization and storage efficiency
- ✅ Full TypeScript support with wrappers
- ✅ Comprehensive test suite

## Project Structure

```tree
contracts/
├── jetton-minter.fc          # Main jetton contract
├── jetton-wallet.fc          # Individual wallet contract
├── imports/
│   ├── stdlib.fc             # Standard library functions
│   ├── params.fc             # Constants and parameters
│   ├── jetton-utils.fc       # Utility functions
│   └── op-codes.fc           # Operation codes
├── JettonMinter.compile.ts   # Minter compilation config
└── JettonWallet.compile.ts   # Wallet compilation config

wrappers/
├── JettonMinter.ts           # TypeScript wrapper for minter
└── JettonWallet.ts           # TypeScript wrapper for wallet

scripts/
└── deployJettonMinter.ts     # Deployment script

tests/
├── JettonMinter.spec.ts      # Minter contract tests
└── JettonWallet.spec.ts      # Wallet contract tests
```

## Getting Started

### Prerequisites

- Node.js 18+
- TON development environment

### Installation

```bash
npm install
```

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Deployment

```bash
npm run deploy
```

or

```bash
npm start
```

## Contract Details

### Jetton Minter

The main contract that:

- Manages total token supply
- Handles minting operations
- Provides wallet address discovery
- Manages admin functions
- Stores token metadata

### Jetton Wallet

Individual wallet contracts that:

- Store user token balances
- Handle token transfers
- Process burn operations
- Forward notifications

## Token Metadata

The Reza Token includes the following metadata:

- **Name**: Reza Token
- **Symbol**: REZA
- **Description**: Reza Token - A sample jetton implementation
- **Decimals**: 18

## Usage Examples

### Deploying the Token

```bash
npm run deploy
```

### Minting Tokens

```typescript
await jettonMinter.sendMint(deployer, {
    to: userAddress,
    jetton_amount: BigInt('1000000000000'), // 1000 RTZ tokens (with 9 decimals)
    forward_ton_amount: toNano('0.05'),
    total_ton_amount: toNano('0.1'),
});
```

### Transferring Tokens (with Sell Restrictions)

```typescript
// Small transfer (under $1 limit) - will succeed
await jettonWallet.sendTransfer(user, {
    value: toNano('0.1'),
    to: recipientAddress,
    jettonAmount: toNano('0.5'), // 0.5 TON worth
    fwdAmount: toNano('0.01'),
});

// Large transfer (over $1 limit) - will fail unless approved
await jettonWallet.sendTransfer(user, {
    value: toNano('0.1'),
    to: recipientAddress,
    jettonAmount: toNano('2'), // 2 TON worth - requires approval
    fwdAmount: toNano('0.01'),
});
```

### Approving Large Sells (Admin Only)

```typescript
// Admin approves a large sell for a specific user to a specific recipient
await jettonMinter.sendApproveSell(admin, {
    value: toNano('0.1'),
    walletOwner: userAddress,
    toAddress: recipientAddress,
    approvedAmount: toNano('5'), // Approve 5 TON worth of tokens
});
```

### Managing Sell Limits (Admin Only)

```typescript
// Change the sell limit (default is 1 TON ≈ $1)
await jettonMinter.sendChangeSellLimit(admin, {
    value: toNano('0.05'),
    sellLimit: toNano('2'), // New limit: 2 TON
});

// Get current sell limit
const sellLimit = await jettonMinter.getSellLimit();
```

## Security Features

- Owner verification for all operations
- Balance checks before transfers
- Gas consumption validation
- Workchain verification
- Proper error handling with specific error codes

## Gas Optimization

The contracts are optimized for minimal gas consumption:

- Efficient storage layout
- Optimized message handling
- MTestingernal calls
- Proper gas estimation

## Test Suite

The project includes comprehensive tests covering:

- Contract deployment
- Token minting and burning
- Token transfers
- Admin operations
- Error conditions
- Security validations

Run tests with:

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.
