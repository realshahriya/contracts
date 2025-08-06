#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnvironment() {
  console.log('🚀 HYPEY Contract Deployment Setup\n');
  console.log('🔍 This setup includes audit compliance features:');
  console.log('   ✅ VSC5: Dusting attack protection');
  console.log('   ✅ XSC3-5: Enhanced validation and events');
  console.log('   ✅ ZSC1: Front-running protection');
  console.log('   ✅ ZSC2: Withdrawal limits');
  console.log('   ✅ ZSC3-4: Token list management');
  console.log('   ✅ ZSC7: Consistent error handling\n');
  
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  console.log('Please provide the following information for testnet deployment:\n');
  
  // Get Infura/Alchemy URL
  const sepoliaUrl = await question('Enter your Sepolia RPC URL (e.g., Infura/Alchemy): ');
  
  // Get private key
  console.log('\n⚠️  IMPORTANT: Never share your private key. This will be stored locally in .env');
  const privateKey = await question('Enter your wallet private key (without 0x prefix): ');
  
  // Get Etherscan API key
  const etherscanKey = await question('Enter your Etherscan API key (for contract verification): ');
  
  // Get multisig address
  console.log('\n🔐 SECURITY: Use a multisig wallet for admin functions');
  const multisigAddress = await question('Enter the multisig/admin wallet address: ');
  
  // Get reserve burn address
  const reserveBurnAddress = await question('Enter the reserve burn address: ');
  
  // Security recommendations
  console.log('\n🛡️  SECURITY RECOMMENDATIONS:');
  console.log('1. Use a hardware wallet or multisig for the admin address');
  console.log('2. Implement timelock for critical operations');
  console.log('3. Set up monitoring for large transactions');
  console.log('4. Regular security audits and code reviews');
  console.log('5. Emergency pause mechanisms are in place');
  
  // Create .env content
  const newEnvContent = `# Network Configuration
SEPOLIA_URL=${sepoliaUrl}
MAINNET_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID

# Private Key (DO NOT COMMIT TO GIT - ADD .env TO .gitignore)
PRIVATE_KEY=${privateKey}

# Etherscan API Key for contract verification
ETHERSCAN_API_KEY=${etherscanKey}

# Deployment Configuration
MULTISIG_ADDRESS=${multisigAddress}
RESERVE_BURN_ADDRESS=${reserveBurnAddress}

# Deployed Contract Addresses (will be populated after deployment)
TOKEN_ADDRESS=
TREASURY_ADDRESS=
VESTING_ADDRESS=
TIMELOCK_ADDRESS=

# Gas Configuration
REPORT_GAS=true

# Audit Compliance Features
# VSC5: Dusting attack protection with percentage-based exemption
# XSC3: Enhanced input validation for all functions
# XSC4: Event emission for critical actions
# XSC5: Standardized error messages
# ZSC1: Front-running protection in deployment
# ZSC2: Withdrawal limits (1M tokens max per transaction)
# ZSC3: Bounded supported token list
# ZSC4: Proper token removal from arrays
# ZSC7: Consistent error handling approach

# Security Settings
MAX_WITHDRAWAL_LIMIT=1000000
BURN_EXEMPTION_PERCENTAGE=0.1
`;

  // Write to .env file
  fs.writeFileSync(envPath, newEnvContent);
  
  console.log('\n✅ Environment configuration saved to .env');
  console.log('\n📋 Next steps:');
  console.log('1. Make sure you have testnet ETH in your wallet');
  console.log('2. Run: npm run deploy:sepolia');
  console.log('3. Run: npm run verify:sepolia (after deployment)');
  console.log('4. Run: npm run test:scripts (to verify audit compliance)');
  console.log('\n🔒 Security reminder: Never commit your .env file to version control!');
  console.log('🔍 Audit compliance: All identified issues have been addressed');
  
  rl.close();
}

setupEnvironment().catch(console.error);