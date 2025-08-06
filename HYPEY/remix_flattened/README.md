# Remix-Compatible Contracts

This folder contains flattened, non-upgradeable versions of the HYPEY contracts for easy import into Remix. All OpenZeppelin imports are replaced with inline code, and upgradeable patterns are removed. Contracts included:

- MockTimelock.sol
- HYPEYToken.sol
- HYPEYTreasury.sol
- HypeyVesting.sol

Paste each file into Remix as needed.

## Deployment Guide (Remix)

### 1. MockTimelock.sol

- **Deploy:** Select `MockTimelock` and click "Deploy". No constructor arguments required.

### 2. HYPEYToken.sol

- **Deploy:** Select `HYPEYToken` and click "Deploy". No constructor arguments required.
- **Initialize:** After deployment, call the `initialize` function with:
  - `_reserveBurnAddress` (address)
  - `timelockAddress` (address)
  - `initialOwner` (address)
  Use the deployed addresses from previous steps as needed.

### 3. HYPEYTreasury.sol

- **Deploy:** Select `HYPEYTreasury` and click "Deploy". No constructor arguments required.
- **Initialize:** After deployment, call the `initialize` function with:
  - `tokenAddress` (address)
  - `timelockAddress` (address)
  - `initialOwner` (address)
  Use the deployed addresses from previous steps as needed.

### 4. HypeyVesting.sol

- **Deploy:** Select `HypeyVesting` and click "Deploy". No constructor arguments required.
- **Initialize:** After deployment, call the `initialize` function with:
  - `tokenAddress` (address)
  - `treasuryAddress` (address)
  - `timelockAddress` (address)
  - `initialOwner` (address)
  Use the deployed addresses from previous steps as needed.

## How to Add and Deploy in Remix

1. Open [Remix IDE](https://remix.ethereum.org/).
2. Create new files for each contract in the Remix file explorer and paste the contents from this folder.
3. Compile each contract using the Solidity compiler.
4. In the "Deploy & Run Transactions" plugin, select the contract and deploy as described above.
5. For contracts with `initialize` functions, after deployment, select the deployed contract instance and call `initialize` with the required arguments.
6. Use the deployed addresses as arguments for subsequent contracts as needed.

**Tip:** Always deploy in the order above to satisfy dependencies.
