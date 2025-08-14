const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🔍 Checking ownership of newly deployed contracts on Base Sepolia...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Current deployer:", deployer.address);
  
  const targetOwner = "0xdA08165d65834bED3926BC2578cF468A114Af331";
  console.log("Target owner:", targetOwner);
  
  // New contract addresses
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
    
    console.log("\n📋 Checking ownership status:");
    
    // Check HYPEYToken owner
    try {
      const tokenOwner = await token.owner();
      console.log(`\n🪙 HYPEYToken (${TOKEN_ADDRESS}):`);
      console.log(`   Owner: ${tokenOwner}`);
      console.log(`   Is target owner? ${tokenOwner.toLowerCase() === targetOwner.toLowerCase()}`);
    } catch (e) {
      console.log(`\n🪙 HYPEYToken: Could not get owner - ${e.message}`);
    }
    
    // Check HypeyVesting owner
    try {
      const vestingOwner = await vesting.owner();
      console.log(`\n⏰ HypeyVesting (${VESTING_ADDRESS}):`);
      console.log(`   Owner: ${vestingOwner}`);
      console.log(`   Is target owner? ${vestingOwner.toLowerCase() === targetOwner.toLowerCase()}`);
    } catch (e) {
      console.log(`\n⏰ HypeyVesting: Could not get owner - ${e.message}`);
    }
    
    // Check HYPEYTreasury roles
    try {
      const DEFAULT_ADMIN_ROLE = await treasury.DEFAULT_ADMIN_ROLE();
      const targetHasAdmin = await treasury.hasRole(DEFAULT_ADMIN_ROLE, targetOwner);
      console.log(`\n🏛️ HYPEYTreasury (${TREASURY_ADDRESS}):`);
      console.log(`   Target has DEFAULT_ADMIN_ROLE: ${targetHasAdmin}`);
    } catch (e) {
      console.log(`\n🏛️ HYPEYTreasury: Could not check roles - ${e.message}`);
    }
    
    // Check MockTimelock roles
    try {
      const TIMELOCK_ADMIN_ROLE = await timelock.TIMELOCK_ADMIN_ROLE();
      const targetHasTimelockAdmin = await timelock.hasRole(TIMELOCK_ADMIN_ROLE, targetOwner);
      console.log(`\n⏳ MockTimelock (${TIMELOCK_ADDRESS}):`);
      console.log(`   Target has TIMELOCK_ADMIN_ROLE: ${targetHasTimelockAdmin}`);
    } catch (e) {
      console.log(`\n⏳ MockTimelock: Could not check roles - ${e.message}`);
    }
    
  } catch (error) {
    console.error("❌ Error checking ownership:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });