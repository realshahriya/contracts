# RezaToken Contract Control Scripts

This directory contains comprehensive command-line tools for managing your deployed RezaToken contract. These scripts provide easy access to all contract functions without needing to remember complex commands.

## 📁 Available Scripts

### 1. `contract-control.cmd` - Full Interactive Menu

### Windows Command Prompt Interface

- Complete interactive menu system
- All contract operations available
- Network switching (testnet/mainnet)
- Built-in help and documentation
- Safety confirmations for critical operations

**Usage:**

```cmd
contract-control.cmd
```

### 2. `contract-control.ps1` - Advanced PowerShell Interface

### PowerShell Interface with Command-Line Options

- Interactive menu mode
- Command-line parameter support
- Colored output and better formatting
- Advanced error handling
- Health check functionality

**Usage:**

```powershell
# Interactive mode
.\contract-control.ps1

# Command-line mode
.\contract-control.ps1 -Action info -Testnet
.\contract-control.ps1 -Action mint -Network testnet
.\contract-control.ps1 -Help
```

### 3. `quick-control.cmd` - Fast Command Access

### Quick Command-Line Tool

- Fast access to common operations
- Simple command syntax
- No interactive menus
- Perfect for automation

**Usage:**

```cmd
quick-control.cmd info testnet
quick-control.cmd mint mainnet
quick-control.cmd deploy testnet
```

## 🎯 Available Operations

### 📋 Contract Information

- **Get All Data** - Complete contract state and information
- **Check State** - Quick contract status check
- **Token Info** - Detailed token information (name, symbol, supply, etc.)

### 🪙 Token Operations

- **Mint Tokens** - Create new tokens (owner only)
- **Enable/Disable Minting** - Control minting status
- **Burn Info** - Information about token burning process
- **Burn Tokens** - Burn tokens from wallet
- **Transfer Tokens** - Guide for token transfers via wallets
- **Update Content** - Update token metadata
- **Get Wallet Address** - Retrieve wallet addresses

### 👑 Owner Operations

- **Transfer Ownership** - Transfer contract ownership (irreversible!)
- **Transaction Limits** - Set/modify transaction limits
- **Address Exclusions** - Manage addresses excluded from limits

### 🏪 DEX Operations

- **Deploy DEX Pools** - Deploy DeDust and StonFi pool contracts
- **Test DEX Integration** - Verify DEX compatibility
- **Simulate Trading** - Run trading simulations
- **Simple DEX Test** - Quick compatibility check

### 🧪 Testing & Development

- **Run Tests** - Execute contract test suites
- **Build Contracts** - Compile all contracts
- **Setup Environment** - Configure development environment

### 🌐 Network Management

- **Switch Networks** - Toggle between testnet and mainnet
- **Network Status** - Check network connectivity
- **Health Check** - Verify project setup

## 🚀 Quick Start Guide

### First Time Setup

1. **Open Command Prompt or PowerShell** in the project directory
2. **Run the interactive menu:**

   ```cmd
   contract-control.cmd
   ```

3. **Choose option 16** to setup environment
4. **Choose option 15** to build contracts
5. **Your contract is ready for operations!**

### Common Operations

#### Deploy to Testnet

```cmd
# Using interactive menu
contract-control.cmd
# Choose option 10, then option 1 (testnet)

# Using quick command
quick-control.cmd deploy testnet

# Using PowerShell
.\contract-control.ps1 -Action deploy-dex -Testnet
```

#### Check Contract Information

```cmd
# Using interactive menu
contract-control.cmd
# Choose option 1

# Using quick command
quick-control.cmd info testnet

# Using PowerShell
.\contract-control.ps1 -Action info -Testnet
```

#### Mint Tokens (Owner Only)

```cmd
# Using interactive menu
contract-control.cmd
# Choose option 4

# Using quick command
quick-control.cmd mint testnet

# Using PowerShell
.\contract-control.ps1 -Action mint -Testnet
```

