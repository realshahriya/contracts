const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🚀 Final deployment attempt with proper initialization handling...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
  
  const multisigAddress = process.env.MULTISIG_ADDRESS;
  const reserveBurnAddress = process.env.RESERVE_BURN_ADDRESS || "0x000000000000000000000000000000000000dEaD";
  
  if (!multisigAddress) {
    throw new Error("MULTISIG_ADDRESS not set in .env file");
  }
  
  console.log("Target owner (multisig):", multisigAddress);
  console.log("Reserve burn address:", reserveBurnAddress);
  
  const deployedContracts = {};
  
  try {
    // Deploy MockTimelock first
    console.log("\n1️⃣ Deploying MockTimelock...");
    const MockTimelock = await ethers.getContractFactory("MockTimelock");
    const timelock = await MockTimelock.deploy();
    await timelock.waitForDeployment();
    deployedContracts.timelock = await timelock.getAddress();
    console.log("✅ MockTimelock deployed to:", deployedContracts.timelock);
    
    // Wait a bit for deployment to settle
    console.log("Waiting for deployment to settle...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Initialize MockTimelock (deployer is trustedInitializer)
    console.log("Initializing MockTimelock...");
    const minDelay = 86400; // 1 day
    const proposers = [multisigAddress];
    const executors = [multisigAddress];
    const admin = multisigAddress;
    
    const initTimelockTx = await timelock.initialize(minDelay, proposers, executors, admin);
    await initTimelockTx.wait();
    console.log("✅ MockTimelock initialized");
    
    // Deploy HYPEYToken
    console.log("\n2️⃣ Deploying HYPEYToken...");
    const HYPEYToken = await ethers.getContractFactory("HYPEYToken");
    const token = await HYPEYToken.deploy();
    await token.waitForDeployment();
    deployedContracts.token = await token.getAddress();
    console.log("✅ HYPEYToken deployed to:", deployedContracts.token);
    
    // Wait and initialize HYPEYToken
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("Initializing HYPEYToken...");
    const initTokenTx = await token.initialize(reserveBurnAddress, deployedContracts.timelock, multisigAddress);
    await initTokenTx.wait();
    console.log("✅ HYPEYToken initialized");
    
    // Deploy HYPEYTreasury
    console.log("\n3️⃣ Deploying HYPEYTreasury...");
    const HYPEYTreasury = await ethers.getContractFactory("HYPEYTreasury");
    const treasury = await HYPEYTreasury.deploy();
    await treasury.waitForDeployment();
    deployedContracts.treasury = await treasury.getAddress();
    console.log("✅ HYPEYTreasury deployed to:", deployedContracts.treasury);
    
    // Wait and initialize HYPEYTreasury
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("Initializing HYPEYTreasury...");
    const initTreasuryTx = await treasury.initialize(deployedContracts.token, multisigAddress);
    await initTreasuryTx.wait();
    console.log("✅ HYPEYTreasury initialized");
    
    // Deploy HypeyVesting
    console.log("\n4️⃣ Deploying HypeyVesting...");
    const HypeyVesting = await ethers.getContractFactory("HypeyVesting");
    const vesting = await HypeyVesting.deploy();
    await vesting.waitForDeployment();
    deployedContracts.vesting = await vesting.getAddress();
    console.log("✅ HypeyVesting deployed to:", deployedContracts.vesting);
    
    // Wait and initialize HypeyVesting
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("Initializing HypeyVesting...");
    const initVestingTx = await vesting.initialize(deployedContracts.token, multisigAddress, deployedContracts.timelock);
    await initVestingTx.wait();
    console.log("✅ HypeyVesting initialized");
    
    // Verify ownership
    console.log("\n📋 Verifying ownership...");
    
    const tokenOwner = await token.owner();
    console.log(`HYPEYToken owner: ${tokenOwner}`);
    const tokenOwnerCorrect = tokenOwner.toLowerCase() === multisigAddress.toLowerCase();
    console.log(`✅ Correct owner: ${tokenOwnerCorrect}`);
    
    const vestingOwner = await vesting.owner();
    console.log(`HypeyVesting owner: ${vestingOwner}`);
    const vestingOwnerCorrect = vestingOwner.toLowerCase() === multisigAddress.toLowerCase();
    console.log(`✅ Correct owner: ${vestingOwnerCorrect}`);
    
    const DEFAULT_ADMIN_ROLE = await treasury.DEFAULT_ADMIN_ROLE();
    const hasTreasuryAdmin = await treasury.hasRole(DEFAULT_ADMIN_ROLE, multisigAddress);
    console.log(`HYPEYTreasury admin role: ${hasTreasuryAdmin}`);
    
    const TIMELOCK_ADMIN_ROLE = await timelock.TIMELOCK_ADMIN_ROLE();
    const hasTimelockAdmin = await timelock.hasRole(TIMELOCK_ADMIN_ROLE, multisigAddress);
    console.log(`MockTimelock admin role: ${hasTimelockAdmin}`);
    
    // Check if all ownership transfers were successful
    const allOwnershipCorrect = tokenOwnerCorrect && vestingOwnerCorrect && hasTreasuryAdmin && hasTimelockAdmin;
    
    if (allOwnershipCorrect) {
      console.log("\n🎉 SUCCESS! All contracts are properly owned by the multisig address!");
      
      // Save deployment info
      const deploymentInfo = {
        network: "baseSepolia",
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        owner: multisigAddress,
        contracts: deployedContracts,
        type: "final-direct-deployment",
        ownershipVerified: true
      };
      
      const fs = require('fs');
      const path = require('path');
      const deploymentsDir = path.join(__dirname, '..', 'deployments');
      if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
      }
      
      const filename = `final-base-sepolia-${Date.now()}.json`;
      fs.writeFileSync(
        path.join(deploymentsDir, filename),
        JSON.stringify(deploymentInfo, null, 2)
      );
      
      console.log("📄 Deployment info saved to:", filename);
      console.log("\n📋 Final Contract Addresses:");
      console.log(`TOKEN_ADDRESS=${deployedContracts.token}`);
      console.log(`TREASURY_ADDRESS=${deployedContracts.treasury}`);
      console.log(`VESTING_ADDRESS=${deployedContracts.vesting}`);
      console.log(`TIMELOCK_ADDRESS=${deployedContracts.timelock}`);
      
      console.log("\n✅ MISSION ACCOMPLISHED! All contracts transferred to:", multisigAddress);
      
    } else {
      console.log("\n⚠️ WARNING: Some ownership transfers may not have completed successfully.");
      console.log("Please verify the ownership manually.");
    }
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    console.error("Full error:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });