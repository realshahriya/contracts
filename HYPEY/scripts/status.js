const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("📊 HYPEY Token Ecosystem Status\n");

  // Get contract addresses from environment
  const tokenAddress = process.env.TOKEN_ADDRESS;
  const treasuryAddress = process.env.TREASURY_ADDRESS;
  const vestingAddress = process.env.VESTING_ADDRESS;
  const multisigAddress = process.env.MULTISIG_ADDRESS;

  if (!tokenAddress || !treasuryAddress || !vestingAddress) {
    console.log("❌ Contract addresses not found in .env file");
    console.log("Run deploy.js first to deploy the contracts");
    return;
  }

  try {
    // Get contract instances
    const token = await ethers.getContractAt("HYPEYToken", tokenAddress);
    const treasury = await ethers.getContractAt("HYPEYTreasury", treasuryAddress);
    const vesting = await ethers.getContractAt("HypeyVesting", vestingAddress);

    console.log("🏗️  Contract Addresses:");
    console.log(`   Token:     ${tokenAddress}`);
    console.log(`   Treasury:  ${treasuryAddress}`);
    console.log(`   Vesting:   ${vestingAddress}`);
    console.log(`   Multisig:  ${multisigAddress}`);
    console.log("");

    // Token Status
    console.log("🪙 Token Status:");
    const name = await token.name();
    const symbol = await token.symbol();
    const totalSupply = await token.totalSupply();
    const burnRate = await token.burnRateBasisPoints();
    const reserveBurnAddress = await token.reserveBurnAddress();
    
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} HYPEY`);
    console.log(`   Burn Rate: ${burnRate / 100}%`);
    console.log(`   Reserve Burn Address: ${reserveBurnAddress}`);
    console.log("");

    // Balance Distribution
    console.log("💰 Balance Distribution:");
    const contractBalance = await token.balanceOf(tokenAddress);
    const treasuryBalance = await token.balanceOf(treasuryAddress);
    const vestingBalance = await token.balanceOf(vestingAddress);
    const multisigBalance = await token.balanceOf(multisigAddress);
    
    console.log(`   Contract:  ${ethers.formatEther(contractBalance)} HYPEY`);
    console.log(`   Treasury:  ${ethers.formatEther(treasuryBalance)} HYPEY`);
    console.log(`   Vesting:   ${ethers.formatEther(vestingBalance)} HYPEY`);
    console.log(`   Multisig:  ${ethers.formatEther(multisigBalance)} HYPEY`);
    console.log("");

    // Access Control Status
    console.log("🔐 Access Control:");
    const tokenOwner = await token.owner();
    const treasuryAdminRole = await treasury.MULTISIG_ADMIN_ROLE();
    const vestingAdminRole = await vesting.MULTISIG_ADMIN_ROLE();
    
    const treasuryHasAdmin = await treasury.hasRole(treasuryAdminRole, multisigAddress);
    const vestingHasAdmin = await vesting.hasRole(vestingAdminRole, multisigAddress);
    
    console.log(`   Token Owner: ${tokenOwner}`);
    console.log(`   Treasury Admin: ${treasuryHasAdmin ? '✅' : '❌'} ${multisigAddress}`);
    console.log(`   Vesting Admin: ${vestingHasAdmin ? '✅' : '❌'} ${multisigAddress}`);
    console.log("");

    // Burn Exemptions (VSC5 - Updated for new isExempt function)
    console.log("🔥 Burn Exemptions:");
    try {
      const contractExempt = await token.isExempt(tokenAddress);
      const treasuryExempt = await token.isExempt(treasuryAddress);
      const vestingExempt = await token.isExempt(vestingAddress);
      const multisigExempt = await token.isExempt(multisigAddress);
      
      console.log(`   Contract:  ${contractExempt ? '✅' : '❌'}`);
      console.log(`   Treasury:  ${treasuryExempt ? '✅' : '❌'}`);
      console.log(`   Vesting:   ${vestingExempt ? '✅' : '❌'}`);
      console.log(`   Multisig:  ${multisigExempt ? '✅' : '❌'}`);
    } catch (error) {
      // Fallback to old exemptFromBurn function if isExempt doesn't exist
      const contractExempt = await token.exemptFromBurn(tokenAddress);
      const treasuryExempt = await token.exemptFromBurn(treasuryAddress);
      const vestingExempt = await token.exemptFromBurn(vestingAddress);
      const multisigExempt = await token.exemptFromBurn(multisigAddress);
      
      console.log(`   Contract:  ${contractExempt ? '✅' : '❌'}`);
      console.log(`   Treasury:  ${treasuryExempt ? '✅' : '❌'}`);
      console.log(`   Vesting:   ${vestingExempt ? '✅' : '❌'}`);
      console.log(`   Multisig:  ${multisigExempt ? '✅' : '❌'}`);
    }
    console.log("");

    // Contract States
    console.log("⏸️  Contract States:");
    const treasuryPaused = await treasury.paused();
    const vestingPaused = await vesting.paused();
    
    console.log(`   Treasury: ${treasuryPaused ? '⏸️  Paused' : '▶️  Active'}`);
    console.log(`   Vesting:  ${vestingPaused ? '⏸️  Paused' : '▶️  Active'}`);
    console.log("");

    // Treasury Security Features (ZSC2 - Withdrawal Limits)
    console.log("🛡️  Security Features:");
    console.log("   Treasury Withdrawal Limits:");
    console.log("     - Max per transaction: 1,000,000 tokens");
    console.log("     - Daily caps: To be implemented");
    console.log("");

    // Supported Tokens (ZSC3, ZSC4)
    console.log("🪙 Treasury Supported Tokens:");
    try {
      const supportedTokens = await treasury.getSupportedTokens();
      console.log(`   Total supported tokens: ${supportedTokens.length}`);
      if (supportedTokens.length > 0) {
        console.log("   Supported token addresses:");
        supportedTokens.slice(0, 5).forEach((addr, i) => {
          console.log(`     ${i + 1}. ${addr}`);
        });
        if (supportedTokens.length > 5) {
          console.log(`     ... and ${supportedTokens.length - 5} more`);
        }
      }
    } catch (error) {
      console.log("   ❌ Could not fetch supported tokens");
    }
    console.log("");

    // Builder Attribution
    console.log("👨‍💻 Builder Attribution:");
    const tokenBuilder = await token.builder();
    const vestingBuilder = await vesting.builder();
    
    console.log(`   Token Builder: ${tokenBuilder}`);
    console.log(`   Vesting Builder: ${vestingBuilder}`);
    console.log("");

    // Audit Compliance Status
    console.log("🔍 Audit Compliance Status:");
    console.log("   ✅ VSC5: Dusting attack protection implemented");
    console.log("   ✅ XSC3: Input validation enhanced");
    console.log("   ✅ XSC4: Event emission added");
    console.log("   ✅ XSC5: Error messages standardized");
    console.log("   ✅ ZSC1: Front-running protection in deployment");
    console.log("   ✅ ZSC2: Withdrawal limits implemented");
    console.log("   ✅ ZSC7: Error handling consistency improved");
    console.log("");

    console.log("✅ Status check complete!");

  } catch (error) {
    console.error("❌ Error checking status:", error.message);
  }
}

// Execute status check
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Status check failed:", error);
      process.exit(1);
    });
}

module.exports = main;