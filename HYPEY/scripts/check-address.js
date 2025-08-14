const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking current wallet address...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Current deployer address:", deployer.address);
  
  // Expected owner address
  const expectedOwner = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  console.log("Expected owner address:", expectedOwner);
  
  if (deployer.address.toLowerCase() === expectedOwner.toLowerCase()) {
    console.log("✅ Addresses match! Ready to transfer ownership.");
  } else {
    console.log("❌ Addresses don't match!");
    console.log("   Current:", deployer.address);
    console.log("   Expected:", expectedOwner);
  }
  
  // Show all available accounts
  const accounts = await ethers.getSigners();
  console.log("\n📋 Available accounts:");
  for (let i = 0; i < Math.min(accounts.length, 5); i++) {
    console.log(`   Account ${i}: ${accounts[i].address}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });