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

## Admin Setup and Role Management

### How to Set Up Administrators

#### Step 1: Initial Admin Assignment

During contract initialization, the deployer automatically receives the `DEFAULT_ADMIN_ROLE`. This role has the authority to grant and revoke all other roles.

**For HYPEYToken:**

```example
// During initialize() call, the initialOwner receives DEFAULT_ADMIN_ROLE
initialize(
  _reserveBurnAddress: "0xReserveBurnAddress",
  timelockAddress: "0xTimelockAddress", 
  initialOwner: "0xYourAdminAddress"  // This address gets DEFAULT_ADMIN_ROLE
)
```

**For HYPEYTreasury:**

```example
// During initialize() call, the admin receives MULTISIG_ADMIN_ROLE
initialize(
  admin: "0xYourAdminAddress",  // This address gets MULTISIG_ADMIN_ROLE
  timelockAddress: "0xTimelockAddress"
)
```

**For HypeyVesting:**

```example
// During initialize() call, the owner receives DEFAULT_ADMIN_ROLE
initialize(
  tokenAddress: "0xHYPEYTokenAddress",
  owner: "0xYourAdminAddress",  // This address gets DEFAULT_ADMIN_ROLE
  timelockAddress: "0xTimelockAddress"
)
```

#### Step 2: Grant Additional Roles

**Using Block Explorer Write Functions:**

1. **Grant MULTISIG_ADMIN_ROLE** (for multi-signature operations):

   ```example
   Function: grantRole
   role: 0x0000000000000000000000000000000000000000000000000000000000000001
   account: "0xMultisigWalletAddress"
   ```

2. **Grant PLATFORM_MANAGER_ROLE** (for platform integrations):

   ```example
   Function: grantRole
   role: 0x0000000000000000000000000000000000000000000000000000000000000002
   account: "0xPlatformManagerAddress"
   ```

3. **Grant BURNER_ROLE** (for token burning operations):

   ```example
   Function: grantRole
   role: 0x0000000000000000000000000000000000000000000000000000000000000003
   account: "0xBurnerAddress"
   ```

#### Step 3: Verify Role Assignments

**Read Functions to Verify:**

```example
// Check if address has specific role
hasRole(roleBytes32, accountAddress)

// Get role admin (who can grant/revoke this role)
getRoleAdmin(roleBytes32)

// Check role member count
getRoleMemberCount(roleBytes32)

// Get role member by index
getRoleMember(roleBytes32, index)
```

#### Step 4: Role Management Best Practices

1. **Use Multisig Wallets**: Always assign critical roles to multisig wallets
2. **Principle of Least Privilege**: Only grant necessary roles
3. **Regular Audits**: Periodically review role assignments
4. **Emergency Procedures**: Maintain emergency admin access
5. **Documentation**: Keep records of all role assignments

### Role Hierarchy and Permissions

| Role | Can Grant/Revoke | Permissions |
|------|------------------|-------------|
| DEFAULT_ADMIN_ROLE | All roles | Full contract control, upgrades via timelock |
| MULTISIG_ADMIN_ROLE | Lower roles only | Treasury operations, vesting management |
| PLATFORM_MANAGER_ROLE | None | Platform approvals, burn configurations |
| BURNER_ROLE | None | Token burning operations only |

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

1. Call `addVestingSchedule` (for single beneficiary):

   ```example
   beneficiary: "0xBeneficiaryAddress"
   totalAmount: "1000000000000000000000000" (1M tokens)
   start: 1704067200 (Unix timestamp - Jan 1, 2024)
   cliffDuration: 7776000 (90 days in seconds)
   duration: 31536000 (365 days in seconds)
   slicePeriodSeconds: 86400 (1 day)
   cliffUnlockPercent: 25 (25% unlock at cliff)
   ```

   **Note**: For multiple beneficiaries, use `addBatchVestingSchedules` instead (see Step 3.2).

**Verification Steps:**

- Read `vestingSchedules(beneficiaryAddress, 0)` → should return schedule details
- Read `getVestingInfo(beneficiaryAddress)` → should return array of schedules and releasable amounts
- Read `computeReleasableAmount(schedule)` → should return claimable amount for specific schedule

#### Step 3.2: Test Batch Vesting Creation

**For Multiple Beneficiaries:**

**IMPORTANT:** The `addBatchVestingSchedules` function uses a `VestingParams` struct array format. In Remix IDE, use this exact format:

1. Call `addBatchVestingSchedules` with the following parameter format:

   ```example
   schedules: [
     [
       "0xAddr1",
       "1000000000000000000000000",
       "1704067200",
       "7776000",
       "31536000",
       "86400",
       "25"
     ],
     [
       "0xAddr2",
       "2000000000000000000000000",
       "1704067200",
       "15552000",
       "31536000",
       "86400",
       "20"
     ],
     [
       "0xAddr3",
       "1500000000000000000000000",
       "1704067200",
       "7776000",
       "31536000",
       "86400",
       "30"
     ]
   ]
   ```

