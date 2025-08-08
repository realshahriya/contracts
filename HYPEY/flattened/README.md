# HYPEY Flattened Contracts

This directory contains flattened versions of all HYPEY smart contracts.

## Generated Files

- **HYPEYToken**: `flattened/HYPEYToken_flattened.sol`
- **HYPEYTreasury**: `flattened/HYPEYTreasury_flattened.sol`
- **HypeyVesting**: `flattened/HypeyVesting_flattened.sol`
- **MockTimelock**: `flattened/MockTimelock_flattened.sol`

## Usage

These flattened files can be used for:

1. **Contract Verification**: Upload to block explorers like Etherscan/BaseScan
2. **Auditing**: Single file review for security audits
3. **Analysis**: Easier to analyze all dependencies in one place

## Generation Info

- **Generated on**: 2025-08-08T18:34:13.764Z
- **Network**: Base Sepolia (Chain ID: 84532)
- **Compiler**: Solidity ^0.8.25

## Deployed Addresses (Base Sepolia)

- **HYPEYToken**: `Not deployed`
- **HYPEYTreasury**: `Not deployed`
- **HypeyVesting**: `Not deployed`
- **MockTimelock**: `Not deployed`

## Verification Commands

To verify contracts on BaseScan, use these commands:

```bash
# Verify HYPEYToken
npx hardhat verify --network baseSepolia <TOKEN_ADDRESS> "<constructor_args>"

# Verify HYPEYTreasury  
npx hardhat verify --network baseSepolia <TREASURY_ADDRESS> "<constructor_args>"

# Verify HypeyVesting
npx hardhat verify --network baseSepolia <VESTING_ADDRESS> "<constructor_args>"

# Verify MockTimelock
npx hardhat verify --network baseSepolia <TIMELOCK_ADDRESS> "<constructor_args>"
```

## Security Notes

⚠️ **Important**: These flattened files are for verification and analysis only. 
Always deploy from the original modular source files in the `contracts/` directory.