## ⚠️ Important Safety Notes

### 🔐 Owner-Only Operations

These operations require contract owner privileges:

- Minting tokens
- Transferring ownership
- Setting transaction limits
- Managing address exclusions

### 🌐 Network Considerations

- **Testnet**: Safe for testing, uses test TON
- **Mainnet**: Real operations, uses real TON
- Always verify network before critical operations

### 💰 Gas Fees

All operations require TON for gas fees:

- **Testnet**: Get free test TON from faucets
- **Mainnet**: Ensure sufficient TON balance
- Typical gas costs: 0.05-0.15 TON per operation

### 🔄 Irreversible Operations

These actions cannot be undone:

- Ownership transfers
- Token burning
- Mainnet deployments

## 🛠️ Troubleshooting

### Common Issues

#### "Command not found" Error

**Solution:** Ensure you're in the correct directory

```cmd
cd c:\Users\RealShahriya\Desktop\projects\contracts\rezatoken
```

#### "npx not found" Error

**Solution:** Install Node.js and npm

```cmd
# Check if Node.js is installed
node --version
npm --version

# If not installed, download from https://nodejs.org/
```

#### "Contract address not found" Error

**Solution:** Set up environment configuration

```cmd
# Run setup script
quick-control.cmd setup

# Or use interactive menu option 16
```

#### "Insufficient funds" Error

**Solution:** Add TON to your wallet

- **Testnet**: Use TON testnet faucet
- **Mainnet**: Purchase TON from exchanges

#### "Not owner" Error

**Solution:** Verify you're using the correct wallet

- Check your wallet address matches contract owner
- Ensure you're connected to the right network

### Getting Help

#### Built-in Help

```cmd
# Command help
quick-control.cmd help

# PowerShell help
.\contract-control.ps1 -Help

# Interactive menu always has option 25 for documentation
```

#### Log Files

Check these locations for detailed error information:

- Console output during operations
- Blueprint logs in `.blueprint/` directory
- Network logs for transaction details

## 📊 Script Comparison

| Feature | contract-control.cmd | contract-control.ps1 | quick-control.cmd |
|---------|---------------------|---------------------|-------------------|
| Interactive Menu | ✅ Full | ✅ Advanced | ❌ No |
| Command Line | ❌ No | ✅ Yes | ✅ Yes |
| Colored Output | ❌ No | ✅ Yes | ❌ No |
| Error Handling | ✅ Basic | ✅ Advanced | ✅ Basic |
| Help System | ✅ Built-in | ✅ Advanced | ✅ Simple |
| Network Switching | ✅ Yes | ✅ Yes | ✅ Yes |
| Safety Confirmations | ✅ Yes | ✅ Yes | ❌ No |
| Health Check | ❌ No | ✅ Yes | ❌ No |
| Best For | Beginners | Power Users | Automation |

## 🎯 Recommended Usage

### For Beginners

Start with `contract-control.cmd` for the full interactive experience with built-in guidance.

### For Power Users

Use `contract-control.ps1` for advanced features, better error handling, and command-line flexibility.

### For Automation

Use `quick-control.cmd` in scripts and automated workflows.

### For Development

Use any script, but `contract-control.ps1` provides the best development experience with health checks and detailed output.

## 📞 Support

### Documentation

- [Main README](./README.md) - Project overview
- [DEX Integration Guide](./DEX_INTEGRATION_GUIDE.md) - DEX setup
- [Testnet Deployment Plan](./TESTNET_DEPLOYMENT_PLAN.md) - Deployment guide

### Community

- **TON Developers**: Official TON development community
- **Blueprint Documentation**: <https://github.com/ton-org/blueprint>
- **Tact Language**: <https://tact-lang.org/>

### Issues

Report issues or request features in the project repository.

---

## 🎉 You're Ready

Your RezaToken contract now has comprehensive control tools. Choose the script that best fits your workflow and start managing your contract with confidence!

### Happy Coding! 🚀
