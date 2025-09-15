# CCLX Token Deployment Guide

## Overview

This document provides instructions for deploying the CCLX token ecosystem, which consists of the following contracts:

- **CCLXToken**: The main ERC20 token contract
- **CCLXTreasury**: Treasury contract for managing token funds
- **CCLXVesting**: Vesting contract for token distribution
- **CCLXBridge**: Bridge contract for cross-chain functionality

## Prerequisites

- Node.js and npm installed
- Hardhat development environment set up
- Private key or mnemonic for deployment
- Access to an Ethereum node (local or remote)

## Deployment Process

### 1. Environment Setup

Create a `.env` file in the project root with the following variables:

```env
PRIVATE_KEY=your_private_key_here
INFURA_API_KEY=your_infura_api_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### 2. Configure Network

Update the `hardhat.config.ts` file to include the desired network configuration:

```typescript
networks: {
  mainnet: {
    url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
    accounts: [process.env.PRIVATE_KEY],
  },
  goerli: {
    url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
    accounts: [process.env.PRIVATE_KEY],
  },
  // Add other networks as needed
}
```

### 3. Run Deployment Script

The deployment script (`scripts/deploy.ts`) handles the deployment of all contracts in the ecosystem. It includes robust error handling to manage potential issues during deployment.

```bash
# For local development network
npx hardhat run scripts/deploy.ts --network localhost

# For testnet deployment
npx hardhat run scripts/deploy.ts --network goerli

# For mainnet deployment
npx hardhat run scripts/deploy.ts --network mainnet
```

### 4. Deployment Flow

The script performs the following actions:

1. **Deploy CCLXToken**
   - Creates the main ERC20 token with governance capabilities
   - Sets up initial roles and permissions

2. **Deploy CCLXTreasury**
   - Creates the treasury contract linked to the token
   - Transfers initial funds to the treasury

3. **Deploy CCLXVesting**
   - Creates the vesting contract for token distribution
   - Sets up initial vesting schedules if tokens are available

4. **Deploy CCLXBridge**
   - Creates the bridge contract for cross-chain functionality
   - Sets up bridge roles and permissions

5. **Configure Roles and Permissions**
   - Sets up appropriate roles across contracts
   - Ensures proper access control

### 5. Error Handling

The deployment script includes comprehensive error handling to manage common issues:

- Contract initialization failures
- Insufficient token balances
- Permission/role assignment issues
- Failed transactions

All errors are logged with descriptive messages to help diagnose and resolve issues.

## Post-Deployment Verification

After deployment, verify that:

1. All contracts are deployed with the correct addresses
2. Token balances are distributed as expected
3. Roles and permissions are correctly assigned
4. Vesting schedules are properly configured
5. Bridge functionality is operational

## Contract Verification

Verify contract source code on Etherscan:

```bash
npx hardhat verify --network goerli <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

For contracts with complex constructor arguments, use the verification script:

```bash
npx hardhat run scripts/verify.ts --network goerli
```

## Troubleshooting

### Common Issues

1. **Initialization Errors**
   - Ensure contracts are not already initialized
   - Check constructor arguments

2. **Role Assignment Failures**
   - Verify deployer has admin rights
   - Check role constants match contract definitions

3. **Token Transfer Issues**
   - Ensure sufficient token balance
   - Check for transfer restrictions

4. **Gas Issues**
   - Increase gas limit for complex deployments
   - Consider deploying contracts separately

## Security Considerations

- Store private keys securely
- Use multisig wallets for production deployments
- Consider timelock mechanisms for critical functions
- Perform thorough testing before mainnet deployment

## Maintenance

After deployment, regular maintenance may include:

- Monitoring contract events
- Adjusting roles and permissions
- Managing vesting schedules
- Upgrading contracts (if using upgradeable patterns)

## Support

For deployment issues or questions, contact the development team or create an issue in the project repository.
