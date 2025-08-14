const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("🔄 Transferring ownership of HYPEY contracts on Base Sepolia...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const newOwner = "0xdA08165d65834bED3926BC2578cF468A114Af331";
  console.log("New owner:", newOwner);
  
  // Contract addresses from Base Sepolia deployment
  const TOKEN_ADDRESS = "0xA8a28df0F0E732ff39D483DF51afF1Be6aC6C71E";
  const TREASURY_ADDRESS = "0x73A68C02ceC2576EfF4cC1EF53ad18677875d07a";
  const VESTING_ADDRESS = "0x220da0c263379c92FA1861bF1c13d5891E095a38";
  const TIMELOCK_ADDRESS = "0xa00105f74b048366C50EeFA95Bd0279661dE5cF6";
  
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
    
    console.log("\n📋 Current ownership status:");
    
    // Check current owners
    try {
      const tokenOwner = await token.owner();
      console.log("HYPEYToken owner:", tokenOwner);
    } catch (e) {
      console.log("HYPEYToken: Could not get owner -", e.message);
    }
    
    try {
      const vestingOwner = await vesting.owner();
      console.log("HypeyVesting owner:", vestingOwner);
    } catch (e) {
      console.log("HypeyVesting: Could not get owner -", e.message);
    }
    
    try {
      const DEFAULT_ADMIN_ROLE = await treasury.DEFAULT_ADMIN_ROLE();
      const deployerHasAdmin = await treasury.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
      console.log("HYPEYTreasury - Deployer has DEFAULT_ADMIN_ROLE:", deployerHasAdmin);
    } catch (e) {
      console.log("HYPEYTreasury: Could not check admin role -", e.message);
    }
    
    console.log("\n🔄 Starting ownership transfer...");
    
    // Transfer HYPEYToken ownership
    console.log("\n1️⃣ Transferring HYPEYToken ownership...");
    try {
      const currentOwner = await token.owner();
      if (currentOwner.toLowerCase() === deployer.address.toLowerCase()) {
        console.log("Deployer is current owner, transferring...");
        const transferTx = await token.transferOwnership(newOwner);
        await transferTx.wait();
        console.log("✅ HYPEYToken ownership transferred");
        console.log("   Transaction:", transferTx.hash);
        console.log("   BaseScan:", `https://sepolia.basescan.org/tx/${transferTx.hash}`);
      } else {
        console.log("ℹ️ Deployer is not the current owner:", currentOwner);
      }
    } catch (error) {
      console.log("❌ Failed to transfer HYPEYToken ownership:", error.message);
    }
    
    // Transfer HYPEYTreasury admin roles
    console.log("\n2️⃣ Transferring HYPEYTreasury admin roles...");
    try {
      const DEFAULT_ADMIN_ROLE = await treasury.DEFAULT_ADMIN_ROLE();
      const MULTISIG_ADMIN_ROLE = await treasury.MULTISIG_ADMIN_ROLE();
      
      const deployerHasAdmin = await treasury.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
      
      if (deployerHasAdmin) {
        console.log("Deployer has admin role, granting to new owner...");
        
        // Grant roles to new owner
        const tx1 = await treasury.grantRole(DEFAULT_ADMIN_ROLE, newOwner);
        await tx1.wait();
        console.log("✅ DEFAULT_ADMIN_ROLE granted to new owner");
        console.log("   Transaction:", tx1.hash);
        
        const tx2 = await treasury.grantRole(MULTISIG_ADMIN_ROLE, newOwner);
        await tx2.wait();
        console.log("✅ MULTISIG_ADMIN_ROLE granted to new owner");
        console.log("   Transaction:", tx2.hash);
        
        // Optionally revoke from deployer (uncomment if desired)
        // const tx3 = await treasury.revokeRole(DEFAULT_ADMIN_ROLE, deployer.address);
        // await tx3.wait();
        // console.log("✅ DEFAULT_ADMIN_ROLE revoked from deployer");
        
        console.log("   BaseScan:", `https://sepolia.basescan.org/tx/${tx1.hash}`);
      } else {
        console.log("ℹ️ Deployer does not have admin role");
      }
    } catch (error) {
      console.log("❌ Failed to transfer HYPEYTreasury admin roles:", error.message);
    }
    
    // Transfer HypeyVesting ownership
    console.log("\n3️⃣ Transferring HypeyVesting ownership...");
    try {
      const currentOwner = await vesting.owner();
      if (currentOwner.toLowerCase() === deployer.address.toLowerCase()) {
        console.log("Deployer is current owner, transferring...");
        const transferTx = await vesting.transferOwnership(newOwner);
        await transferTx.wait();
        console.log("✅ HypeyVesting ownership transferred");
        console.log("   Transaction:", transferTx.hash);
        console.log("   BaseScan:", `https://sepolia.basescan.org/tx/${transferTx.hash}`);
      } else {
        console.log("ℹ️ Deployer is not the current owner:", currentOwner);
      }
    } catch (error) {
      console.log("❌ Failed to transfer HypeyVesting ownership:", error.message);
    }
    
    // MockTimelock role management
    console.log("\n4️⃣ MockTimelock role management...");
    try {
      const TIMELOCK_ADMIN_ROLE = await timelock.TIMELOCK_ADMIN_ROLE();
      const deployerHasTimelockAdmin = await timelock.hasRole(TIMELOCK_ADMIN_ROLE, deployer.address);
      
      if (deployerHasTimelockAdmin) {
        console.log("Deployer has timelock admin role, granting to new owner...");
        const tx = await timelock.grantRole(TIMELOCK_ADMIN_ROLE, newOwner);
        await tx.wait();
        console.log("✅ TIMELOCK_ADMIN_ROLE granted to new owner");
        console.log("   Transaction:", tx.hash);
        console.log("   BaseScan:", `https://sepolia.basescan.org/tx/${tx.hash}`);
      } else {
        console.log("ℹ️ Deployer does not have timelock admin role");
      }
    } catch (error) {
      console.log("❌ Failed to manage MockTimelock roles:", error.message);
    }
    
    console.log("\n📋 Verifying final ownership...");
    
    try {
      const tokenOwner = await token.owner();
      console.log("HYPEYToken owner:", tokenOwner);
      console.log("   ✅ Correct:", tokenOwner.toLowerCase() === newOwner.toLowerCase());
    } catch (e) {
      console.log("HYPEYToken: Could not verify owner");
    }
    
    try {
      const vestingOwner = await vesting.owner();
      console.log("HypeyVesting owner:", vestingOwner);
      console.log("   ✅ Correct:", vestingOwner.toLowerCase() === newOwner.toLowerCase());
    } catch (e) {
      console.log("HypeyVesting: Could not verify owner");
    }
    
    try {
      const DEFAULT_ADMIN_ROLE = await treasury.DEFAULT_ADMIN_ROLE();
      const hasRole = await treasury.hasRole(DEFAULT_ADMIN_ROLE, newOwner);
      console.log("HYPEYTreasury DEFAULT_ADMIN_ROLE for new owner:", hasRole);
    } catch (e) {
      console.log("HYPEYTreasury: Could not verify admin role");
    }
    
    try {
      const TIMELOCK_ADMIN_ROLE = await timelock.TIMELOCK_ADMIN_ROLE();
      const hasRole = await timelock.hasRole(TIMELOCK_ADMIN_ROLE, newOwner);
      console.log("MockTimelock TIMELOCK_ADMIN_ROLE for new owner:", hasRole);
    } catch (e) {
      console.log("MockTimelock: Could not verify admin role");
    }
    
    console.log("\n✅ Ownership transfer process completed!");
    console.log("\n📋 Summary:");
    console.log("   - New owner:", newOwner);
    console.log("   - Network: Base Sepolia");
    console.log("   - Explorer: https://sepolia.basescan.org");
    console.log("\n⚠️  Important next steps:");
    console.log("   - Verify ownership changes on BaseScan");
    console.log("   - Test contract functions with new owner");
    console.log("   - Update any integration documentation");
    console.log("   - Secure the new owner's private key");
    
  } catch (error) {
    console.error("❌ Ownership transfer failed:", error.message);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });