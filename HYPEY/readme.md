# HYPEY Smart Contract Testing Setup Guide

## Overview

This guide provides comprehensive instructions for testing the HYPEY ecosystem smart contracts using block explorer's read/write code functionality. The HYPEY ecosystem consists of three main contracts:

1. **HYPEYToken** - ERC20 token with dynamic burn mechanics and governance
2. **HYPEYTreasury** - Treasury management for token disbursements
3. **HypeyVesting** - Token vesting with cliff and linear release schedules
4. **MockTimelock** - Governance timelock controller for testing

## Contract Architecture

### HYPEYToken Features

- Initial supply: 3,000,000,000 HYPEY tokens
- Dynamic burn mechanics (1-3% configurable)
- Day/Night tax system (4% day, 16% night)
- Platform integration for burns
- NFT contract integration
- Role-based access control
- UUPS upgradeable

### HYPEYTreasury Features

- Multi-token support (up to 50 tokens)
- Daily withdrawal limits (500,000 tokens)
- Large withdrawal timelock (24 hours for >100,000 tokens)
- Emergency pause functionality
- Role-based disbursements

### HypeyVesting Features

- Multiple vesting schedules per beneficiary
- Cliff periods with percentage unlock
- Linear vesting with customizable slice periods
- Batch operations support
- Merkle proof verification
- Emergency admin controls

## Prerequisites

### Required Tools

1. Block explorer (Etherscan, Basescan, etc.)
2. Web3 wallet (MetaMask, WalletConnect)
3. Test tokens/ETH for gas fees
4. Contract addresses (deployed instances)

### Required Roles

- **DEFAULT_ADMIN_ROLE**: Full administrative access
- **MULTISIG_ADMIN_ROLE**: Multi-signature operations
- **PLATFORM_MANAGER_ROLE**: Platform integrations
- **BURNER_ROLE**: Token burning operations
- **UPGRADER_ROLE**: Contract upgrades

## Step-by-Step Testing Setup

### Phase 1: Contract Deployment and Initialization

#### Step 1.1: Deploy MockTimelock Contract

**Using Block Explorer Write Functions:**

1. Navigate to MockTimelock contract on block explorer
2. Connect your wallet
3. Go to "Write Contract" tab
4. Call `initialize` function:

   ```example
   minDelay: 3600 (1 hour in seconds)
   proposers: ["0xYourMultisigAddress"]
   executors: ["0xYourMultisigAddress"]
   admin: "0xYourAdminAddress"
   ```

**Verification Steps:**

- Read `timelockInitialized()` → should return `true`
- Read `getMinDelay()` → should return `3600`

#### Step 1.2: Deploy and Initialize HYPEYToken

**Write Functions Sequence:**

1. Call `initialize` function:

   ```example
   _reserveBurnAddress: "0xReserveBurnAddress"
   timelockAddress: "0xMockTimelockAddress"
   initialOwner: "0xYourOwnerAddress"
   ```

**Verification Steps:**

- Read `totalSupply()` → should return `3000000000000000000000000000` (3B tokens)
- Read `ownerInitialized()` → should return `true`
- Read `reserveBurnAddress()` → should return your reserve address
- Read `burnRateBasisPoints()` → should return `100` (1%)

#### Step 1.3: Deploy and Initialize HYPEYTreasury

**Write Functions Sequence:**

1. Call `initialize` function:

   ```example
   admin: "0xYourAdminAddress"
   timelockAddress: "0xMockTimelockAddress"
   ```

**Verification Steps:**

- Read `ownerInitialized()` → should return `true`
- Read `hasRole(MULTISIG_ADMIN_ROLE, yourAddress)` → should return `true`

#### Step 1.4: Deploy and Initialize HypeyVesting

**Write Functions Sequence:**

1. Call `initialize` function:

   ```example
   tokenAddress: "0xHYPEYTokenAddress"
   owner: "0xYourOwnerAddress"
   timelockAddress: "0xMockTimelockAddress"
   ```

**Verification Steps:**

- Read `token()` → should return HYPEY token address
- Read `ownerInitialized()` → should return `true`

### Phase 2: Token Distribution and Setup

#### Step 2.1: Distribute Initial Tokens

**From HYPEYToken Contract:**

1. Call `transfer` to distribute tokens:

   ```example
   recipient: "0xTreasuryAddress"
   amount: "1000000000000000000000000000" (1B tokens)
   ```

2. Call `transfer` to vesting contract:

   ```example
   recipient: "0xVestingAddress"
   amount: "500000000000000000000000000" (500M tokens)
   ```

**Verification Steps:**

