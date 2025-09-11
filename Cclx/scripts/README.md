# CCLX Deployment Scripts

This directory contains scripts for deploying the CCLX contracts.

## Deployment Order

The contracts are deployed in the following order:

1. **CCLXToken** - ERC20 token with UUPS upgradeability
2. **CCLXTreasury** - Treasury contract for managing funds
3. **CCLXVesting** - Vesting contract for token distribution
4. **CCLXBridge** - Bridge contract for cross-chain transfers

## How to Deploy

To deploy the contracts, run:

```bash
npx hardhat run scripts/deploy.ts --network <network-name>
```

Where `<network-name>` is the name of the network you want to deploy to (e.g., `localhost`, `goerli`, `mainnet`).

## Deployment Process

The deployment script performs the following actions:

1. Deploys CCLXToken with name "CCLX Token" and symbol "CCLX"
2. Deploys CCLXTreasury and funds it with 10 million tokens
3. Deploys CCLXVesting, funds it with 20 million tokens, and creates an example vesting schedule
4. Deploys CCLXBridge with a 0.5% fee that goes to the Treasury
5. Sets up roles for the deployer account
6. Prints a deployment summary with all contract addresses

## Configuration

You can modify the deployment parameters in the `deploy.ts` script:

- Token name and symbol
- Treasury funding amount
- Vesting schedule parameters
- Bridge fee percentage
- Role assignments
