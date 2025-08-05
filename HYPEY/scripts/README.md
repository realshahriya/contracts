# HYPEY Scripts

This directory contains utility scripts for deploying, managing, and testing the HYPEY token ecosystem.

## Available Scripts

### 1. deploy.js

Deploys all HYPEY contracts to the specified network.

```bash
npx hardhat run scripts/deploy.js --network sepolia
npx hardhat run scripts/deploy.js --network mainnet
```

**What it does:**

- Deploys MockTimelock contract
- Deploys HYPEYToken with upgradeable proxy
- Deploys HYPEYTreasury with upgradeable proxy
- Deploys HypeyVesting with upgradeable proxy
- Initializes all contracts with proper ownership
- Outputs contract addresses for .env file

### 2. setup.js

Configures the deployed contracts with initial settings.

```bash
npx hardhat run scripts/setup.js --network sepolia
```

**What it does:**

- Distributes initial token supply to treasury and vesting contracts
- Sets burn exemptions for system contracts
- Verifies the setup is correct

### 3. status.js

Displays comprehensive status of all deployed contracts.

```bash
npx hardhat run scripts/status.js --network sepolia
```

**What it shows:**

- Contract addresses and basic info
- Token supply and distribution
- Access control status
- Burn exemption settings
- Contract pause states
- Builder attribution

### 4. upgrade.js

Upgrades a specific contract to a new implementation.

```bash
npx hardhat run scripts/upgrade.js --network sepolia token
npx hardhat run scripts/upgrade.js --network sepolia treasury
npx hardhat run scripts/upgrade.js --network sepolia vesting
```

**What it does:**

- Deploys new implementation contract
- Upgrades the proxy to use new implementation
- Verifies the upgrade was successful

### 5. verify.js

Verifies all contracts on the block explorer.

```bash
npx hardhat run scripts/verify.js --network sepolia
npx hardhat run scripts/verify.js --network mainnet
```

**What it does:**

- Verifies HYPEYToken contract
- Verifies HYPEYTreasury contract
- Verifies HypeyVesting contract
- Verifies MockTimelock contract (if deployed)

### 6. test.js

Performs manual testing of contract functionality.

```bash
npx hardhat run scripts/test.js --network sepolia
```

**What it tests:**

- Basic token functions (name, symbol, supply)
- Token transfers and burns
- Treasury and vesting contract status
- Access control permissions

## Environment Setup

Make sure your `.env` file contains the required variables:

```env
# Network URLs
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
MAINNET_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID

# Private key for deployment
PRIVATE_KEY=your_private_key_here

# Contract addresses (filled after deployment)
MULTISIG_ADDRESS=0x...
RESERVE_BURN_ADDRESS=0x...
TOKEN_ADDRESS=0x...
TREASURY_ADDRESS=0x...
VESTING_ADDRESS=0x...
TIMELOCK_ADDRESS=0x...

# Optional: Etherscan API key for verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Deployment Workflow

1. **Deploy contracts:**

   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

2. **Update .env file** with the output addresses

3. **Setup contracts:**

   ```bash
   npx hardhat run scripts/setup.js --network sepolia
   ```

4. **Verify contracts:**

   ```bash
   npx hardhat run scripts/verify.js --network sepolia
   ```

5. **Check status:**

   ```bash
   npx hardhat run scripts/status.js --network sepolia
   ```

## Security Notes

- Always test on testnets before mainnet deployment
- Keep private keys secure and never commit them to version control
- Verify contract addresses before interacting with them
- Use multisig wallets for production deployments
- Test upgrade functionality thoroughly before production use

## Troubleshooting

- If deployment fails, check your network configuration and account balance
- If verification fails, ensure you have the correct Etherscan API key
- If upgrades fail, check that you have proper admin permissions
- Use the status script to debug configuration issues
