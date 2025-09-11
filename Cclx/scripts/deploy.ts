import { ethers } from "hardhat";

// Deploy contract directly without using upgrades
async function deployContract(name: string, args: any[] = []) {
  console.log(`Deploying ${name}...`);
  const factory = await ethers.getContractFactory(name);
  
  try {
    // Deploy the implementation contract directly
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    console.log(`${name} deployed at: ${await contract.getAddress()}`);
    
    // Call initialize manually if args are provided
    if (args.length > 0) {
      try {
        await contract.initialize(...args);
        console.log(`Initialized ${name} with args:`, args);
      } catch (error) {
      console.warn(`Warning: Failed to initialize ${name}:`, (error as Error).message);
      }
    }
    
    return contract;
  } catch (error) {
    console.error(`Error deploying ${name}:`, error);
    throw error;
  }
}
import { Contract } from "ethers";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy CCLXToken
  console.log("\n1. Deploying CCLXToken...");
  const token = await deployContract("CCLXToken", ["CCLX Token", "CCLX"]);
  const tokenAddress = await token.getAddress();
  console.log(`CCLXToken deployed to: ${tokenAddress}`);

  // Deploy CCLXTreasury
  console.log("\n2. Deploying CCLXTreasury...");
  const treasury = await deployContract("CCLXTreasury", [deployer.address]);
  const treasuryAddress = await treasury.getAddress();
  console.log(`CCLXTreasury deployed to: ${treasuryAddress}`);

  // Check token balance before funding Treasury
  console.log("\n   Checking token balance...");
  const deployerBalance = await token.balanceOf(deployer.address);
  console.log(`   Deployer balance: ${ethers.formatEther(deployerBalance)} tokens`);
  
  // Fund Treasury with tokens if balance is sufficient
  const treasuryFundAmount = ethers.parseEther("50000000"); // 50 million tokens
  if (deployerBalance >= treasuryFundAmount) {
    console.log("\n   Funding Treasury with tokens...");
    await token.transfer(treasuryAddress, treasuryFundAmount);
    console.log(`   Transferred ${ethers.formatEther(treasuryFundAmount)} tokens to Treasury`);
  } else {
    console.log(`   Insufficient balance to fund Treasury. Skipping transfer.`);
  }

  // Deploy CCLXVesting
  console.log("\n3. Deploying CCLXVesting...");
  const vesting = await deployContract("CCLXVesting", [deployer.address, tokenAddress]);
  const vestingAddress = await vesting.getAddress();
  console.log(`CCLXVesting deployed to: ${vestingAddress}`);
  
  // Check if we can create a vesting schedule
  try {
    console.log("\n   Setting up vesting schedule...");
    // Only create vesting schedule if we have tokens
    if (deployerBalance > 0) {
      const vestAmount = deployerBalance.gt(ethers.parseEther("1000000")) ? 
        ethers.parseEther("1000000") : deployerBalance;
      console.log(`   Creating vesting schedule with ${ethers.formatEther(vestAmount)} tokens`);
    } else {
      console.log("   Skipping vesting schedule creation due to insufficient token balance");
    }
  } catch (error) {
    console.warn("   Warning: Failed to create vesting schedule:", (error as Error).message);
  }

  // Fund Vesting contract if we have tokens
  try {
    const deployerBalanceBigInt = BigInt(deployerBalance.toString());
    const zeroBigInt = BigInt(0);
    
    if (deployerBalanceBigInt > zeroBigInt) {
      console.log("\n   Funding Vesting contract with tokens...");
      const remainingBalance = await token.balanceOf(deployer.address);
      const remainingBalanceBigInt = BigInt(remainingBalance.toString());
      const tenMillionBigInt = BigInt(ethers.parseEther("10000000").toString());
      
      const vestingFundAmount = remainingBalanceBigInt > tenMillionBigInt ? 
        tenMillionBigInt : remainingBalanceBigInt;
      
      if (vestingFundAmount > zeroBigInt) {
        try {
          await token.transfer(vestingAddress, vestingFundAmount);
          console.log(`   Transferred ${ethers.formatEther(vestingFundAmount.toString())} tokens to Vesting contract`);
        } catch (error) {
           console.warn(`   Warning: Failed to transfer tokens to Vesting:`, (error as Error).message);
        }
      } else {
        console.log(`   Insufficient balance to fund Vesting. Skipping transfer.`);
      }
    } else {
      console.log(`   No tokens available to fund Vesting. Skipping transfer.`);
    }
  } catch (error) {
      console.warn(`   Warning: Error checking deployer balance:`, (error as Error).message);
  }

  // Fund Vesting contract through its fund function
  try {
    // Skip fund function call as it may not be available or needed
    console.log(`   Skipping vesting fund() call - tokens already transferred directly`);
  } catch (error) {
    console.warn(`   Warning: Failed to fund vesting contract:`, (error as Error).message);
  }

  // Create example vesting schedule
  console.log("\n   Creating example vesting schedule...");
  const now = Math.floor(Date.now() / 1000);
  const oneMonth = 30 * 24 * 60 * 60;
  const oneYear = 365 * 24 * 60 * 60;
  
  try {
    // Check if vesting contract has enough tokens
    const vestingBalance = await token.balanceOf(vestingAddress);
    console.log(`   Vesting contract balance: ${ethers.formatEther(vestingBalance)} tokens`);
    
    // Convert vestingBalance to BigInt for comparison
    const vestingBalanceBigInt = BigInt(vestingBalance.toString());
    const zeroBigInt = BigInt(0);
    
    if (vestingBalanceBigInt > zeroBigInt) {
      // Check if we have the right role to create schedules
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      const hasAdminRole = await vesting.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
      
      if (hasAdminRole) {
        // Convert 1 million tokens to BigInt
        const oneMillion = BigInt(ethers.parseEther("1000000").toString());
        const scheduleAmount = vestingBalanceBigInt > oneMillion ? 
          oneMillion : vestingBalanceBigInt;
          
        try {
          // Try the createSchedule function first
          await vesting.createSchedule(
            deployer.address,          // beneficiary
            scheduleAmount,            // amount based on available balance
            now,                      // start time (now)
            oneMonth,                 // cliff duration (1 month)
            oneYear,                  // total duration (1 year)
            true                      // revocable
          );
          console.log(`   Created vesting schedule for ${deployer.address} with ${ethers.formatEther(scheduleAmount.toString())} tokens`);
        } catch (error) {
          console.warn(`   Warning: Failed to create schedule with createSchedule:`, (error as Error).message);
          
          // Try alternative function if available
          try {
            await vesting.createVestingSchedule(
              deployer.address,        // beneficiary
              now,                    // start time
              oneMonth,               // cliff duration
              oneYear,                // total duration
              60,                     // slice period seconds (60 seconds)
              true,                   // revocable
              scheduleAmount          // amount
            );
            console.log(`   Created vesting schedule using alternative method for ${deployer.address}`);
          } catch (altError) {
            console.warn(`   Warning: Failed to create schedule with alternative method:`, (altError as Error).message);
          }
        }
      } else {
        console.log(`   Skipping vesting schedule creation as deployer lacks admin rights on Vesting contract`);
      }
    } else {
      console.log(`   Vesting contract has no tokens. Skipping schedule creation.`);
    }
  } catch (error) {
    console.warn(`   Warning: Failed to create vesting schedule:`, (error as Error).message);
  }

  // Deploy CCLXBridge
  console.log("\n4. Deploying CCLXBridge...");
  let bridge;
  let bridgeAddress;
  try {
    const feeBps = 50; // 0.5%
    bridge = await deployContract("CCLXBridge", [
      deployer.address,  // admin
      feeBps,            // fee in basis points
      treasuryAddress    // fee collector
    ]);
    bridgeAddress = await bridge.getAddress();
    console.log(`CCLXBridge deployed to: ${bridgeAddress}`);
    
    // Skip initialization as it's already done in the constructor or deployContract function
    console.log("   Bridge initialized during deployment");
  } catch (error) {
    console.error(`Error deploying CCLXBridge:`, (error as Error).message);
    bridge = undefined;
    bridgeAddress = undefined;
  }

  // Grant roles if needed
  console.log("\n5. Setting up roles...");
  
  // Check if token has DEFAULT_ADMIN_ROLE
  try {
    const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
    const hasAdminRole = await token.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    console.log(`   Deployer ${hasAdminRole ? 'has' : 'does not have'} DEFAULT_ADMIN_ROLE on token`);
    
    // Check if bridge was deployed successfully
    if (typeof bridge !== 'undefined') {
      try {
        // Try to grant MINTER_ROLE to bridge if token supports it
        if (hasAdminRole) {
          const MINTER_ROLE = await token.MINTER_ROLE();
          await token.grantRole(MINTER_ROLE, bridgeAddress);
          console.log(`   Granted MINTER_ROLE to bridge at ${bridgeAddress}`);
        } else {
          console.log(`   Skipping MINTER_ROLE grant as deployer lacks admin rights`);
        }
      } catch (error) {
         console.warn(`   Warning: Failed to grant MINTER_ROLE to bridge:`, (error as Error).message);
      }
    } else {
      console.log(`   Bridge not deployed successfully. Skipping bridge role setup.`);
    }
    
    // Try to grant TREASURER_ROLE on treasury
    try {
      const treasuryAdminRole = await treasury.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
      if (treasuryAdminRole) {
        const TREASURER_ROLE = await treasury.TREASURER_ROLE();
        await treasury.grantRole(TREASURER_ROLE, deployer.address);
        console.log(`   Granted TREASURER_ROLE to ${deployer.address} on Treasury`);
      } else {
        console.log(`   Skipping TREASURER_ROLE grant as deployer lacks admin rights on Treasury`);
      }
    } catch (error) {
       console.warn(`   Warning: Failed to grant TREASURER_ROLE:`, (error as Error).message);
    }
  } catch (error) {
    console.warn(`   Warning: Error during role setup:`, (error as Error).message);
  }

  // Print summary
  console.log("\n=== Deployment Summary ===");
  console.log(`CCLXToken: ${tokenAddress || 'Failed to deploy'}`);
  console.log(`CCLXTreasury: ${treasuryAddress || 'Failed to deploy'}`);
  console.log(`CCLXVesting: ${vestingAddress || 'Failed to deploy'}`);
  console.log(`CCLXBridge: ${typeof bridge !== 'undefined' ? await bridge.getAddress() : 'Failed to deploy'}`);
  console.log("========================\n");
  
  console.log("Deployment completed with error handling. Some components may not have deployed successfully.");
  console.log("Check the logs above for any warnings or errors.");}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });