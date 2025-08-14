# HYPEY Contracts Ownership Transfer Instructions

## 🎯 Objective

Transfer ownership of all HYPEY contracts to: `0xdA08165d65834bED3926BC2578cF468A114Af331`

## 📋 Current Status

### Current Contract Owners

- **HYPEYToken**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **HYPEYTreasury**: Uses role-based access control
- **HypeyVesting**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **MockTimelock**: Uses role-based access control

### Current Deployer

- **Deployer Wallet**: `0x8B8E5c6f04a2068933185affa042f47D3EB313c7`

## ⚠️ Issue Identified

The current deployer wallet (`0x8B8E5c6f04a2068933185affa042f47D3EB313c7`) is **NOT** the owner of the contracts. The actual owner is `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`.

## 🔧 Solutions

### Option 1: Use the Correct Private Key

1. **Find the private key** for address `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
2. **Update your .env file**:

   ```console
   PRIVATE_KEY=<private_key_for_0x70997970C51812dc3A010C7d01b50e0d17dc79C8>
   ```

3. **Run the transfer script**:

   ```bash
   npx hardhat run scripts/transfer-ownership.js --network arbitrumSepolia
   ```

### Option 2: Use Hardhat's Built-in Test Accounts

If you're using Hardhat's default test accounts, the private key for `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` is:

```console
59c6995e998f97a5a0044966f0945389dc9e86dae88c6a8412f4603b6b78690d
```

**Update your .env file**:

```console
PRIVATE_KEY=59c6995e998f97a5a0044966f0945389dc9e86dae88c6a8412f4603b6b78690d
```

### Option 3: Manual Transfer via Block Explorer

If you cannot access the private key, you can manually transfer ownership:

1. **Connect to Arbiscan** with the owner wallet
2. **Navigate to each contract** and call the transfer functions:
   - HYPEYToken: Call `transferOwnership(0xdA08165d65834bED3926BC2578cF468A114Af331)`
   - HypeyVesting: Call `transferOwnership(0xdA08165d65834bED3926BC2578cF468A114Af331)`
   - HYPEYTreasury: Grant roles to the new owner
   - MockTimelock: Manage roles through timelock governance

## 🚀 Recommended Steps

1. **Update .env file** with the correct private key:

   ```console
   PRIVATE_KEY=59c6995e998f97a5a0044966f0945389dc9e86dae88c6a8412f4603b6b78690d
   ```

2. **Run the ownership transfer script**:

   ```bash
   npx hardhat run scripts/transfer-ownership.js --network arbitrumSepolia
   ```

3. **Verify the transfers** on Arbiscan:
   - [HYPEYToken](https://sepolia.arbiscan.io/address/0xCb1aa302a42df12a717c9d3c5c626BED015D6411)
   - [HYPEYTreasury](https://sepolia.arbiscan.io/address/0xfa6b354e710B5a1Ed45c28491e164F2f81869FC2)
   - [HypeyVesting](https://sepolia.arbiscan.io/address/0x6FaE303669E60F5216aF1A05861f259DD1101A7b)
   - [MockTimelock](https://sepolia.arbiscan.io/address/0x420334D26d667C23eF3868E842a0d17774d3429A)

## 📝 Contract Addresses

| Contract | Address |
|----------|----------|
| HYPEYToken | `0xCb1aa302a42df12a717c9d3c5c626BED015D6411` |
| HYPEYTreasury | `0xfa6b354e710B5a1Ed45c28491e164F2f81869FC2` |
| HypeyVesting | `0x6FaE303669E60F5216aF1A05861f259DD1101A7b` |
| MockTimelock | `0x420334D26d667C23eF3868E842a0d17774d3429A` |

## ⚠️ Security Notes

- **Never share private keys** in public channels
- **Verify all transactions** before signing
- **Test on a small amount** first if possible
- **Keep backups** of important keys
- **Use hardware wallets** for mainnet operations

---
*Generated for HYPEY ownership transfer to: `0xdA08165d65834bED3926BC2578cF468A114Af331`*
