const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function flattenContract(contractPath, outputPath) {
  return new Promise((resolve, reject) => {
    const command = `npx hardhat flatten ${contractPath}`;
    
    console.log(`🔄 Flattening ${contractPath}...`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error flattening ${contractPath}:`, error);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.warn(`⚠️ Warning for ${contractPath}:`, stderr);
      }
      
      // Clean up the flattened output
      let cleanedOutput = stdout;
      
      // Remove duplicate SPDX license identifiers (keep only the first one)
      const spdxRegex = /\/\/ SPDX-License-Identifier: MIT\n/g;
      const spdxMatches = cleanedOutput.match(spdxRegex);
      if (spdxMatches && spdxMatches.length > 1) {
        // Replace all but the first occurrence
        let firstFound = false;
        cleanedOutput = cleanedOutput.replace(spdxRegex, (match) => {
          if (!firstFound) {
            firstFound = true;
            return match;
          }
          return '';
        });
      }
      
      // Remove duplicate pragma statements (keep only the first one)
      const pragmaRegex = /pragma solidity \^?[\d\.]+;\n/g;
      const pragmaMatches = cleanedOutput.match(pragmaRegex);
      if (pragmaMatches && pragmaMatches.length > 1) {
        let firstPragmaFound = false;
        cleanedOutput = cleanedOutput.replace(pragmaRegex, (match) => {
          if (!firstPragmaFound) {
            firstPragmaFound = true;
            return match;
          }
          return '';
        });
      }
      
      // Add header comment
      const header = `/**
 * HYPEY Token Ecosystem - Flattened Contract
 * Generated on: ${new Date().toISOString()}
 * Contract: ${path.basename(contractPath)}
 * 
 * This file contains all dependencies flattened into a single file
 * for easy verification on block explorers.
 * 
 * Original contract location: ${contractPath}
 */

`;
      
      cleanedOutput = header + cleanedOutput;
      
      // Write to output file
      fs.writeFileSync(outputPath, cleanedOutput);
      console.log(`✅ Flattened ${contractPath} -> ${outputPath}`);
      resolve();
    });
  });
}

async function main() {
  console.log("🚀 Starting HYPEY Contract Flattening Process...\n");
  
  // Create flattened directory if it doesn't exist
  const flattenedDir = path.join(__dirname, '..', 'flattened');
  if (!fs.existsSync(flattenedDir)) {
    fs.mkdirSync(flattenedDir, { recursive: true });
    console.log(`📁 Created directory: ${flattenedDir}`);
  }
  
  // Define contracts to flatten
  const contracts = [
    {
      name: 'HYPEYToken',
      path: 'contracts/token/HYPEYToken.sol',
      output: 'flattened/HYPEYToken_flattened.sol'
    },
    {
      name: 'HYPEYTreasury',
      path: 'contracts/treasury/HYPEYTreasury.sol',
      output: 'flattened/HYPEYTreasury_flattened.sol'
    },
    {
      name: 'HypeyVesting',
      path: 'contracts/vesting/HypeyVesting.sol',
      output: 'flattened/HypeyVesting_flattened.sol'
    },
    {
      name: 'MockTimelock',
      path: 'contracts/MockTimelock.sol',
      output: 'flattened/MockTimelock_flattened.sol'
    }
  ];
  
  console.log(`📋 Contracts to flatten: ${contracts.length}\n`);
  
  // Flatten each contract
  for (const contract of contracts) {
    try {
      const contractPath = path.join(__dirname, '..', contract.path);
      const outputPath = path.join(__dirname, '..', contract.output);
      
      // Check if source file exists
      if (!fs.existsSync(contractPath)) {
        console.warn(`⚠️ Source file not found: ${contractPath}`);
        continue;
      }
      
      await flattenContract(contractPath, outputPath);
    } catch (error) {
      console.error(`❌ Failed to flatten ${contract.name}:`, error.message);
    }
  }
  
  // Create a summary file
  const summaryPath = path.join(flattenedDir, 'README.md');
  const summaryContent = `# HYPEY Flattened Contracts

This directory contains flattened versions of all HYPEY smart contracts.

## Generated Files

${contracts.map(contract => `- **${contract.name}**: \`${contract.output}\``).join('\n')}

## Usage

These flattened files can be used for:

1. **Contract Verification**: Upload to block explorers like Etherscan/BaseScan
2. **Auditing**: Single file review for security audits
3. **Analysis**: Easier to analyze all dependencies in one place

## Generation Info

- **Generated on**: ${new Date().toISOString()}
- **Network**: Base Sepolia (Chain ID: 84532)
- **Compiler**: Solidity ^0.8.25

## Deployed Addresses (Base Sepolia)

- **HYPEYToken**: \`${process.env.TOKEN_ADDRESS || 'Not deployed'}\`
- **HYPEYTreasury**: \`${process.env.TREASURY_ADDRESS || 'Not deployed'}\`
- **HypeyVesting**: \`${process.env.VESTING_ADDRESS || 'Not deployed'}\`
- **MockTimelock**: \`${process.env.TIMELOCK_ADDRESS || 'Not deployed'}\`

## Verification Commands

To verify contracts on BaseScan, use these commands:

\`\`\`bash
# Verify HYPEYToken
npx hardhat verify --network baseSepolia ${process.env.TOKEN_ADDRESS || '<TOKEN_ADDRESS>'} "<constructor_args>"

# Verify HYPEYTreasury  
npx hardhat verify --network baseSepolia ${process.env.TREASURY_ADDRESS || '<TREASURY_ADDRESS>'} "<constructor_args>"

# Verify HypeyVesting
npx hardhat verify --network baseSepolia ${process.env.VESTING_ADDRESS || '<VESTING_ADDRESS>'} "<constructor_args>"

# Verify MockTimelock
npx hardhat verify --network baseSepolia ${process.env.TIMELOCK_ADDRESS || '<TIMELOCK_ADDRESS>'} "<constructor_args>"
\`\`\`

## Security Notes

⚠️ **Important**: These flattened files are for verification and analysis only. 
Always deploy from the original modular source files in the \`contracts/\` directory.
`;
  
  fs.writeFileSync(summaryPath, summaryContent);
  
  console.log("\n🎉 Flattening Process Complete!");
  console.log("=" .repeat(50));
  console.log(`📁 Flattened files location: ${flattenedDir}`);
  console.log(`📄 Summary file: ${summaryPath}`);
  console.log("=" .repeat(50));
  
  console.log("\n📝 Next Steps:");
  console.log("1. Review flattened files in the 'flattened' directory");
  console.log("2. Use flattened files for contract verification on BaseScan");
  console.log("3. Share flattened files with auditors if needed");
  console.log("4. Keep flattened files updated when contracts change");
}

// Execute the flattening process
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Flattening failed:", error);
      process.exit(1);
    });
}

module.exports = main;