const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("HypeyVesting", function () {
  async function deployVestingFixture() {
    const [admin, manager, beneficiary1, beneficiary2, user1] = await ethers.getSigners();

    // Deploy mock timelock
    const MockTimelock = await ethers.getContractFactory("MockTimelock");
    const timelock = await upgrades.deployProxy(
      MockTimelock,
      [
        86400, // 1 day delay
        [admin.address], // proposers
        [admin.address], // executors
        admin.address // admin
      ],
      {
        initializer: "initialize",
        kind: "uups",
      }
    );
    await timelock.waitForDeployment();

    // Deploy mock token
    const MockToken = await ethers.getContractFactory("HYPEYToken");
    const token = await upgrades.deployProxy(
      MockToken,
      [admin.address, await timelock.getAddress(), admin.address], // reserveBurnAddress, timelockAddress, initialOwner
      {
        initializer: "initialize",
        kind: "uups",
      }
    );
    await token.waitForDeployment();

    // Deploy vesting contract
    const HypeyVesting = await ethers.getContractFactory("HypeyVesting");
    const vesting = await upgrades.deployProxy(
      HypeyVesting,
      [await token.getAddress(), admin.address, await timelock.getAddress()], // tokenAddress, _owner, timelockAddress
      {
        initializer: "initialize",
        kind: "uups",
      }
    );
    await vesting.waitForDeployment();

    // Transfer tokens to vesting contract using distributeInitialSupply
    const vestingAmount = 1000; // 1000 tokens (avoid large amounts to prevent burn issues)
    // Use distributeInitialSupply to directly send tokens to vesting contract
    await token.connect(admin).distributeInitialSupply(await vesting.getAddress(), vestingAmount);

    return {
      vesting,
      token,
      timelock,
      admin,
      manager,
      beneficiary1,
      beneficiary2,
      user1,
    };
  }

  describe("Deployment", function () {
    it("Should set the right admin", async function () {
      const { vesting, admin } = await loadFixture(deployVestingFixture);
      expect(await vesting.owner()).to.equal(admin.address);
    });

    it("Should set the right token address", async function () {
      const { vesting, token } = await loadFixture(deployVestingFixture);
      expect(await vesting.token()).to.equal(await token.getAddress());
    });

    it("Should not be paused initially", async function () {
      const { vesting } = await loadFixture(deployVestingFixture);
      expect(await vesting.paused()).to.be.false;
    });
  });

  describe("Owner Management", function () {
    it("Should allow owner to transfer ownership", async function () {
      const { vesting, admin, manager } = await loadFixture(deployVestingFixture);
      
      await vesting.connect(admin).transferOwnership(manager.address);
      expect(await vesting.owner()).to.equal(manager.address);
    });

    it("Should not allow non-owner to transfer ownership", async function () {
      const { vesting, manager, user1 } = await loadFixture(deployVestingFixture);
      
      await expect(vesting.connect(user1).transferOwnership(manager.address))
        .to.be.reverted;
    });
  });

  describe("Merkle Root Management", function () {
    it("Should allow vesting manager to set merkle root", async function () {
      const { vesting, admin } = await loadFixture(deployVestingFixture);
      const newRoot = ethers.keccak256(ethers.toUtf8Bytes("test"));
      
      await expect(vesting.connect(admin).setMerkleRoot(newRoot))
        .to.emit(vesting, "MerkleRootUpdated")
        .withArgs(newRoot);
      
      expect(await vesting.merkleRoot()).to.equal(newRoot);
    });

    it("Should not allow non-owner to set merkle root", async function () {
      const { vesting, user1 } = await loadFixture(deployVestingFixture);
      const newRoot = ethers.keccak256(ethers.toUtf8Bytes("test"));
      
      await expect(vesting.connect(user1).setMerkleRoot(newRoot))
        .to.be.reverted;
    });
  });

  describe("Vesting Schedule Creation", function () {
    it("Should allow owner to add vesting schedule", async function () {
      const { vesting, admin, beneficiary1 } = await loadFixture(deployVestingFixture);
      
      const totalAmount = 100; // 100 tokens (within available 1000)
      const start = (await time.latest()) + 60; // Add 60 seconds buffer
      const cliffDuration = 86400 * 30; // 30 days
      const duration = 86400 * 365; // 1 year
      const slicePeriodSeconds = 86400; // 1 day
      const cliffUnlockPercent = 25; // 25%
      
      await expect(vesting.connect(admin).addVestingSchedule(
        beneficiary1.address,
        totalAmount,
        start,
        cliffDuration,
        duration,
        slicePeriodSeconds,
        cliffUnlockPercent
      ))
        .to.emit(vesting, "VestingCreated")
        .withArgs(beneficiary1.address, 0, totalAmount)
        .and.to.emit(vesting, "VestingModified") // XSC4: New event
        .withArgs(beneficiary1.address, 0);
      
      const scheduleInfo = await vesting.getVestingInfo(beneficiary1.address);
      expect(scheduleInfo.schedules.length).to.equal(1);
      expect(scheduleInfo.schedules[0].totalAmount).to.equal(totalAmount);
      expect(scheduleInfo.schedules[0].cliffUnlockPercent).to.equal(cliffUnlockPercent);
    });

    // XSC3: Input validation tests
    it("Should reject zero address beneficiary (XSC3)", async function () {
      const { vesting, admin } = await loadFixture(deployVestingFixture);
      
      await expect(vesting.connect(admin).addVestingSchedule(
        ethers.ZeroAddress, // Zero address
        100,
        (await time.latest()) + 60, // Add 60 seconds buffer
        86400 * 30,
        86400 * 365,
        86400,
        25
      ))
        .to.be.revertedWith("HypeyVesting: Zero address");
    });

    it("Should reject zero amount (XSC3)", async function () {
      const { vesting, admin, beneficiary1 } = await loadFixture(deployVestingFixture);
      
      await expect(vesting.connect(admin).addVestingSchedule(
        beneficiary1.address,
        0, // Zero amount
        (await time.latest()) + 60, // Add 60 seconds buffer
        86400 * 30,
        86400 * 365,
        86400,
        25
      ))
        .to.be.revertedWith("HypeyVesting: Zero amount prohibited");
    });

    it("Should reject start time in past (XSC3)", async function () {
      const { vesting, admin, beneficiary1 } = await loadFixture(deployVestingFixture);
      const pastTime = (await time.latest()) - 86400; // 1 day ago
      
      await expect(vesting.connect(admin).addVestingSchedule(
        beneficiary1.address,
        100,
        pastTime, // Past time
        86400 * 30,
        86400 * 365,
        86400,
        25
      ))
        .to.be.revertedWith("HypeyVesting: Start in past");
    });

    it("Should reject cliff duration longer than total duration (XSC3)", async function () {
      const { vesting, admin, beneficiary1 } = await loadFixture(deployVestingFixture);
      
      await expect(vesting.connect(admin).addVestingSchedule(
        beneficiary1.address,
        100,
        (await time.latest()) + 60, // Add 60 seconds buffer
        86400 * 400, // Cliff longer than duration
        86400 * 365, // Total duration
        86400,
        25
      ))
        .to.be.revertedWith("HypeyVesting: Cliff > duration");
    });

    it("Should not allow invalid duration", async function () {
      const { vesting, admin, beneficiary1 } = await loadFixture(deployVestingFixture);
      
      await expect(vesting.connect(admin).addVestingSchedule(
        beneficiary1.address,
        100, // 100 tokens
        (await time.latest()) + 60, // Add 60 seconds buffer
        0, // No cliff
        0, // Invalid duration
        86400,
        25
      ))
        .to.be.revertedWith("HypeyVesting: Invalid duration");
    });

    it("Should not allow invalid cliff unlock percentage", async function () {
      const { vesting, admin, beneficiary1 } = await loadFixture(deployVestingFixture);
      
      await expect(vesting.connect(admin).addVestingSchedule(
        beneficiary1.address,
        100, // 100 tokens
        (await time.latest()) + 60, // Add 60 seconds buffer
        86400 * 30,
        86400 * 365,
        86400,
        150 // Invalid cliff percent > 100
      ))
        .to.be.revertedWith("HypeyVesting: Invalid %");
    });

    it("Should not allow non-owner to add vesting schedule", async function () {
      const { vesting, user1, beneficiary1 } = await loadFixture(deployVestingFixture);
      
      await expect(vesting.connect(user1).addVestingSchedule(
        beneficiary1.address,
        100, // 100 tokens
        (await time.latest()) + 60, // Add 60 seconds buffer
        86400 * 30,
        86400 * 365,
        86400,
        25
      ))
        .to.be.reverted;
    });
  });

  // XSC4: Test emergency action events
  describe("Emergency Actions (XSC4)", function () {
    it("Should emit EmergencyAction event when pausing", async function () {
      const { vesting, admin } = await loadFixture(deployVestingFixture);
      
      await expect(vesting.connect(admin).pause())
        .to.emit(vesting, "EmergencyAction")
        .withArgs("pause", admin.address);
      
      expect(await vesting.paused()).to.be.true;
    });

    it("Should emit EmergencyAction event when unpausing", async function () {
      const { vesting, admin } = await loadFixture(deployVestingFixture);
      
      // First pause
      await vesting.connect(admin).pause();
      
      // Then unpause
      await expect(vesting.connect(admin).unpause())
        .to.emit(vesting, "EmergencyAction")
        .withArgs("unpause", admin.address);
      
      expect(await vesting.paused()).to.be.false;
    });

    it("Should not allow non-admin to pause", async function () {
      const { vesting, user1 } = await loadFixture(deployVestingFixture);
      
      await expect(vesting.connect(user1).pause())
        .to.be.reverted;
    });

    it("Should not allow non-admin to unpause", async function () {
      const { vesting, admin, user1 } = await loadFixture(deployVestingFixture);
      
      // Admin pauses first
      await vesting.connect(admin).pause();
      
      // User1 cannot unpause
      await expect(vesting.connect(user1).unpause())
        .to.be.reverted;
    });
  });

  describe("Vesting Calculations", function () {
    it("Should return 0 before cliff", async function () {
      const { vesting, admin, beneficiary1 } = await loadFixture(deployVestingFixture);
      
      const totalAmount = 100; // 100 tokens
      const start = (await time.latest()) + 60; // Add 60 seconds buffer
      const cliffDuration = 86400 * 30; // 30 days
      
      await vesting.connect(admin).addVestingSchedule(
        beneficiary1.address,
        totalAmount,
        start,
        cliffDuration,
        86400 * 365,
        86400,
        25
      );
      
      const scheduleInfo = await vesting.getVestingInfo(beneficiary1.address);
      expect(scheduleInfo.releasable[0]).to.equal(0);
    });

    it("Should unlock cliff amount after cliff period", async function () {
      const { vesting, admin, beneficiary1 } = await loadFixture(deployVestingFixture);
      
      const totalAmount = 100; // 100 tokens
      const start = (await time.latest()) + 60; // Add 60 seconds buffer
      const cliffDuration = 86400 * 30; // 30 days
      const cliffUnlockPercent = 25; // 25%
      
      await vesting.connect(admin).addVestingSchedule(
        beneficiary1.address,
        totalAmount,
        start,
        cliffDuration,
        86400 * 365,
        86400,
        cliffUnlockPercent
      );
      
      // Fast forward to start time first, then past cliff
      await time.increaseTo(start);
      await time.increase(cliffDuration + 1);
      
      const scheduleInfo = await vesting.getVestingInfo(beneficiary1.address);
      const expectedCliffAmount = (BigInt(totalAmount) * BigInt(cliffUnlockPercent)) / 100n;
      expect(scheduleInfo.releasable[0]).to.be.closeTo(expectedCliffAmount, 10); // Allow 10 token tolerance for cliff + some vesting
    });

    it("Should calculate linear vesting correctly", async function () {
      const { vesting, admin, beneficiary1 } = await loadFixture(deployVestingFixture);
      
      const totalAmount = 100; // 100 tokens
      const start = (await time.latest()) + 60; // Add 60 seconds buffer
      const cliffDuration = 0; // No cliff
      const duration = 86400 * 100; // 100 days
      const slicePeriodSeconds = 86400; // 1 day
      
      await vesting.connect(admin).addVestingSchedule(
        beneficiary1.address,
        totalAmount,
        start,
        cliffDuration,
        duration,
        slicePeriodSeconds,
        0 // No cliff unlock
      );
      
      // Fast forward 50 days (50% of duration)
      await time.increase(86400 * 50);
      
      const scheduleInfo = await vesting.getVestingInfo(beneficiary1.address);
      const expectedAmount = BigInt(totalAmount) / 2n; // 50% should be vested
      expect(scheduleInfo.releasable[0]).to.be.closeTo(expectedAmount, 5); // Allow 5 token tolerance
    });

    it("Should return full amount after vesting period", async function () {
      const { vesting, admin, beneficiary1 } = await loadFixture(deployVestingFixture);
      
      const totalAmount = 100; // 100 tokens
      const start = (await time.latest()) + 60; // Add 60 seconds buffer
      const duration = 86400 * 100; // 100 days
      
      await vesting.connect(admin).addVestingSchedule(
        beneficiary1.address,
        totalAmount,
        start,
        0,
        duration,
        86400,
        0
      );
      
      // Fast forward to start time first, then past vesting period
      await time.increaseTo(start);
      await time.increase(duration + 1);
      
      const scheduleInfo = await vesting.getVestingInfo(beneficiary1.address);
      expect(scheduleInfo.releasable[0]).to.equal(totalAmount);
    });
  });

  describe("Token Claiming", function () {
    it("Should allow beneficiary to claim vested tokens", async function () {
      const { vesting, admin, beneficiary1, token } = await loadFixture(deployVestingFixture);
      
      const totalAmount = 100; // 100 tokens
      const start = (await time.latest()) + 60; // Add 60 seconds buffer
      const cliffDuration = 86400 * 30;
      const cliffUnlockPercent = 25;
      
      await vesting.connect(admin).addVestingSchedule(
        beneficiary1.address,
        totalAmount,
        start,
        cliffDuration,
        86400 * 365,
        86400,
        cliffUnlockPercent
      );
      
      // Fast forward to start time first, then past cliff
      await time.increaseTo(start);
      await time.increase(cliffDuration + 1);
      
      const initialBalance = await token.balanceOf(beneficiary1.address);
      
      await expect(vesting.connect(beneficiary1).claim(0))
        .to.emit(vesting, "TokensClaimed");
      
      const finalBalance = await token.balanceOf(beneficiary1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should allow claiming for another address", async function () {
      const { vesting, admin, beneficiary1, user1, token } = await loadFixture(deployVestingFixture);
      
      const totalAmount = 100; // 100 tokens
      const start = (await time.latest()) + 60; // Add 60 seconds buffer
      const cliffDuration = 86400 * 30;
      
      await vesting.connect(admin).addVestingSchedule(
        beneficiary1.address,
        totalAmount,
        start,
        cliffDuration,
        86400 * 365,
        86400,
        25
      );
      
      // Fast forward to start time first, then past cliff
      await time.increaseTo(start);
      await time.increase(cliffDuration + 1);
      
      const initialBalance = await token.balanceOf(beneficiary1.address);
      
      // User1 claims for beneficiary1
      await expect(vesting.connect(user1).claimFor(beneficiary1.address, 0))
        .to.emit(vesting, "TokensClaimed");
      
      const finalBalance = await token.balanceOf(beneficiary1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should not allow claiming when nothing is vested", async function () {
      const { vesting, admin, beneficiary1 } = await loadFixture(deployVestingFixture);
      
      const totalAmount = 100; // 100 tokens
      const start = (await time.latest()) + 60; // Add 60 seconds buffer
      const cliffDuration = 86400 * 30;
      
      await vesting.connect(admin).addVestingSchedule(
        beneficiary1.address,
        totalAmount,
        start,
        cliffDuration,
        86400 * 365,
        86400,
        25
      );
      
      // Don't fast forward - still before cliff
      await expect(vesting.connect(beneficiary1).claim(0))
        .to.be.revertedWith("No tokens available for claim");
    });

    it("Should not allow claiming invalid schedule index", async function () {
      const { vesting, beneficiary1 } = await loadFixture(deployVestingFixture);
      
      await expect(vesting.connect(beneficiary1).claim(0))
        .to.be.revertedWith("Invalid vesting schedule index");
    });

    it("Should not allow claiming when paused", async function () {
      const { vesting, admin, beneficiary1 } = await loadFixture(deployVestingFixture);
      
      const totalAmount = 100; // 100 tokens
      const start = (await time.latest()) + 60; // Add 60 seconds buffer
      
      await vesting.connect(admin).addVestingSchedule(
        beneficiary1.address,
        totalAmount,
        start,
        0,
        86400 * 365,
        86400,
        25
      );
      
      await time.increase(86400 * 30);
      await vesting.connect(admin).pause();
      
      await expect(vesting.connect(beneficiary1).claim(0))
        .to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Pool Management", function () {
    it("Should return correct pool balance", async function () {
      const { vesting, token } = await loadFixture(deployVestingFixture);
      
      const expectedBalance = 1000; // 1000 tokens
      expect(await vesting.getPoolBalance()).to.equal(expectedBalance);
    });

    it("Should allow token deposits", async function () {
      const { vesting, token, admin, user1 } = await loadFixture(deployVestingFixture);
      
      const depositAmount = 100; // 100 tokens
      await token.connect(admin).distributeInitialSupply(user1.address, depositAmount);
      await token.connect(user1).approve(await vesting.getAddress(), depositAmount);
      
      await expect(vesting.connect(user1).depositTokens(depositAmount))
        .to.emit(vesting, "TokensDeposited")
        .withArgs(user1.address, depositAmount);
    });

    it("Should allow admin to withdraw tokens", async function () {
      const { vesting, admin, token } = await loadFixture(deployVestingFixture);
      
      const withdrawAmount = 100; // 100 tokens
      const initialBalance = await token.balanceOf(admin.address);
      
      await expect(vesting.connect(admin).adminWithdraw(admin.address, withdrawAmount))
        .to.emit(vesting, "AdminWithdraw")
        .withArgs(admin.address, withdrawAmount);
      
      const finalBalance = await token.balanceOf(admin.address);
      expect(finalBalance).to.equal(initialBalance + BigInt(withdrawAmount));
    });

    it("Should not allow non-admin to withdraw tokens", async function () {
      const { vesting, user1 } = await loadFixture(deployVestingFixture);
      
      await expect(vesting.connect(user1).adminWithdraw(user1.address, 100))
        .to.be.reverted;
    });

    it("Should not allow withdrawal of more than pool balance", async function () {
      const { vesting, admin } = await loadFixture(deployVestingFixture);
      
      const excessiveAmount = 2000; // More than pool balance (1000)
      
      await expect(vesting.connect(admin).adminWithdraw(admin.address, excessiveAmount))
        .to.be.revertedWith("Insufficient pool balance");
    });
  });

  describe("User Status Queries", function () {
    it("Should return correct total locked amount", async function () {
      const { vesting, admin, beneficiary1 } = await loadFixture(deployVestingFixture);
      
      const totalAmount1 = 100; // 100 tokens
      const totalAmount2 = 50; // 50 tokens
      const start = (await time.latest()) + 60; // Add 60 seconds buffer
      
      // Add two vesting schedules
      await vesting.connect(admin).addVestingSchedule(
        beneficiary1.address,
        totalAmount1,
        start,
        0,
        86400 * 365,
        86400,
        0
      );
      
      await vesting.connect(admin).addVestingSchedule(
        beneficiary1.address,
        totalAmount2,
        start,
        0,
        86400 * 365,
        86400,
        0
      );
      
      const totalLocked = await vesting.getTotalLocked(beneficiary1.address);
      expect(totalLocked).to.equal(totalAmount1 + totalAmount2);
    });

    it("Should return correct user pool status", async function () {
      const { vesting, admin, beneficiary1 } = await loadFixture(deployVestingFixture);
      
      const totalAmount = 100; // 100 tokens
      const start = (await time.latest()) + 60; // Add 60 seconds buffer
      
      await vesting.connect(admin).addVestingSchedule(
        beneficiary1.address,
        totalAmount,
        start,
        0,
        86400 * 365,
        86400,
        0
      );
      
      const status = await vesting.getUserPoolStatus(beneficiary1.address);
      expect(status.poolBalance).to.equal(1000); // 1000 tokens
      expect(status.totalLocked).to.equal(totalAmount);
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow admin to pause and unpause", async function () {
      const { vesting, admin } = await loadFixture(deployVestingFixture);
      
      await vesting.connect(admin).pause();
      expect(await vesting.paused()).to.be.true;
      
      await vesting.connect(admin).unpause();
      expect(await vesting.paused()).to.be.false;
    });

    it("Should not allow non-admin to pause", async function () {
      const { vesting, user1 } = await loadFixture(deployVestingFixture);
      
      await expect(vesting.connect(user1).pause())
        .to.be.reverted;
    });
  });

  describe("Builder Function", function () {
    it("Should return correct builder name", async function () {
      const { vesting } = await loadFixture(deployVestingFixture);
      expect(await vesting.builder()).to.equal("TOPAY DEV TEAM");
    });
  });

  describe("Multiple Schedules", function () {
    it("Should handle multiple vesting schedules for same beneficiary", async function () {
      const { vesting, admin, beneficiary1 } = await loadFixture(deployVestingFixture);
      
      const start = (await time.latest()) + 60; // Add 60 seconds buffer
      
      // Add multiple schedules
      await vesting.connect(admin).addVestingSchedule(
        beneficiary1.address,
        100, // 100 tokens
        start,
        0,
        86400 * 365,
        86400,
        25
      );
      
      await vesting.connect(admin).addVestingSchedule(
        beneficiary1.address,
        50, // 50 tokens
        start,
        86400 * 60, // Different cliff
        86400 * 365,
        86400,
        50
      );
      
      const scheduleInfo = await vesting.getVestingInfo(beneficiary1.address);
      expect(scheduleInfo.schedules.length).to.equal(2);
      expect(scheduleInfo.schedules[0].totalAmount).to.equal(100);
      expect(scheduleInfo.schedules[1].totalAmount).to.equal(50);
    });
  });
});