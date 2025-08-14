const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🚀 Deploying fresh HYPEY contracts with correct ownership...");
  
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
    const minDelay = 86400; // 1 day
    const proposers = [multisigAddress];
    const executors = [multisigAddress];
    const admin = multisigAddress;
    
    const timelock = await upgrades.deployProxy(
      MockTimelock,
      [minDelay, proposers, executors, admin],
      { initializer: "initialize" }
    );
    await timelock.waitForDeployment();
    deployedContracts.timelock = await timelock.getAddress();
    console.log("✅ MockTimelock deployed to:", deployedContracts.timelock);
    
    // Deploy HYPEYToken
    console.log("\n2️⃣ Deploying HYPEYToken...");
    const HYPEYToken = await ethers.getContractFactory("HYPEYToken");
    const token = await upgrades.deployProxy(
      HYPEYToken,
      [reserveBurnAddress, deployedContracts.timelock, multisigAddress],
      { initializer: "initialize" }
    );
    await token.waitForDeployment();
    deployedContracts.token = await token.getAddress();
    console.log("✅ HYPEYToken deployed to:", deployedContracts.token);
    
    // Deploy HYPEYTreasury
    console.log("\n3️⃣ Deploying HYPEYTreasury...");
    const HYPEYTreasury = await ethers.getContractFactory("HYPEYTreasury");
    const treasury = await upgrades.deployProxy(
      HYPEYTreasury,
      [deployedContracts.token, multisigAddress],
      { initializer: "initialize" }
    );
    await treasury.waitForDeployment();
    deployedContracts.treasury = await treasury.getAddress();
    console.log("✅ HYPEYTreasury deployed to:", deployedContracts.treasury);
    
    // Deploy HypeyVesting
    console.log("\n4️⃣ Deploying HypeyVesting...");
    const HypeyVesting = await ethers.getContractFactory("HypeyVesting");
    const vesting = await upgrades.deployProxy(
      HypeyVesting,
      [deployedContracts.token, multisigAddress, deployedContracts.timelock],
      { initializer: "initialize" }
    );
    await vesting.waitForDeployment();
    deployedContracts.vesting = await vesting.getAddress();
    console.log("✅ HypeyVesting deployed to:", deployedContracts.vesting);
    
    // Verify ownership
    console.log("\n📋 Verifying ownership...");
    
    const tokenOwner = await token.owner();
    console.log(`HYPEYToken owner: ${tokenOwner}`);
    console.log(`✅ Correct owner: ${tokenOwner.toLowerCase() === multisigAddress.toLowerCase()}`);
    
    const vestingOwner = await vesting.owner();
    console.log(`HypeyVesting owner: ${vestingOwner}`);
    console.log(`✅ Correct owner: ${vestingOwner.toLowerCase() === multisigAddress.toLowerCase()}`);
    
    const DEFAULT_ADMIN_ROLE = await treasury.DEFAULT_ADMIN_ROLE();
    const hasTreasuryAdmin = await treasury.hasRole(DEFAULT_ADMIN_ROLE, multisigAddress);
    console.log(`HYPEYTreasury admin role: ${hasTreasuryAdmin}`);
    
    const TIMELOCK_ADMIN_ROLE = await timelock.TIMELOCK_ADMIN_ROLE();
    const hasTimelockAdmin = await timelock.hasRole(TIMELOCK_ADMIN_ROLE, multisigAddress);
    console.log(`MockTimelock admin role: ${hasTimelockAdmin}`);
    
    // Save deployment info
    const deploymentInfo = {
      network: "baseSepolia",
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      owner: multisigAddress,
      contracts: deployedContracts
    };
    
    const fs = require('fs');
    const path = require('path');
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const filename = `fresh-base-sepolia-${Date.now()}.json`;
    fs.writeFileSync(
      path.join(deploymentsDir, filename),
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n🎉 Fresh deployment completed successfully!");
    console.log("📄 Deployment info saved to:", filename);
    console.log("\n📋 Contract Addresses:");
    console.log(`TOKEN_ADDRESS=${deployedContracts.token}`);
    console.log(`TREASURY_ADDRESS=${deployedContracts.treasury}`);
    console.log(`VESTING_ADDRESS=${deployedContracts.vesting}`);
    console.log(`TIMELOCK_ADDRESS=${deployedContracts.timelock}`);
    
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });