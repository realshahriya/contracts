const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🔄 HYPEY Contract Upgrade Script\n");

  // Get contract addresses from environment
  const tokenAddress = process.env.TOKEN_ADDRESS;
  const treasuryAddress = process.env.TREASURY_ADDRESS;
  const vestingAddress = process.env.VESTING_ADDRESS;

  if (!tokenAddress || !treasuryAddress || !vestingAddress) {
    throw new Error("Missing contract addresses in .env file");
  }

  console.log("📋 Upgrade Configuration:");
  console.log(`   Token: ${tokenAddress}`);
  console.log(`   Treasury: ${treasuryAddress}`);
  console.log(`   Vesting: ${vestingAddress}`);
  console.log("");

  // Get the contract to upgrade (change this as needed)
  const contractToUpgrade = process.argv[2]; // token, treasury, or vesting
  
  if (!contractToUpgrade) {
    console.log("Usage: npx hardhat run scripts/upgrade.js --network <network> <contract>");
    console.log("Where <contract> is one of: token, treasury, vesting");
    return;
  }

  let contractAddress, contractName;
  
  switch (contractToUpgrade.toLowerCase()) {
    case 'token':
      contractAddress = tokenAddress;
      contractName = "HYPEYToken";
      break;
    case 'treasury':
      contractAddress = treasuryAddress;
      contractName = "HYPEYTreasury";
      break;
    case 'vesting':
      contractAddress = vestingAddress;
      contractName = "HypeyVesting";
      break;
    default:
      throw new Error(`Unknown contract: ${contractToUpgrade}`);
  }

  console.log(`🔄 Upgrading ${contractName} at ${contractAddress}...`);

  try {
    // Get the new contract factory
    const ContractFactory = await ethers.getContractFactory(contractName);
    
    // Perform the upgrade
    console.log("   📦 Deploying new implementation...");
    const upgraded = await upgrades.upgradeProxy(contractAddress, ContractFactory);
    await upgraded.waitForDeployment();
    
    console.log(`   ✅ ${contractName} upgraded successfully!`);
    console.log(`   📍 Proxy address (unchanged): ${contractAddress}`);
    
    // Verify the upgrade
    console.log("\n🔍 Verifying upgrade...");
    const contract = await ethers.getContractAt(contractName, contractAddress);
    
    if (contractName === "HYPEYToken") {
      const name = await contract.name();
      const symbol = await contract.symbol();
      console.log(`   Token Name: ${name}`);
      console.log(`   Token Symbol: ${symbol}`);
    }
    
    const builder = await contract.builder();
    console.log(`   Builder: ${builder}`);
    
    console.log("\n🎉 Upgrade completed successfully!");
    
  } catch (error) {
    console.error("❌ Upgrade failed:", error.message);
    throw error;
  }
}

// Execute upgrade
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Upgrade script failed:", error);
      process.exit(1);
    });
}

module.exports = main;