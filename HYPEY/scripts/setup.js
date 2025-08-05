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
  const multisigAddress = await question('Enter the multisig/admin wallet address: ');
  
  // Get reserve burn address
  const reserveBurnAddress = await question('Enter the reserve burn address: ');
  
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
`;

  // Write to .env file
  fs.writeFileSync(envPath, newEnvContent);
  
  console.log('\n✅ Environment configuration saved to .env');
  console.log('\n📋 Next steps:');
  console.log('1. Make sure you have testnet ETH in your wallet');
  console.log('2. Run: npm run deploy:sepolia');
  console.log('3. Run: npm run verify:sepolia (after deployment)');
  console.log('\n🔒 Security reminder: Never commit your .env file to version control!');
  
  rl.close();
}

setupEnvironment().catch(console.error);