const { run } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🔍 Verifying HYPEY Contracts on Block Explorer\n");

  // Get contract addresses from environment
  const tokenAddress = process.env.TOKEN_ADDRESS;
  const treasuryAddress = process.env.TREASURY_ADDRESS;
  const vestingAddress = process.env.VESTING_ADDRESS;
  const timelockAddress = process.env.TIMELOCK_ADDRESS;
  const multisigAddress = process.env.MULTISIG_ADDRESS;
  const reserveBurnAddress = process.env.RESERVE_BURN_ADDRESS;

  if (!tokenAddress || !treasuryAddress || !vestingAddress) {
    throw new Error("Missing contract addresses in .env file");
  }

  console.log("📋 Contracts to verify:");
  console.log(`   Token: ${tokenAddress}`);
  console.log(`   Treasury: ${treasuryAddress}`);
  console.log(`   Vesting: ${vestingAddress}`);
  if (timelockAddress) console.log(`   Timelock: ${timelockAddress}`);
  console.log("");

  try {
    // Verify HYPEYToken
    console.log("🪙 Verifying HYPEYToken...");
    await run("verify:verify", {
      address: tokenAddress,
      constructorArguments: [],
    });
    console.log("   ✅ HYPEYToken verified");

    // Verify HYPEYTreasury
    console.log("\n🏦 Verifying HYPEYTreasury...");
    await run("verify:verify", {
      address: treasuryAddress,
      constructorArguments: [],
    });
    console.log("   ✅ HYPEYTreasury verified");

    // Verify HypeyVesting
    console.log("\n⏳ Verifying HypeyVesting...");
    await run("verify:verify", {
      address: vestingAddress,
      constructorArguments: [],
    });
    console.log("   ✅ HypeyVesting verified");

    // Verify MockTimelock if address is provided
    if (timelockAddress) {
      console.log("\n⏰ Verifying MockTimelock...");
      await run("verify:verify", {
        address: timelockAddress,
        constructorArguments: [],
      });
      console.log("   ✅ MockTimelock verified");
    }

    console.log("\n🎉 All contracts verified successfully!");
    
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("   ℹ️  Contract already verified");
    } else {
      console.error("❌ Verification failed:", error.message);
      throw error;
    }
  }
}

// Execute verification
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Verification script failed:", error);
      process.exit(1);
    });
}

module.exports = main;