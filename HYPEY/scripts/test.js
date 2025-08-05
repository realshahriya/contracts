const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🧪 HYPEY Token Testing Script\n");

  // Get contract addresses from environment
  const tokenAddress = process.env.TOKEN_ADDRESS;
  const treasuryAddress = process.env.TREASURY_ADDRESS;
  const vestingAddress = process.env.VESTING_ADDRESS;
  const multisigAddress = process.env.MULTISIG_ADDRESS;

  if (!tokenAddress || !treasuryAddress || !vestingAddress) {
    throw new Error("Missing contract addresses in .env file");
  }

  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const user1 = signers[1] || deployer; // Use deployer as fallback if no second signer
  const user2 = signers[2] || deployer; // Use deployer as fallback if no third signer
  
  console.log("👥 Test Accounts:");
  console.log(`   Deployer: ${deployer.address}`);
  if (signers.length > 1) {
    console.log(`   User1: ${user1.address}`);
    console.log(`   User2: ${user2.address}`);
  } else {
    console.log(`   ⚠️  Only one signer available (testnet mode)`);
  }
  console.log("");

  try {
    // Get contract instances
    const token = await ethers.getContractAt("HYPEYToken", tokenAddress);
    const treasury = await ethers.getContractAt("HYPEYTreasury", treasuryAddress);
    const vesting = await ethers.getContractAt("HypeyVesting", vestingAddress);

    console.log("🔍 Testing Basic Token Functions...");
    
    // Test token basic info
    const name = await token.name();
    const symbol = await token.symbol();
    const totalSupply = await token.totalSupply();
    
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} HYPEY`);

    // Test token transfer (small amount)
    console.log("\n💸 Testing Token Transfer...");
    const transferAmount = ethers.parseEther("1");
    
    // Check if deployer has tokens
    const deployerBalance = await token.balanceOf(deployer.address);
    console.log(`   Deployer balance: ${ethers.formatEther(deployerBalance)} HYPEY`);
    
    if (deployerBalance >= transferAmount) {
      const tx = await token.transfer(user1.address, transferAmount);
      await tx.wait();
      
      const user1Balance = await token.balanceOf(user1.address);
      console.log(`   ✅ Transferred 1 HYPEY to User1`);
      console.log(`   User1 balance: ${ethers.formatEther(user1Balance)} HYPEY`);
    } else {
      console.log("   ⚠️  Deployer has insufficient balance for transfer test");
    }

    // Test burn functionality
    console.log("\n🔥 Testing Burn Functionality...");
    const user1Balance = await token.balanceOf(user1.address);
    
    if (user1Balance > 0) {
      const burnAmount = user1Balance / 100n; // 1% of balance
      
      try {
        const burnTx = await token.connect(user1).burnForNFT(burnAmount);
        await burnTx.wait();
        
        const newBalance = await token.balanceOf(user1.address);
        console.log(`   ✅ Burned ${ethers.formatEther(burnAmount)} HYPEY`);
        console.log(`   User1 new balance: ${ethers.formatEther(newBalance)} HYPEY`);
      } catch (error) {
        console.log(`   ❌ Burn failed: ${error.reason || error.message}`);
      }
    } else {
      console.log("   ⚠️  User1 has no tokens to burn");
    }

    // Test treasury functions
    console.log("\n🏦 Testing Treasury Functions...");
    const treasuryBalance = await token.balanceOf(treasuryAddress);
    console.log(`   Treasury balance: ${ethers.formatEther(treasuryBalance)} HYPEY`);
    
    const treasuryPaused = await treasury.paused();
    console.log(`   Treasury status: ${treasuryPaused ? 'Paused' : 'Active'}`);

    // Test vesting functions
    console.log("\n⏳ Testing Vesting Functions...");
    const vestingBalance = await token.balanceOf(vestingAddress);
    console.log(`   Vesting balance: ${ethers.formatEther(vestingBalance)} HYPEY`);
    
    const vestingPaused = await vesting.paused();
    console.log(`   Vesting status: ${vestingPaused ? 'Paused' : 'Active'}`);

    // Test access control
    console.log("\n🔐 Testing Access Control...");
    const tokenOwner = await token.owner();
    console.log(`   Token owner: ${tokenOwner}`);
    
    const treasuryAdminRole = await treasury.MULTISIG_ADMIN_ROLE();
    const treasuryHasAdmin = await treasury.hasRole(treasuryAdminRole, multisigAddress);
    console.log(`   Treasury admin access: ${treasuryHasAdmin ? '✅' : '❌'}`);
    
    const vestingAdminRole = await vesting.MULTISIG_ADMIN_ROLE();
    const vestingHasAdmin = await vesting.hasRole(vestingAdminRole, multisigAddress);
    console.log(`   Vesting admin access: ${vestingHasAdmin ? '✅' : '❌'}`);

    console.log("\n🎉 Testing completed successfully!");
    
  } catch (error) {
    console.error("❌ Testing failed:", error.message);
    throw error;
  }
}

// Execute testing
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Testing script failed:", error);
      process.exit(1);
    });
}

module.exports = main;