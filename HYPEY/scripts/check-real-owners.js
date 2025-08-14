const { ethers } = require("hardhat");
require("dotenv").config();

// Contract addresses from .env
const HYPEY_TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
const HYPEY_TREASURY_ADDRESS = process.env.TREASURY_ADDRESS;
const HYPEY_VESTING_ADDRESS = process.env.VESTING_ADDRESS;
const MOCK_TIMELOCK_ADDRESS = process.env.TIMELOCK_ADDRESS;

async function main() {
  console.log("🔍 Checking real contract owners on Arbitrum Sepolia...");
  console.log("");
  
  const [deployer] = await ethers.getSigners();
  console.log("Current deployer:", deployer.address);
  console.log("");
  
  // Check HYPEYToken owner
  try {
    const hypeyToken = await ethers.getContractAt("HYPEYToken", HYPEY_TOKEN_ADDRESS);
    const tokenOwner = await hypeyToken.owner();
    console.log("📄 HYPEYToken:");
    console.log(`   Address: ${HYPEY_TOKEN_ADDRESS}`);
    console.log(`   Owner: ${tokenOwner}`);
    console.log(`   Is deployer owner? ${tokenOwner.toLowerCase() === deployer.address.toLowerCase()}`);
  } catch (error) {
    console.log("❌ Error checking HYPEYToken owner:", error.message);
  }
  
  console.log("");
  
  // Check HYPEYTreasury roles
  try {
    const hypeyTreasury = await ethers.getContractAt("HYPEYTreasury", HYPEY_TREASURY_ADDRESS);
    const DEFAULT_ADMIN_ROLE = await hypeyTreasury.DEFAULT_ADMIN_ROLE();
    const MULTISIG_ADMIN_ROLE = await hypeyTreasury.MULTISIG_ADMIN_ROLE();
    
    const hasDefaultAdmin = await hypeyTreasury.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    const hasMultisigAdmin = await hypeyTreasury.hasRole(MULTISIG_ADMIN_ROLE, deployer.address);
    
    console.log("🏛️ HYPEYTreasury:");
    console.log(`   Address: ${HYPEY_TREASURY_ADDRESS}`);
    console.log(`   Deployer has DEFAULT_ADMIN_ROLE? ${hasDefaultAdmin}`);
    console.log(`   Deployer has MULTISIG_ADMIN_ROLE? ${hasMultisigAdmin}`);
  } catch (error) {
    console.log("❌ Error checking HYPEYTreasury roles:", error.message);
  }
  
  console.log("");
  
  // Check HypeyVesting owner
  try {
    const hypeyVesting = await ethers.getContractAt("HypeyVesting", HYPEY_VESTING_ADDRESS);
    const vestingOwner = await hypeyVesting.owner();
    console.log("⏰ HypeyVesting:");
    console.log(`   Address: ${HYPEY_VESTING_ADDRESS}`);
    console.log(`   Owner: ${vestingOwner}`);
    console.log(`   Is deployer owner? ${vestingOwner.toLowerCase() === deployer.address.toLowerCase()}`);
  } catch (error) {
    console.log("❌ Error checking HypeyVesting owner:", error.message);
  }
  
  console.log("");
  
  // Check MockTimelock roles
  try {
    const mockTimelock = await ethers.getContractAt("MockTimelock", MOCK_TIMELOCK_ADDRESS);
    const TIMELOCK_ADMIN_ROLE = await mockTimelock.TIMELOCK_ADMIN_ROLE();
    const PROPOSER_ROLE = await mockTimelock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await mockTimelock.EXECUTOR_ROLE();
    
    const hasTimelockAdmin = await mockTimelock.hasRole(TIMELOCK_ADMIN_ROLE, deployer.address);
    const hasProposer = await mockTimelock.hasRole(PROPOSER_ROLE, deployer.address);
    const hasExecutor = await mockTimelock.hasRole(EXECUTOR_ROLE, deployer.address);
    
    console.log("⏳ MockTimelock:");
    console.log(`   Address: ${MOCK_TIMELOCK_ADDRESS}`);
    console.log(`   Deployer has TIMELOCK_ADMIN_ROLE? ${hasTimelockAdmin}`);
    console.log(`   Deployer has PROPOSER_ROLE? ${hasProposer}`);
    console.log(`   Deployer has EXECUTOR_ROLE? ${hasExecutor}`);
  } catch (error) {
    console.log("❌ Error checking MockTimelock roles:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });