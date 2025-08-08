# RezaToken (RTZ) - TON Jetton

A simple TON blockchain jetton implementation without any transfer restrictions.

## Features

### Core Jetton Features

- Standard TON jetton implementation
- Mintable by owner
- Maximum supply: 1,000,000 RTZ tokens
- 9 decimal places
- **Dynamic Transaction Limits**: Owner-controlled per-transaction limits

### Transaction Limit System

- **Daily Adjustable**: Owner can change transaction limits daily based on token demand
- **Market Responsive**: Increase limits during high demand, decrease during volatility
- **Address Exclusions**: Specific addresses can bypass all transaction limits
- **Real-time Enforcement**: Limits are validated at transfer time

### Address Exclusion System

- **DEX Integration**: Add DEX addresses for unlimited trading
- **Whale Management**: Exclude large holders for liquidity operations
- **Partnership Support**: Exclude partner wallets for business operations
- **Owner Control**: Only owner can add/remove excluded addresses
- **Permanent Owner**: Owner address is always excluded and cannot be removed

## 📁 Project Structure

- `contracts` - source code of all the smart contracts of the project and their dependencies.
- `wrappers` - wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]serialization primitives and compilation functions.
- `tests` - tests for the contracts.
- `scripts` - scripts used by the project, mainly the deployment scripts.

## Contract Structure

### State Variables

- `totalSupply`: Current token supply
- `owner`: Contract owner address
- `mintable`: Whether new tokens can be minted
- `max_supply`: Maximum token supply (1,000,000 RTZ)
- `transactionLimit`: Maximum tokens per transaction (dynamic)
- `excludedAddresses`: Map of addresses excluded from transaction limits

## Functions

### Owner Functions

- `Mint`: Mint new tokens (owner only)
- `ChangeOwner`: Transfer ownership
- `ChangeContent`: Update token metadata
- `SetTransactionLimit`: Set maximum tokens per transaction (daily adjustable)
- `AddExcludedAddress`: Add address to exclusion list (bypass limits)
- `RemoveExcludedAddress`: Remove address from exclusion list

### Standard Jetton Functions

- `TokenTransfer`: Transfer tokens between wallets
- `TokenBurn`: Burn tokens from wallet

### Getter Functions

- `get_jetton_data()`: Returns token metadata
- `get_wallet_address(owner_address)`: Get wallet address for owner
- `get_transaction_limit()`: Returns current transaction limit
- `is_excluded_address(address)`: Check if address is excluded from limits

## How It Works

This jetton contract implements dynamic transaction limits that can be adjusted by the owner based on market conditions and token demand. The system validates each transfer against the current limit while exempting the contract owner.

### Transaction Limit Management

```typescript
// Set transaction limit to 1,000 RTZ tokens
await token.send(provider.sender(), {
    value: toNano('0.05'),
}, {
    $$type: 'SetTransactionLimit',
    limit: toNano('1000') // 1,000 RTZ tokens
});

// Check current limit
const currentLimit = await token.getGetTransactionLimit();
console.log(`Current limit: ${Number(currentLimit) / 1e9} RTZ tokens`);
```

### Address Exclusion Management

```typescript
// Add DEX address to exclusion list
const dexAddress = Address.parse("EQBYTuYbLf8INxFtD8tQeNk5ZLy-nAX9ahQbG_yl1qQ-GEMS");
await token.send(provider.sender(), {
    value: toNano('0.05'),
}, {
    $$type: 'AddExcludedAddress',
    address: dexAddress
});

// Check if address is excluded
const isExcluded = await token.getIsExcludedAddress(dexAddress);
console.log(`DEX excluded: ${isExcluded}`);

// Remove address from exclusion list
await token.send(provider.sender(), {
    value: toNano('0.05'),
}, {
    $$type: 'RemoveExcludedAddress',
    address: dexAddress
});
```

### Use Cases

- **Market Volatility**: Reduce limits during high volatility to prevent large dumps
- **High Demand**: Increase limits during bull markets to allow larger transactions
- **Token Launch**: Start with conservative limits, gradually increase as market matures
- **Community Events**: Temporarily adjust limits for special occasions or airdrops
- **DEX Integration**: Exclude DEX router/pool addresses for unlimited trading
- **Whale Management**: Exclude large holders for liquidity operations
- **Partnership**: Exclude partner wallets for business operations
- **Treasury Operations**: Exclude treasury wallets for large fund movements

### For All Users

- **Limited transfers**: Transfers are subject to current transaction limits
- **Dynamic limits**: Transaction limits can change daily based on market conditions
- **Address exclusions**: Some addresses can bypass all transaction limits
- **Real-time validation**: Limits are checked during each transfer

### For Owner

- Can mint new tokens (up to max supply)
- Can transfer ownership
- Can update token metadata
- Can adjust transaction limits daily
- Can add/remove addresses from exclusion list
- Always excluded from transaction limits (cannot be removed)

## Usage Examples

### Deploy Contract

```bash
npx blueprint run deploytoken
```

### Mint Tokens

```bash
npx blueprint run mint
```

### Test Transaction Limits

```bash
npx blueprint run transaction-limits
```

**Address Exclusions Management:**

```bash
npx blueprint run address-exclusions
```

### Check Contract State

```bash
npx blueprint run check-contract-state
```

## Configuration

The contract is initialized with:

- Maximum supply: 1,000,000 RTZ tokens
- Owner: Deployer address
- Mintable: true
- No transfer restrictions

## Security Features

- Only owner can mint tokens
- Only owner can change ownership
- Only owner can update metadata
- Maximum supply limit prevents infinite minting

## 🛠️ Development Commands

### Build

```bash
npx blueprint build
```

### Test

```bash
npx blueprint test
```

### Deploy or run scripts

```bash
npx blueprint run
```

### Add a new contract

```bash
npx blueprint create ContractName
```

## 📊 Token Information

- **Name**: RezaToken
- **Symbol**: RTZ
- **Decimals**: 9
- **Total Supply**: 1,000,000 RTZ
- **Sell Limit**: $1 (configurable by owner)

## 🔧 Owner Functions

- `SetSellLimit`: Update the maximum sell amount
- `SetTokenPrice`: Update token price in USD (automatically adjusts sell limit)
- `ApproveSeller`: Approve addresses for unlimited selling
- `ApproveDexAddress`: Approve/unapprove DEX addresses for unlimited transactions
- `AddDexAddress`: Register DEX addresses for restriction enforcement
- `RemoveDexAddress`: Remove DEX addresses from registry
- Standard Jetton owner functions (mint, pause, etc.)

## 🌐 Network Support

- ✅ TON Testnet
- ✅ TON Mainnet
- ✅ Local TON development environment

## 📄 License

This project is licensed under the MIT License.