**Parameter Order for Each Array Element:**

1. `beneficiary` (address)
2. `totalAmount` (uint256)
3. `start` (uint256)
4. `cliffDuration` (uint256)
5. `duration` (uint256)
6. `slicePeriodSeconds` (uint256)
7. `cliffUnlockPercent` (uint256)

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
- Read `vestingSchedules(beneficiaryAddress, 0)` → check released amount

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

- `getVestingInfo(beneficiary)` - Returns arrays of schedules and releasable amounts
- `vestingSchedules(beneficiary, index)` - Individual schedule details
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

### Transaction Failures and Revert Conditions

#### HypeyVesting Contract Reverts

**Access Control Errors:**

- **`UnauthorizedInitializer()`**: Only the trusted initializer can call initialize()
- **`UpgradeOnlyViaTimelock()`**: Upgrades must be executed through the timelock contract
- **`UpgradeRequiresMultisigAdmin()`**: Upgrade caller must have MULTISIG_ADMIN_ROLE

**Parameter Validation Errors:**

- **`InvalidAddress()`**: Address cannot be zero address
- **`InvalidAmount()`**: Amount must be greater than zero
- **`InvalidDuration()`**: Duration and slice period must be greater than zero
- **`InvalidCliffPercent()`**: Cliff unlock percentage exceeds maximum allowed (100%)
- **`StartTimeInPast()`**: Vesting start time cannot be in the past
- **`StartTimeTooFarInFuture()`**: Start time cannot be more than 10 years in the future
- **`CliffExceedsDuration()`**: Cliff duration cannot exceed total vesting duration
- **`DurationTooLong()`**: Vesting duration cannot exceed 10 years
- **`SlicePeriodTooShort()`**: Slice period must be at least 1 day
- **`SlicePeriodExceedsDuration()`**: Slice period cannot exceed total duration
- **`ExcessiveAmount()`**: Vesting amount exceeds maximum token supply
- **`TimeOverflow()`**: Time calculation overflow detected

**Array and Batch Operation Errors:**

- **`EmptyArray()`**: Input arrays cannot be empty
- **`BatchSizeExceeded()`**: Batch size exceeds maximum allowed (50)
- **`ArrayLengthMismatch()`**: All input arrays must have the same length

**Vesting Operation Errors:**

- **`InvalidVestingIndex()`**: Vesting schedule index does not exist
- **`VestingNotInitialized()`**: Vesting schedule has not been properly initialized
- **`VestingAlreadyFinalized()`**: Cannot modify finalized vesting schedule
- **`VestingNotFinalized()`**: Operation requires vesting to be finalized first
- **`NoTokensAvailable()`**: No tokens available for release at this time
- **`TotalAllocationExceeded()`**: Total vesting allocation exceeds available balance

**Token Transfer Errors:**

- **`TransferFailed()`**: Token transfer operation failed
- **`InsufficientPoolBalance()`**: Contract has insufficient token balance

**Merkle Proof Errors:**

- **`MerkleRootNotSet()`**: Merkle root has not been configured
- **`InvalidMerkleProof()`**: Provided merkle proof is invalid

#### HYPEYTreasury Contract Reverts

**Access Control Errors:**

- **`UnauthorizedInitializer()`**: Only trusted initializer can initialize contract
- **`UpgradeOnlyViaTimelock()`**: Upgrades must go through timelock
- **`UpgradeRequiresMultisigAdmin()`**: Upgrade requires MULTISIG_ADMIN_ROLE

**Token Management Errors:**

- **`InvalidAddress()`**: Address cannot be zero
- **`TokenAlreadySupported()`**: Token is already in supported list
- **`TokenNotSupported()`**: Token is not in supported list
- **`MaxTokensReached()`**: Maximum supported tokens limit reached (50)

**Withdrawal Errors:**

- **`InvalidAmount()`**: Amount must be greater than zero
- **`InsufficientBalance()`**: Contract has insufficient balance
- **`ExceedsMaxWithdrawal()`**: Amount exceeds maximum withdrawal limit
- **`DailyLimitExceededError(token, attempted, limit, isETH)`**: Daily withdrawal limit exceeded
- **`WithdrawalRequestNotFound()`**: Withdrawal request ID not found
- **`WithdrawalRequestAlreadyExecuted()`**: Request has already been executed
- **`WithdrawalRequestTooEarly()`**: Must wait for timelock delay
- **`WithdrawalRequestExpired()`**: Request has expired (7 days after delay)
- **`TransferFailed()`**: Token or ETH transfer failed

#### HYPEYToken Contract Reverts

**Access Control Errors:**

- **`UnauthorizedInitializer()`**: Only trusted initializer can initialize
- **`UnauthorizedAccount(account, role)`**: Account lacks required role
- **`ContractPaused()`**: Contract is in emergency pause state

**Parameter Validation Errors:**

- **`InvalidAddress()`**: Address cannot be zero
- **`InvalidBurnRate()`**: Burn rate parameters invalid
- **`ExceedsMaxBurnRate()`**: Burn rate exceeds maximum allowed (3% or 300 basis points)
- **`SelfApprovalNotAllowed()`**: Cannot approve contract's own address

**Transfer and Balance Errors:**

- **`InsufficientBalance()`**: Account has insufficient token balance
- **`TransferFailed()`**: Token transfer operation failed

**Governance and Proposal Errors:**

- **`ProposalNotFound()`**: Proposal ID does not exist
- **`ProposalNotReady()`**: Proposal timelock period not yet elapsed
- **`ProposalExpired()`**: Proposal has expired (7 days after ready time)
- **`RateChangeTooFrequent()`**: Rate changes must wait minimum interval
- **`RateChangeExceedsLimit()`**: Rate change exceeds maximum allowed change

#### MockTimelock Contract Reverts

**Initialization Errors:**

- **`UnauthorizedInitializer()`**: Only trusted initializer can initialize
- **`InvalidDelay()`**: Delay must be between minimum and maximum bounds
- **`InvalidAddress()`**: Address cannot be zero
- **`AlreadyInitialized()`**: Contract has already been initialized
- **`EmptyProposersArray()`**: Must provide at least one proposer
- **`EmptyExecutorsArray()`**: Must provide at least one executor

**Upgrade Errors:**

- **`UnauthorizedUpgrade()`**: Only DEFAULT_ADMIN_ROLE can upgrade
- **`InvalidAddress()`**: New implementation address cannot be zero

### Troubleshooting Solutions

#### For Access Control Issues

1. **Check Role Assignment**: Use `hasRole(roleBytes32, account)` to verify permissions
2. **Grant Required Role**: Use `grantRole(role, account)` with admin account
3. **Verify Multisig**: Ensure multisig wallet has required signatures

#### For Parameter Validation Issues

1. **Validate Addresses**: Ensure all addresses are non-zero and valid
2. **Check Time Parameters**: Verify timestamps are reasonable and in correct order
3. **Validate Amounts**: Ensure amounts are within acceptable ranges
4. **Array Consistency**: Verify all arrays have matching lengths

#### For Batch Operation Issues

1. **Reduce Batch Size**: Keep batches under 50 items
2. **Check Array Lengths**: Ensure all parameter arrays have same length
3. **Validate Each Item**: Verify each item in batch meets individual requirements

#### For Token Balance Issues

1. **Check Contract Balance**: Verify contract has sufficient token balance
2. **Approve Transfers**: Ensure proper token approvals are in place
3. **Monitor Allocations**: Track total allocations vs available balance

#### For Vesting Function Call Errors

**Common `addBatchVestingSchedules` Issues:**

1. **Wrong Function Called**:
   - **Error**: `TypeError: invalid address (argument="address", value=[...], code=INVALID_ARGUMENT)`
   - **Cause**: Called `addVestingSchedule` (singular) instead of `addBatchVestingSchedules` (plural)
   - **Solution**: Use `addBatchVestingSchedules` function with struct array format

2. **Incorrect Parameter Format**:
   - **Error**: Parameter encoding errors in Remix IDE
   - **Cause**: Using object notation instead of array format
   - **Solution**: Use nested array format: `[["address","amount","start",...], [...]]`

3. **Parameter Validation Failures**:
   - **`StartTimeInPast()`**: Use future timestamps (e.g., `1767225600`)
   - **`SlicePeriodTooShort()`**: Use minimum 86400 seconds (1 day)
   - **`InsufficientTokensForAllocation()`**: Ensure contract has enough token balance
   - **`ExceedsMaxBurnRate()`**: Keep cliff unlock percentages ≤ 100%

4. **Array Length Issues**:
   - **`ArrayLengthMismatch()`**: All parameter arrays must have same length
   - **`BatchSizeExceeded()`**: Maximum 100 schedules per batch
   - **`EmptyArray()`**: Provide at least one vesting schedule

**Correct Parameter Format Example:**

```json
[
  ["0xBeneficiary1", "1000000000000000000000000", "1767225600", "7776000", "31536000", "86400", "25"],
  ["0xBeneficiary2", "2000000000000000000000000", "1767225600", "7776000", "31536000", "86400", "20"]
]
```

### Quick Diagnostic Steps

1. **Transaction Hash Analysis**: Check failed transaction on block explorer
2. **Error Message Lookup**: Match error to specific revert condition above
3. **Parameter Verification**: Validate all input parameters
4. **Role Check**: Verify caller has required permissions
5. **Contract State**: Check relevant contract state variables
6. **Gas Estimation**: Ensure sufficient gas for complex operations

### Emergency Procedures

1. **Emergency Pause**: Use emergency pause functions if available
2. **Admin Override**: Use admin functions to resolve critical issues
3. **Timelock Bypass**: For urgent fixes, use emergency timelock procedures
4. **Contact Support**: Escalate to development team for contract-level issues

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
