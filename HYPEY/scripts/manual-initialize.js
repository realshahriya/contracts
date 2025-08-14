const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🔧 Manually initializing contracts with correct owner...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const targetOwner = "0xdA08165d65834bED3926BC2578cF468A114Af331";
  const reserveBurnAddress = "0x000000000000000000000000000000000000dEaD";
  
  // Contract addresses from latest deployment
  const TOKEN_ADDRESS = "0x118C9D5AE20B1766b8C93C571A248A991f32414A";
  const TREASURY_ADDRESS = "0x254F0B7735E381d7f523D606bbEF0fd3aB5aD5B1";
  const VESTING_ADDRESS = "0x0F60B08218B14c3De7929856525bdCF258dbc5Dc";
  const TIMELOCK_ADDRESS = "0x4541c2818D9F5dB2a44cB0fDCde9788dE62d26cc";
  
  try {
    // Get contract instances
    const HYPEYToken = await ethers.getContractFactory("HYPEYToken");
    const HYPEYTreasury = await ethers.getContractFactory("HYPEYTreasury");
    const HypeyVesting = await ethers.getContractFactory("HypeyVesting");
    const MockTimelock = await ethers.getContractFactory("MockTimelock");
    
    const token = HYPEYToken.attach(TOKEN_ADDRESS);
    const treasury = HYPEYTreasury.attach(TREASURY_ADDRESS);
    const vesting = HypeyVesting.attach(VESTING_ADDRESS);
    const timelock = MockTimelock.attach(TIMELOCK_ADDRESS);
    
    console.log("\n1️⃣ Initializing HYPEYToken...");
    try {
      const initTx = await token.initialize(reserveBurnAddress, TIMELOCK_ADDRESS, targetOwner);
      await initTx.wait();
      console.log("✅ HYPEYToken initialized successfully");
    } catch (e) {
      console.log(`ℹ️ HYPEYToken initialization failed: ${e.message}`);
    }
    
    console.log("\n2️⃣ Initializing HYPEYTreasury...");
    try {
      const initTx = await treasury.initialize(TOKEN_ADDRESS, targetOwner);
      await initTx.wait();
      console.log("✅ HYPEYTreasury initialized successfully");
    } catch (e) {
      console.log(`ℹ️ HYPEYTreasury initialization failed: ${e.message}`);
    }
    
    console.log("\n3️⃣ Initializing HypeyVesting...");
    try {
      const initTx = await vesting.initialize(TOKEN_ADDRESS, targetOwner, TIMELOCK_ADDRESS);
      await initTx.wait();
      console.log("✅ HypeyVesting initialized successfully");
    } catch (e) {
      console.log(`ℹ️ HypeyVesting initialization failed: ${e.message}`);
    }
    
    console.log("\n4️⃣ Initializing MockTimelock...");
    try {
      const minDelay = 86400; // 1 day
      const proposers = [targetOwner];
      const executors = [targetOwner];
      const admin = targetOwner;
      
      const initTx = await timelock.initialize(minDelay, proposers, executors, admin);
      await initTx.wait();
      console.log("✅ MockTimelock initialized successfully");
    } catch (e) {
      console.log(`ℹ️ MockTimelock initialization failed: ${e.message}`);
    }
    
    // Check final ownership
    console.log("\n📋 Checking final ownership...");
    
    try {
      const tokenOwner = await token.owner();
      console.log(`HYPEYToken owner: ${tokenOwner}`);
      console.log(`Is correct owner? ${tokenOwner.toLowerCase() === targetOwner.toLowerCase()}`);
    } catch (e) {
      console.log(`HYPEYToken owner check failed: ${e.message}`);
    }
    
    try {
      const vestingOwner = await vesting.owner();
      console.log(`HypeyVesting owner: ${vestingOwner}`);
      console.log(`Is correct owner? ${vestingOwner.toLowerCase() === targetOwner.toLowerCase()}`);
    } catch (e) {
      console.log(`HypeyVesting owner check failed: ${e.message}`);
    }
    
    try {
      const DEFAULT_ADMIN_ROLE = await treasury.DEFAULT_ADMIN_ROLE();
      const hasAdmin = await treasury.hasRole(DEFAULT_ADMIN_ROLE, targetOwner);
      console.log(`HYPEYTreasury admin role: ${hasAdmin}`);
    } catch (e) {
      console.log(`HYPEYTreasury role check failed: ${e.message}`);
    }
    
    try {
      const TIMELOCK_ADMIN_ROLE = await timelock.TIMELOCK_ADMIN_ROLE();
      const hasTimelockAdmin = await timelock.hasRole(TIMELOCK_ADMIN_ROLE, targetOwner);
      console.log(`MockTimelock admin role: ${hasTimelockAdmin}`);
    } catch (e) {
      console.log(`MockTimelock role check failed: ${e.message}`);
    }
    
    console.log("\n✅ Manual initialization completed!");
    
  } catch (error) {
    console.error("❌ Error during manual initialization:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });