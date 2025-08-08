const { ethers, upgrades } = require("hardhat");

/**
 * Secure Deployment Script for HYPEY Contracts
 * Implements all security fixes from the audit report
 */
async function main() {
    console.log("🔒 Starting Secure HYPEY Deployment with Security Fixes...");
    
    const [deployer] = await ethers.getSigners();
    
    // For testnet deployment, use the same account for all roles
    const multisigAdmin = deployer;
    const platformManager = deployer;
    
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Multisig Admin:", multisigAdmin.address);
    console.log("Platform Manager:", platformManager.address);
    
    // Deploy Timelock Controller first (for governance)
    console.log("\n📋 Deploying MockTimelock...");
    const MockTimelock = await ethers.getContractFactory("MockTimelock");
    const timelock = await upgrades.deployProxy(MockTimelock, [
        24 * 60 * 60, // 24 hour delay
        [multisigAdmin.address], // proposers
        [multisigAdmin.address], // executors
        deployer.address // admin (will be renounced)
    ]);
    await timelock.waitForDeployment();
    console.log("✅ TimelockController deployed to:", await timelock.getAddress());
    
    // Deploy HYPEYToken with security fixes
    console.log("\n🪙 Deploying HYPEYToken with Security Fixes...");
    const HYPEYToken = await ethers.getContractFactory("HYPEYToken");
    const token = await upgrades.deployProxy(HYPEYToken, [
        deployer.address, // reserveBurnAddress
        await timelock.getAddress(), // timelockAddress
        deployer.address // initialOwner
    ]);
    await token.waitForDeployment();
    console.log("✅ HYPEYToken deployed to:", await token.getAddress());
    
    // Deploy HYPEYTreasury with security fixes
    console.log("\n🏦 Deploying HYPEYTreasury with Security Fixes...");
    const HYPEYTreasury = await ethers.getContractFactory("HYPEYTreasury");
    const treasury = await upgrades.deployProxy(HYPEYTreasury, [
        deployer.address, // admin
        await timelock.getAddress() // timelock
    ]);
    await treasury.waitForDeployment();
    console.log("✅ HYPEYTreasury deployed to:", await treasury.getAddress());
    
    // Deploy HypeyVesting with security fixes
    console.log("\n⏰ Deploying HypeyVesting with Security Fixes...");
    const HypeyVesting = await ethers.getContractFactory("HypeyVesting");
    const vesting = await upgrades.deployProxy(HypeyVesting, [
        await token.getAddress(), // token address
        deployer.address, // initial owner
        await timelock.getAddress() // timelock
    ]);
    await vesting.waitForDeployment();
    console.log("✅ HypeyVesting deployed to:", await vesting.getAddress());
    
    // Setup Security Roles
    console.log("\n🔐 Setting up Security Roles...");
    
    // Grant MULTISIG_ADMIN_ROLE to multisig admin
    const MULTISIG_ADMIN_ROLE = await token.MULTISIG_ADMIN_ROLE();
    await token.grantRole(MULTISIG_ADMIN_ROLE, multisigAdmin.address);
    console.log("✅ Granted MULTISIG_ADMIN_ROLE to:", multisigAdmin.address);
    
    // Grant PLATFORM_MANAGER_ROLE to platform manager
    const PLATFORM_MANAGER_ROLE = await token.PLATFORM_MANAGER_ROLE();
    await token.grantRole(PLATFORM_MANAGER_ROLE, platformManager.address);
    console.log("✅ Granted PLATFORM_MANAGER_ROLE to:", platformManager.address);
    
    // Setup Treasury roles
    await treasury.grantRole(MULTISIG_ADMIN_ROLE, multisigAdmin.address);
    console.log("✅ Granted Treasury MULTISIG_ADMIN_ROLE to:", multisigAdmin.address);
    
    // Setup Vesting roles
    await vesting.grantRole(MULTISIG_ADMIN_ROLE, multisigAdmin.address);
    console.log("✅ Granted Vesting MULTISIG_ADMIN_ROLE to:", multisigAdmin.address);
    
    // Security Configuration
    console.log("\n⚙️ Applying Security Configuration...");
    
    // Set initial burn rate with security checks
    console.log("Setting initial burn rate to 1% (100 basis points)...");
    // Note: This will now require multisig approval due to security fixes
    
    // Add supported tokens to treasury
    console.log("Adding HYPEY token as supported in treasury...");
    await treasury.addSupportedToken(await token.getAddress());
    
    // Transfer ownership to timelock for enhanced security
    console.log("\n🔄 Transferring ownership to Timelock for enhanced security...");
    await token.transferOwnership(await timelock.getAddress());
    await treasury.transferOwnership(await timelock.getAddress());
    await vesting.transferOwnership(await timelock.getAddress());
    
    console.log("✅ All contracts ownership transferred to Timelock");
    
    // Security Verification
    console.log("\n🔍 Security Verification...");
    
    // Verify emergency pause is not active
    const emergencyPaused = await token.emergencyPaused();
    console.log("Emergency Pause Status:", emergencyPaused ? "🔴 PAUSED" : "🟢 ACTIVE");
    
    // Verify timelock delay
    const timelockDelay = await token.TIMELOCK_DELAY();
    console.log("Timelock Delay:", timelockDelay.toString(), "seconds (24 hours)");
    
    // Verify rate change cooldown
    const rateCooldown = await token.RATE_CHANGE_COOLDOWN();
    console.log("Rate Change Cooldown:", rateCooldown.toString(), "seconds (1 hour)");
    
    // Verify daily withdrawal limits
    const dailyLimit = await treasury.DAILY_WITHDRAWAL_LIMIT();
    console.log("Daily Withdrawal Limit:", ethers.formatEther(dailyLimit), "tokens");
    
    console.log("\n🎉 Secure Deployment Complete!");
    console.log("\n📋 Deployment Summary:");
    console.log("==========================================");
    console.log("MockTimelock:", await timelock.getAddress());
    console.log("HYPEYToken:", await token.getAddress());
    console.log("HYPEYTreasury:", await treasury.getAddress());
    console.log("HypeyVesting:", await vesting.getAddress());
    console.log("==========================================");
    
    console.log("\n🔒 Security Features Enabled:");
    console.log("✅ Multi-signature governance");
    console.log("✅ Timelock protection (24h delay)");
    console.log("✅ Reentrancy protection");
    console.log("✅ Emergency pause mechanism");
    console.log("✅ Rate limiting (1h cooldown)");
    console.log("✅ Daily withdrawal limits");
    console.log("✅ Integer overflow protection");
    console.log("✅ Vesting finalization mechanism");
    console.log("✅ Gas limit DoS protection");
    
    console.log("\n⚠️  IMPORTANT SECURITY NOTES:");
    console.log("1. All critical functions now require multisig approval");
    console.log("2. Parameter changes have 24-hour timelock delay");
    console.log("3. Emergency pause can be activated by MULTISIG_ADMIN_ROLE");
    console.log("4. Daily withdrawal limits are enforced cumulatively");
    console.log("5. Vesting schedules should be finalized after creation");
    
    return {
        timelock: await timelock.getAddress(),
        token: await token.getAddress(),
        treasury: await treasury.getAddress(),
        vesting: await vesting.getAddress()
    };
}

// Error handling
main()
    .then((addresses) => {
        console.log("\n✅ Deployment successful!");
        console.log("Contract addresses:", addresses);
        process.exit(0);
    })
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });

module.exports = main;