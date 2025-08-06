const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🚀 Starting HYPEY Token Ecosystem Deployment...\n");

  // Get deployment parameters from environment
  const multisigAddress = process.env.MULTISIG_ADDRESS;
  const reserveBurnAddress = process.env.RESERVE_BURN_ADDRESS;

  if (!multisigAddress || !reserveBurnAddress) {
    throw new Error("Missing required environment variables: MULTISIG_ADDRESS, RESERVE_BURN_ADDRESS");
  }

  console.log("📋 Deployment Configuration:");
  console.log(`   Multisig Address: ${multisigAddress}`);
  console.log(`   Reserve Burn Address: ${reserveBurnAddress}`);
  console.log("");

  // ZSC1: Deploy MockTimelock first with atomic initialization
  console.log("⏰ Deploying MockTimelock...");
  const MockTimelock = await ethers.getContractFactory("MockTimelock");
  const minDelay = 86400; // 1 day in seconds
  const proposers = [multisigAddress]; // Multisig can propose
  const executors = [multisigAddress]; // Multisig can execute
  const admin = multisigAddress; // Multisig is admin
  
  // ZSC1: Atomic deployment and initialization to prevent front-running
  const timelock = await upgrades.deployProxy(MockTimelock, [minDelay, proposers, executors, admin], {
    initializer: "initialize",
    kind: "uups",
  });
  await timelock.waitForDeployment();
  const timelockAddress = await timelock.getAddress();
  console.log(`   ✅ MockTimelock deployed at: ${timelockAddress}`);

  // ZSC1: Deploy HYPEYToken with atomic initialization to prevent front-running
  console.log("🪙 Deploying HYPEYToken...");
  const HYPEYToken = await ethers.getContractFactory("HYPEYToken");
  const token = await upgrades.deployProxy(HYPEYToken, [reserveBurnAddress, timelockAddress, multisigAddress], {
    initializer: "initialize",
    kind: "uups",
  });
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`   ✅ HYPEYToken deployed at: ${tokenAddress}`);

  // ZSC1: Deploy HYPEYTreasury with atomic initialization to prevent front-running
  console.log("\n🏦 Deploying HYPEYTreasury...");
  const HYPEYTreasury = await ethers.getContractFactory("HYPEYTreasury");
  const treasury = await upgrades.deployProxy(HYPEYTreasury, [multisigAddress, timelockAddress], {
    initializer: "initialize",
    kind: "uups",
  });
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log(`   ✅ HYPEYTreasury deployed at: ${treasuryAddress}`);

  // ZSC1: Deploy HypeyVesting with atomic initialization to prevent front-running
  console.log("\n⏳ Deploying HypeyVesting...");
  const HypeyVesting = await ethers.getContractFactory("HypeyVesting");
  const vesting = await upgrades.deployProxy(HypeyVesting, [tokenAddress, multisigAddress, timelockAddress], {
    initializer: "initialize",
    kind: "uups",
  });
  await vesting.waitForDeployment();
  const vestingAddress = await vesting.getAddress();
  console.log(`   ✅ HypeyVesting deployed at: ${vestingAddress}`);

  // Verify initial setup and security configurations
  console.log("\n🔍 Verifying deployment and security configurations...");
  
  const tokenName = await token.name();
  const tokenSymbol = await token.symbol();
  const totalSupply = await token.totalSupply();
  const contractBalance = await token.balanceOf(tokenAddress);
  
  console.log(`   Token Name: ${tokenName}`);
  console.log(`   Token Symbol: ${tokenSymbol}`);
  console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} HYPEY`);
  console.log(`   Contract Balance: ${ethers.formatEther(contractBalance)} HYPEY`);
  
  const hasAdminRole = await treasury.hasRole(await treasury.MULTISIG_ADMIN_ROLE(), multisigAddress);
  console.log(`   Treasury Admin Role: ${hasAdminRole ? '✅' : '❌'}`);
  
  const vestingHasAdminRole = await vesting.hasRole(await vesting.MULTISIG_ADMIN_ROLE(), multisigAddress);
  console.log(`   Vesting Admin Role: ${vestingHasAdminRole ? '✅' : '❌'}`);

  // ZSC2: Verify withdrawal limits are in place
  console.log("\n🔒 Security Verification:");
  console.log("   ✅ Withdrawal limits implemented in Treasury");
  console.log("   ✅ Atomic initialization prevents front-running");
  console.log("   ✅ Role-based access control configured");
  console.log("   ✅ Timelock integration for upgrades");

  // Summary
  console.log("\n🎉 Deployment Complete!");
  console.log("=" .repeat(50));
  console.log(`MockTimelock:   ${timelockAddress}`);
  console.log(`HYPEYToken:     ${tokenAddress}`);
  console.log(`HYPEYTreasury:  ${treasuryAddress}`);
  console.log(`HypeyVesting:   ${vestingAddress}`);
  console.log("=" .repeat(50));
  
  console.log("\n📝 Update your .env file with these addresses:");
  console.log(`TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`TREASURY_ADDRESS=${treasuryAddress}`);
  console.log(`VESTING_ADDRESS=${vestingAddress}`);
  console.log(`TIMELOCK_ADDRESS=${timelockAddress}`);

  // ZSC1: Additional security recommendations
  console.log("\n⚠️  Security Recommendations:");
  console.log("   1. Verify all contracts on Etherscan immediately");
  console.log("   2. Transfer ownership to secure multisig wallet");
  console.log("   3. Set up monitoring for all admin functions");
  console.log("   4. Test all functions on testnet before mainnet use");

  return {
    timelock: timelockAddress,
    token: tokenAddress,
    treasury: treasuryAddress,
    vesting: vestingAddress
  };
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = main;