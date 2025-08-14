const hre = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🔍 Starting Arbitrum Sepolia Contract Verification...\n");

  // Contract addresses from deployment
  const contracts = {
    MockTimelock: "0x420334D26d667C23eF3868E842a0d17774d3429A",
    HYPEYToken: "0xCb1aa302a42df12a717c9d3c5c626BED015D6411", 
    HYPEYTreasury: "0xfa6b354e710B5a1Ed45c28491e164F2f81869FC2",
    HypeyVesting: "0x6FaE303669E60F5216aF1A05861f259DD1101A7b"
  };

  console.log("📋 Contract Addresses to Verify:");
  Object.entries(contracts).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });
  console.log();

  // Check if we have a proper Arbiscan API key
  const arbiscanKey = process.env.ARBISCAN_API_KEY;
  if (!arbiscanKey || arbiscanKey === "J5XS1QDWTEP7I2PQ63N7TGXA2ETMUN5NC4") {
    console.log("⚠️  WARNING: No valid Arbiscan API key detected!");
    console.log("📝 To get a proper API key:");
    console.log("   1. Visit: https://arbiscan.io/apis");
    console.log("   2. Create an account and generate an API key");
    console.log("   3. Update your .env file: ARBISCAN_API_KEY=your_actual_key");
    console.log();
    
    console.log("🔗 Manual Verification Links:");
    Object.entries(contracts).forEach(([name, address]) => {
      console.log(`  ${name}: https://sepolia.arbiscan.io/address/${address}#code`);
    });
    console.log();
    
    console.log("📁 Flattened Contract Files Available:");
    console.log("  - flattened/HYPEYToken_flattened.sol");
    console.log("  - flattened/HYPEYTreasury_flattened.sol");
    console.log("  - flattened/HypeyVesting_flattened.sol");
    console.log("  - flattened/MockTimelock_flattened.sol");
    console.log();
    
    return;
  }

  console.log("🔑 Valid API key detected. Attempting automatic verification...\n");

  // Try to verify each contract
  for (const [contractName, contractAddress] of Object.entries(contracts)) {
    try {
      console.log(`🔍 Verifying ${contractName} at ${contractAddress}...`);
      
      await hre.run("verify:verify", {
        address: contractAddress,
        network: "arbitrumSepolia"
      });
      
      console.log(`✅ ${contractName} verified successfully!`);
      
    } catch (error) {
      console.log(`❌ Failed to verify ${contractName}:`);
      console.log(`   Error: ${error.message}`);
      
      if (error.message.includes("already verified")) {
        console.log(`ℹ️  ${contractName} is already verified on Arbiscan`);
      } else if (error.message.includes("API Key")) {
        console.log(`🔗 Manual verification: https://sepolia.arbiscan.io/address/${contractAddress}#code`);
      }
    }
    console.log();
  }

  console.log("🎉 Verification process completed!");
  console.log("\n📊 View your contracts on Arbiscan:");
  Object.entries(contracts).forEach(([name, address]) => {
    console.log(`  ${name}: https://sepolia.arbiscan.io/address/${address}`);
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });