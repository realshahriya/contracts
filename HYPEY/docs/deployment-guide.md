# HYPEY Protocol Deployment Guide

This guide covers the complete deployment workflow for the HYPEY Protocol smart contracts.

## Overview

The HYPEY Protocol consists of three main contracts:

- **HYPEYToken**: ERC-20 token with advanced features
- **HYPEYTreasury**: Secure treasury management
- **HypeyVesting**: Token vesting and distribution

All contracts are upgradeable using OpenZeppelin's proxy pattern.

## Prerequisites

### 1. Environment Setup

```bash
# Run the setup script to initialize the project
npm run setup
```

This will:

- Create necessary directories
- Generate `.env.example` and `.env` files
- Update `.gitignore`
- Add npm scripts
- Check dependencies

### 2. Configuration

Edit your `.env` file with the required values:

```env
# Deployment Configuration
MULTISIG_ADDRESS=0x1234567890123456789012345678901234567890
RESERVE_BURN_ADDRESS=0x0000000000000000000000000000000000000000

# Network Configuration
INFURA_PROJECT_ID=your_infura_project_id_here
ALCHEMY_API_KEY=your_alchemy_api_key_here

# Verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here

# Private Keys (TESTNET ONLY)
PRIVATE_KEY=your_private_key_here
```

⚠️ **Security Warning**: Never commit private keys or `.env` files to version control.

## Deployment Workflow

### 1. Compile Contracts

```bash
npm run compile
```

### 2. Run Tests

```bash
# Basic tests
npm test

# With coverage
npm run test:coverage

# With gas reporting
npm run test:gas
```

### 3. Deploy Contracts

#### Local Development

```bash
# Start local node
npm run node

# Deploy to localhost (in another terminal)
npm run deploy:localhost
```

#### Testnet Deployment

```bash
# Deploy to Sepolia testnet
npm run deploy:sepolia
```

#### Mainnet Deployment

```bash
# Deploy to Ethereum mainnet
npm run deploy:mainnet
```

### 4. Verify Contracts

After deployment, verify contracts on Etherscan:

```bash
# Verify on respective network
npm run verify:sepolia
npm run verify:mainnet
```

### 5. Check Status

Verify deployment status and contract functionality:

```bash
# Check contract status
npm run status:sepolia
npm run status:mainnet
```

## Enhanced Scripts Overview

The HYPEY Protocol includes comprehensive enhanced deployment and management scripts that provide:

### Key Benefits

- **Reliability**: Automated validation and error handling
- **Security**: Built-in security checks and best practices
- **Maintainability**: Consistent deployment records and logging
- **Efficiency**: Streamlined workflows for all environments
- **Transparency**: Detailed status reporting and monitoring

### Available Scripts

### Deploy Script (`scripts/deploy.js`)

**Features:**

- Configuration validation
- Gas estimation and logging
- Deployer balance checks
- Standardized contract deployment
- Comprehensive error handling
- Deployment data persistence
- Post-deployment verification

**Output:**

- Deployment summary with addresses
- Gas usage information
- Next steps guidance
- Saves deployment data to `deployments/{network}.json`

### Verify Script (`scripts/verify.js`)

**Features:**

- Batch verification of all contracts
- Rate limiting to prevent API errors
- Already-verified contract detection
- Comprehensive verification summary
- Etherscan link generation

### Status Script (`scripts/status.js`)

**Features:**

- Network connectivity checks
- Contract existence verification
- Basic functionality testing
- Gas price monitoring
- Deployment status overview

### Upgrade Script (`scripts/upgrade.js`)

**Features:**

- Upgrade compatibility validation
- Gas estimation for upgrades
- Batch upgrade processing
- Post-upgrade verification
- Upgrade history tracking

### Setup Script (`scripts/setup.js`)

**Features:**

- Project initialization
- Environment file generation
- Directory structure creation
- Dependency checking
- npm scripts setup
- Documentation generation

## Deployment Data