- Read `balanceOf(treasuryAddress)` → should show 1B tokens
- Read `balanceOf(vestingAddress)` → should show 500M tokens

#### Step 2.2: Configure Treasury Supported Tokens

**From HYPEYTreasury Contract:**

1. Call `addSupportedToken`:

   ```example
   token: "0xHYPEYTokenAddress"
   ```

2. Call `addSupportedToken` for other tokens (USDC, USDT, etc.):

   ```example
   token: "0xUSDCAddress"
   ```

**Verification Steps:**

- Read `supportedTokens(tokenAddress)` → should return `true`
- Read `getSupportedTokens()` → should return array of supported tokens

### Phase 3: Vesting Setup and Testing

#### Step 3.1: Create Vesting Schedules

**From HypeyVesting Contract:**

1. Call `createVestingSchedule`:

   ```example
   beneficiary: "0xBeneficiaryAddress"
   totalAmount: "1000000000000000000000000" (1M tokens)
   start: 1704067200 (Unix timestamp - Jan 1, 2024)
   cliffDuration: 7776000 (90 days in seconds)
   duration: 31536000 (365 days in seconds)
   slicePeriodSeconds: 86400 (1 day)
   cliffUnlockPercent: 25 (25% unlock at cliff)
   ```

**Verification Steps:**

- Read `getVestingSchedulesCount(beneficiaryAddress)` → should return `1`
- Read `getVestingSchedule(beneficiaryAddress, 0)` → should return schedule details
- Read `computeReleasableAmount(beneficiaryAddress, 0)` → should return claimable amount

#### Step 3.2: Test Batch Vesting Creation

**For Multiple Beneficiaries:**

1. Call `createVestingScheduleBatch`:

   ```example
   beneficiaries: ["0xAddr1", "0xAddr2", "0xAddr3"]
   amounts: ["1000000000000000000000000", "2000000000000000000000000", "1500000000000000000000000"]
   starts: [1704067200, 1704067200, 1704067200]
   cliffDurations: [7776000, 15552000, 7776000]
   durations: [31536000, 31536000, 31536000]
   slicePeriodSeconds: [86400, 86400, 86400]
   cliffUnlockPercents: [25, 20, 30]
   ```

### Phase 4: Treasury Operations Testing

#### Step 4.1: Standard Token Disbursements

**From HYPEYTreasury Contract:**

1. Call `disburseToken` (for amounts < 100,000 tokens):

   ```example
   token: "0xHYPEYTokenAddress"
   to: "0xRecipientAddress"
   amount: "50000000000000000000000" (50K tokens)
   ```

**Verification Steps:**

- Read `getERC20Balance(tokenAddress)` → should show reduced balance
- Check recipient's token balance

#### Step 4.2: Large Withdrawal Requests

**For amounts ≥ 100,000 tokens:**

1. Call `requestLargeWithdrawal`:

   ```example
   token: "0xHYPEYTokenAddress"
   to: "0xRecipientAddress"
   amount: "200000000000000000000000" (200K tokens)
   ```

2. Wait 24 hours, then call `executeLargeWithdrawal`:

   ```example
   requestId: "0xGeneratedRequestId"
   ```

**Verification Steps:**

- Read `getPendingWithdrawal(requestId)` → should show request details
- After execution, check recipient balance

### Phase 5: Token Burn Mechanics Testing

#### Step 5.1: Standard Transfer Burns

**From HYPEYToken Contract:**

1. Call `transfer` (triggers automatic burn):

   ```example
   recipient: "0xRecipientAddress"
   amount: "1000000000000000000000" (1000 tokens)
   ```

**Expected Behavior:**

- 1% burn rate applied (10 tokens burned)
- 5 tokens burned immediately
- 5 tokens sent to reserve burn address
- 990 tokens received by recipient

**Verification Steps:**

- Read `totalSupply()` → should decrease by burn amount
- Read `balanceOf(reserveBurnAddress)` → should increase

#### Step 5.2: Platform Fee Burns

**Setup Platform Approval:**

1. Call `setPlatformApproved`:

   ```example
   platform: "0xPlatformAddress"
   approved: true
   ```

2. From platform address, call `burnPlatformFee`:

   ```example
   amount: "1000000000000000000000" (1000 tokens)
   basisPoints: 300 (3%)
   ```

#### Step 5.3: NFT Contract Burns

**Setup NFT Contract:**

1. Call `setNFTContractApproved`:

   ```example
   nftContract: "0xNFTContractAddress"
   approved: true
   ```

2. From NFT contract, call `burnForNFT`:

   ```example
   user: "0xUserAddress"
   amount: "100000000000000000000" (100 tokens)
   ```

