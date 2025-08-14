const { ethers } = require("hardhat");
require("dotenv").config();
const fs = require("fs");

async function main() {
  console.log("🚀 Simple HYPEY Token Deployment on Base Sepolia...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  
  const multisigAddress = process.env.MULTISIG_ADDRESS;
  const reserveBurnAddress = process.env.RESERVE_BURN_ADDRESS || "0x000000000000000000000000000000000000dEaD";
  
  console.log("\n📋 Configuration:");
  console.log("   Multisig Address:", multisigAddress);
  console.log("   Reserve Burn Address:", reserveBurnAddress);
  
  const deployments = {};
  
  try {
    // Deploy MockTimelock
    console.log("\n⏰ Deploying MockTimelock...");
    const MockTimelock = await ethers.getContractFactory("MockTimelock");
    const mockTimelock = await MockTimelock.deploy();
    await mockTimelock.waitForDeployment();
    const timelockAddress = await mockTimelock.getAddress();
    console.log("✅ MockTimelock deployed to:", timelockAddress);
    deployments.MockTimelock = timelockAddress;
    
    // Deploy HYPEYToken
    console.log("\n🪙 Deploying HYPEYToken...");
    const HYPEYToken = await ethers.getContractFactory("HYPEYToken");
    const hypeyToken = await HYPEYToken.deploy();
    await hypeyToken.waitForDeployment();
    const tokenAddress = await hypeyToken.getAddress();
    console.log("✅ HYPEYToken deployed to:", tokenAddress);
    deployments.HYPEYToken = tokenAddress;
    
    // Initialize HYPEYToken if it has an initialize function
    try {
      console.log("🔧 Initializing HYPEYToken...");
      const initTx = await hypeyToken.initialize(reserveBurnAddress, timelockAddress, multisigAddress);
      await initTx.wait();
      console.log("✅ HYPEYToken initialized");
    } catch (initError) {
      console.log("ℹ️ HYPEYToken initialization not needed or failed:", initError.message);
    }
    
    // Deploy HYPEYTreasury
    console.log("\n🏛️ Deploying HYPEYTreasury...");
    const HYPEYTreasury = await ethers.getContractFactory("HYPEYTreasury");
    const hypeyTreasury = await HYPEYTreasury.deploy();
    await hypeyTreasury.waitForDeployment();
    const treasuryAddress = await hypeyTreasury.getAddress();
    console.log("✅ HYPEYTreasury deployed to:", treasuryAddress);
    deployments.HYPEYTreasury = treasuryAddress;
    
    // Initialize HYPEYTreasury if it has an initialize function
    try {
      console.log("🔧 Initializing HYPEYTreasury...");
      const initTx = await hypeyTreasury.initialize(tokenAddress, multisigAddress);
      await initTx.wait();
      console.log("✅ HYPEYTreasury initialized");
    } catch (initError) {
      console.log("ℹ️ HYPEYTreasury initialization not needed or failed:", initError.message);
    }
    
    // Deploy HypeyVesting
    console.log("\n⏳ Deploying HypeyVesting...");
    const HypeyVesting = await ethers.getContractFactory("HypeyVesting");
    const hypeyVesting = await HypeyVesting.deploy();
    await hypeyVesting.waitForDeployment();
    const vestingAddress = await hypeyVesting.getAddress();
    console.log("✅ HypeyVesting deployed to:", vestingAddress);
    deployments.HypeyVesting = vestingAddress;
    
    // Initialize HypeyVesting if it has an initialize function
    try {
      console.log("🔧 Initializing HypeyVesting...");
      const initTx = await hypeyVesting.initialize(tokenAddress, multisigAddress);
      await initTx.wait();
      console.log("✅ HypeyVesting initialized");
    } catch (initError) {
      console.log("ℹ️ HypeyVesting initialization not needed or failed:", initError.message);
    }
    
    // Save deployment info
    const deploymentInfo = {
      network: "baseSepolia",
      chainId: 84532,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: deployments
    };
    
    fs.writeFileSync(
      "deployments/base-sepolia-simple.json",
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n🎉 Deployment Summary:");
    console.log("📄 MockTimelock:", deployments.MockTimelock);
    console.log("🪙 HYPEYToken:", deployments.HYPEYToken);
    console.log("🏛️ HYPEYTreasury:", deployments.HYPEYTreasury);
    console.log("⏳ HYPEYVesting:", deployments.HYPEYVesting);
    console.log("\n💾 Deployment info saved to: deployments/base-sepolia-simple.json");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main()
  .then(() => {
    console.log("\n✅ Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });