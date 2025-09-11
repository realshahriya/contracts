# CCLX Token System

A comprehensive token system for CCLX, built with Solidity and Hardhat. This project includes an upgradeable ERC20 token, treasury management, vesting schedules, cross-chain bridging, and wrapped token functionality.

## Components

- **CCLXToken**: Main ERC20 token with role-based access control, pausable functionality, and burning restrictions.
- **Treasury**: Manages token holdings with secure deposit and withdrawal functions.
- **Vesting**: Implements token vesting schedules with configurable cliff and duration periods.
- **Bridge**: Facilitates cross-chain token transfers through a lock and unlock mechanism.
- **WrappedCCLX**: Wrapped version of the token for use on other chains.

## Features

- Upgradeable contracts using OpenZeppelin UUPS pattern
- Role-based access control for security
- Pausable token transfers for emergency situations
- Linear vesting with configurable parameters
- Cross-chain bridging capability
- Comprehensive test suite

## Installation

```bash
npm install
```

## Deployment

```bash
npx hardhat run scripts/deploy.ts --network <network_name>
```

## Verification

After deployment, update the contract addresses in `scripts/verify.ts` and run:

```bash
npx hardhat run scripts/verify.ts --network <network_name>
```

## Testing

```bash
npx hardhat test
```

## Security Considerations

- Use multi-signature wallets for admin roles in production
- Carefully manage role assignments
- Consider timelock mechanisms for sensitive operations
- Conduct thorough audits before mainnet deployment

## License

MIT