Deployment information is saved to `deployments/{network}.json`:

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "network": "sepolia",
  "deployer": "0x...",
  "multisig": "0x...",
  "status": "SUCCESS",
  "contracts": {
    "token": {
      "proxy": "0x...",
      "implementation": "0x..."
    },
    "treasury": {
      "proxy": "0x...",
      "implementation": "0x..."
    },
    "vesting": {
      "proxy": "0x...",
      "implementation": "0x..."
    }
  },
  "verification": {
    "etherscan": true,
    "verified_at": "2024-01-01T00:05:00.000Z"
  }
}
```

## Contract Upgrades

### Upgrade Process

1. **Validate Compatibility**

   ```bash
   npm run upgrade:sepolia
   ```

   The script automatically validates upgrade compatibility before proceeding.

2. **Deploy New Implementation**
   New implementation contracts are deployed automatically.

3. **Upgrade Proxies**
   Proxy contracts are upgraded to point to new implementations.

4. **Verify Functionality**
   Post-upgrade functionality is verified automatically.

### Upgrade Safety

- All upgrades are validated for compatibility
- Storage layout conflicts are detected
- Function signature changes are checked
- Initialization requirements are verified

## Network Configuration

### Supported Networks

- **localhost**: Local development (Hardhat Network)
- **sepolia**: Ethereum testnet
- **mainnet**: Ethereum mainnet

### Adding New Networks

To add support for additional networks, update `hardhat.config.js`:

```javascript
networks: {
  polygon: {
    url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    accounts: [process.env.PRIVATE_KEY],
    gasPrice: 30000000000, // 30 gwei
  }
}
```

Then add corresponding npm scripts:

```json
{
  "deploy:polygon": "hardhat run scripts/deploy.js --network polygon",
  "verify:polygon": "hardhat run scripts/verify.js --network polygon",
  "status:polygon": "hardhat run scripts/status.js --network polygon"
}
```

## Security Best Practices

### Environment Security

1. **Never commit `.env` files**
2. **Use different keys for different networks**
3. **Rotate keys regularly**
4. **Use hardware wallets for mainnet**

### Deployment Security

1. **Test on testnet first**
2. **Verify all contracts**
3. **Use multi-signature wallets**
4. **Monitor gas prices**
5. **Double-check addresses**

### Upgrade Security

1. **Validate compatibility**
2. **Test upgrades on testnet**
3. **Use timelock for mainnet upgrades**
4. **Maintain upgrade documentation**

## Troubleshooting

### Common Issues

#### Deployment Fails

1. **Check network connectivity**

   ```bash
   npm run status
   ```

2. **Verify configuration**
   - Check `.env` file
   - Validate addresses
   - Confirm API keys

3. **Check deployer balance**
   - Ensure sufficient ETH for gas
   - Monitor gas prices

#### Verification Fails

1. **Check API key**
   - Verify Etherscan API key
   - Check rate limits

2. **Wait for propagation**
   - Allow time for contract propagation
   - Retry after a few minutes

#### Upgrade Issues

1. **Compatibility errors**
   - Review storage layout changes
   - Check function signature changes
   - Validate initialization requirements

2. **Permission errors**
   - Verify deployer permissions
   - Check proxy admin ownership

### Getting Help

1. **Check logs**
   - Review deployment logs
   - Check error messages

2. **Verify configuration**
   - Run status checks
   - Validate environment

3. **Test locally**
   - Deploy to localhost
   - Run comprehensive tests

## Maintenance

### Regular Tasks

1. **Monitor contract status**

   ```bash
   npm run status:mainnet
   ```

2. **Update dependencies**

   ```bash
   npm update
   npm audit
   ```

3. **Review deployment data**
   - Check `deployments/` directory
   - Verify contract addresses

4. **Test upgrade compatibility**

   ```bash
   npm run upgrade:sepolia
   ```

### Documentation Updates

- Keep deployment addresses current
- Document any configuration changes
- Update network-specific instructions
- Maintain upgrade history

## Conclusion

This enhanced deployment workflow provides:

- **Reliability**: Comprehensive validation and error handling
- **Security**: Best practices and safety checks
- **Maintainability**: Clear documentation and standardized processes
- **Efficiency**: Automated tasks and batch operations
- **Transparency**: Detailed logging and status reporting

For additional support or questions, refer to the project documentation or contact the development team.