### Phase 6: Governance and Admin Functions

#### Step 6.1: Parameter Updates via Timelock

**Burn Rate Changes:**

1. Call `proposeBurnRateChange`:

   ```example
   newRate: 200 (2%)
   ```

2. Wait for timelock delay, then call `executeBurnRateChange`:

   ```example
   newRate: 200
   ```

#### Step 6.2: Emergency Functions

**Emergency Pause:**

1. Call `setEmergencyPause`:

   ```example
   paused: true
   ```

**Verification:**

- Try `transfer` → should fail with "ContractPaused" error

### Phase 7: Vesting Claims Testing

#### Step 7.1: Time-based Claims

**After Cliff Period:**

1. From beneficiary address, call `claim`:

   ```example
   index: 0
   ```

**Verification Steps:**

- Read `computeReleasableAmount(beneficiaryAddress, 0)` before claim
- Execute claim
- Read beneficiary token balance
- Read `getVestingSchedule(beneficiaryAddress, 0)` → check released amount

#### Step 7.2: Batch Claims

1. Call `claimMultiple`:

   ```example
   indices: [0, 1, 2]
   ```

## Block Explorer Usage Guide

### Reading Contract State

#### Essential Read Functions

**HYPEYToken:**

- `totalSupply()` - Current token supply
- `balanceOf(address)` - Token balance of address
- `burnRateBasisPoints()` - Current burn rate
- `exemptFromBurn(address)` - Check if address is exempt
- `getCurrentTaxRate(sender, recipient)` - Get tax rate for transaction

**HYPEYTreasury:**

- `getERC20Balance(token)` - Token balance in treasury
- `getETHBalance()` - ETH balance in treasury
- `supportedTokens(token)` - Check if token is supported
- `getPendingWithdrawal(requestId)` - Get withdrawal request details

**HypeyVesting:**

- `getVestingSchedulesCount(beneficiary)` - Number of schedules
- `getVestingSchedule(beneficiary, index)` - Schedule details
- `computeReleasableAmount(beneficiary, index)` - Claimable tokens
- `getTotalLocked(beneficiary)` - Total locked tokens

### Writing to Contracts

#### Transaction Preparation

1. Connect wallet to block explorer
2. Ensure sufficient gas fees
3. Verify contract address
4. Check function parameters carefully

#### Gas Optimization Tips

- Use batch functions when available
- Combine multiple operations in single transaction
- Monitor gas prices for optimal timing

## Testing Scenarios

### Scenario 1: Complete Token Lifecycle

1. Deploy all contracts
2. Initialize with proper parameters
3. Distribute tokens to treasury and vesting
4. Create vesting schedules
5. Execute transfers (test burn mechanics)
6. Process treasury disbursements
7. Claim vested tokens
8. Test emergency functions

### Scenario 2: Governance Operations

1. Propose parameter changes via timelock
2. Wait for delay period
3. Execute approved changes
4. Verify new parameters active

### Scenario 3: Emergency Response

1. Trigger emergency pause
2. Verify all operations halted
3. Execute emergency admin functions
4. Resume normal operations

## Common Issues and Troubleshooting

### Transaction Failures

- **"UnauthorizedAccount"**: Check role assignments
- **"ContractPaused"**: Verify emergency pause status
- **"InsufficientBalance"**: Check token balances
- **"ExceedsMaxWithdrawal"**: Use large withdrawal process

### Parameter Validation

- Burn rates: 0-300 basis points (0-3%)
- Cliff percentages: 0-100%
- Timelock delays: Minimum 1 hour
- Vesting durations: Must exceed cliff periods

### Role Management

- Ensure proper role assignments before operations
- Use multisig for critical administrative functions
- Verify timelock integration for governance

## Security Considerations

### Best Practices

1. Always verify contract addresses
2. Use multisig for administrative operations
3. Test on testnet before mainnet
4. Monitor for unusual transaction patterns
5. Keep emergency pause capabilities ready

### Audit Checklist

- [ ] All contracts properly initialized
- [ ] Role assignments correct
- [ ] Burn mechanics functioning
- [ ] Vesting schedules accurate
- [ ] Treasury limits enforced
- [ ] Emergency functions operational
- [ ] Upgrade mechanisms secure

## Conclusion

This guide provides a comprehensive framework for testing the HYPEY smart contract ecosystem. Follow the sequential steps for proper setup and use the block explorer functions to verify each operation. Always test thoroughly on testnets before mainnet deployment.

For additional support or questions, refer to the contract documentation or contact the development team.

---

**Built by:** TOPAY DEV TEAM  
**Version:** 1.0  
**Last Updated:** January 2024
