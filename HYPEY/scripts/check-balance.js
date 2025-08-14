const { ethers } = require("hardhat");

async function main() {
  console.log("💰 Checking wallet balance...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Wallet address:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceInEth = ethers.formatEther(balance);
  
  console.log("Balance:", balanceInEth, "ETH");
  
  if (parseFloat(balanceInEth) === 0) {
    console.log("\n❌ No funds available for deployment!");
    console.log("Please fund this wallet with Arbitrum Sepolia ETH from:");
    console.log("🔗 https://faucet.quicknode.com/arbitrum/sepolia");
    console.log("🔗 https://bridge.arbitrum.io/");
  } else {
    console.log("\n✅ Wallet has funds for deployment!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });