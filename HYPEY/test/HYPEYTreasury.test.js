const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("HYPEYTreasury", function () {
  async function deployTreasuryFixture() {
    const [admin, manager, user1, user2] = await ethers.getSigners();

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

    // Deploy a mock ERC20 token for testing
    const MockToken = await ethers.getContractFactory("HYPEYToken");
    const mockToken = await upgrades.deployProxy(
      MockToken,
      [admin.address], // reserve burn address
      {
        initializer: "initialize",
        kind: "uups",
      }
    );
    await mockToken.waitForDeployment();
    await mockToken.initializeOwner(admin.address);

    // Deploy Treasury
    const HYPEYTreasury = await ethers.getContractFactory("HYPEYTreasury");
    const treasury = await upgrades.deployProxy(
      HYPEYTreasury,
      [admin.address, await timelock.getAddress()],
      {
        initializer: "initialize",
        kind: "uups",
      }
    );
    await treasury.waitForDeployment();

    return {
      treasury,
      mockToken,
      timelock,
      admin,
      manager,
      user1,
      user2,
    };
  }

  describe("Deployment", function () {
    it("Should set the right admin role", async function () {
      const { treasury, admin } = await loadFixture(deployTreasuryFixture);
      const MULTISIG_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MULTISIG_ADMIN_ROLE"));
      expect(await treasury.hasRole(MULTISIG_ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("Should not be paused initially", async function () {
      const { treasury } = await loadFixture(deployTreasuryFixture);
      expect(await treasury.paused()).to.be.false;
    });
  });

  describe("Role Management", function () {
    it("Should have the correct admin role", async function () {
      const { treasury, admin } = await loadFixture(deployTreasuryFixture);
      const MULTISIG_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MULTISIG_ADMIN_ROLE"));
      expect(await treasury.hasRole(MULTISIG_ADMIN_ROLE, admin.address)).to.be.true;
    });

    it("Should allow admin to grant roles", async function () {
      const { treasury, admin, manager } = await loadFixture(deployTreasuryFixture);
      const MULTISIG_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MULTISIG_ADMIN_ROLE"));
      
      await treasury.connect(admin).grantRole(MULTISIG_ADMIN_ROLE, manager.address);
      expect(await treasury.hasRole(MULTISIG_ADMIN_ROLE, manager.address)).to.be.true;
    });

    it("Should not allow non-admin to grant roles", async function () {
      const { treasury, manager, user1 } = await loadFixture(deployTreasuryFixture);
      const MULTISIG_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MULTISIG_ADMIN_ROLE"));
      
      await expect(treasury.connect(user1).grantRole(MULTISIG_ADMIN_ROLE, manager.address))
        .to.be.reverted;
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow admin to pause", async function () {
      const { treasury, admin } = await loadFixture(deployTreasuryFixture);
      
      await treasury.connect(admin).pause();
      expect(await treasury.paused()).to.be.true;
    });

    it("Should allow admin to unpause", async function () {
      const { treasury, admin } = await loadFixture(deployTreasuryFixture);
      
      await treasury.connect(admin).pause();
      await treasury.connect(admin).unpause();
      expect(await treasury.paused()).to.be.false;
    });

    it("Should not allow non-owner to pause", async function () {
      const { treasury, user1 } = await loadFixture(deployTreasuryFixture);
      
      await expect(treasury.connect(user1).pause())
        .to.be.reverted;
    });
  });

  describe("Token Deposits", function () {
    it("Should allow anyone to deposit tokens", async function () {
      const { treasury, mockToken, admin, user1 } = await loadFixture(deployTreasuryFixture);
      const amount = ethers.parseEther("1000");
      // Add mock token as supported
      await treasury.connect(admin).addSupportedToken(await mockToken.getAddress());
      // Transfer tokens to user1 and approve treasury
      // Give extra tokens to cover burn amount
      const transferAmount = ethers.parseEther("2000");
      await mockToken.connect(admin).distributeInitialSupply(user1.address, transferAmount);
      await mockToken.connect(user1).approve(await treasury.getAddress(), amount);
      const treasuryAddress = await treasury.getAddress();
      const initialBalance = await mockToken.balanceOf(treasuryAddress);
      await expect(treasury.connect(user1).depositToken(await mockToken.getAddress(), amount))
        .to.emit(treasury, "TokensDeposited")
        .withArgs(await mockToken.getAddress(), user1.address, amount);
      // Account for burn during transfer
      const burnRate = await mockToken.burnRateBasisPoints();
      const burnAmount = (amount * burnRate) / 10000n;
      const receivedAmount = amount - burnAmount;
      expect(await mockToken.balanceOf(treasuryAddress)).to.equal(initialBalance + receivedAmount);
    });

    it("Should revert if token is not supported", async function () {
      const { treasury, mockToken, admin, user1 } = await loadFixture(deployTreasuryFixture);
      const amount = ethers.parseEther("1000");
      
      // Transfer tokens to user1 and approve treasury
      const transferAmount = ethers.parseEther("2000");
      await mockToken.connect(admin).distributeInitialSupply(user1.address, transferAmount);
      await mockToken.connect(user1).approve(await treasury.getAddress(), amount);
      
      await expect(treasury.connect(user1).depositToken(await mockToken.getAddress(), amount))
        .to.be.revertedWith("Token not supported");
    });

    it("Should revert if user hasn't approved tokens", async function () {
      const { treasury, mockToken, admin, user1 } = await loadFixture(deployTreasuryFixture);
      const amount = ethers.parseEther("1000");
      
      // Add mock token as supported
      await treasury.connect(admin).addSupportedToken(await mockToken.getAddress());
      
      const transferAmount = ethers.parseEther("2000");
      await mockToken.connect(admin).distributeInitialSupply(user1.address, transferAmount);
      // Don't approve
      
      await expect(treasury.connect(user1).depositToken(await mockToken.getAddress(), amount))
        .to.be.reverted;
    });
  });

  describe("ETH Deposits", function () {
    it("Should accept ETH deposits via receive", async function () {
      const { treasury, user1 } = await loadFixture(deployTreasuryFixture);
      const amount = ethers.parseEther("1");
      
      await expect(user1.sendTransaction({
        to: await treasury.getAddress(),
        value: amount
      }))
        .to.emit(treasury, "ETHDeposited")
        .withArgs(user1.address, amount);
      
      expect(await ethers.provider.getBalance(await treasury.getAddress())).to.equal(amount);
    });

    it("Should accept ETH deposits via fallback", async function () {
      const { treasury, user1 } = await loadFixture(deployTreasuryFixture);
      const amount = ethers.parseEther("1");
      
      await expect(user1.sendTransaction({
        to: await treasury.getAddress(),
        value: amount,
        data: "0x1234" // Trigger fallback
      }))
        .to.emit(treasury, "ETHDeposited")
        .withArgs(user1.address, amount);
      
      expect(await ethers.provider.getBalance(await treasury.getAddress())).to.equal(amount);
    });
  });

  describe("Token Disbursements", function () {
    it("Should allow owner to disburse tokens", async function () {
      const { treasury, mockToken, admin, user1 } = await loadFixture(deployTreasuryFixture);
      const amount = ethers.parseEther("1000");
      // Add mock token as supported
      await treasury.connect(admin).addSupportedToken(await mockToken.getAddress());
      // Deposit tokens to treasury (direct transfer)
      await mockToken.connect(admin).distributeInitialSupply(await treasury.getAddress(), amount);
      const initialBalance = await mockToken.balanceOf(user1.address);
      await expect(treasury.connect(admin).disburseToken(
        await mockToken.getAddress(),
        user1.address,
        amount
      ))
        .to.emit(treasury, "TokensWithdrawn")
        .withArgs(await mockToken.getAddress(), user1.address, amount);
      // Account for burn during transfer
      const burnRate = await mockToken.burnRateBasisPoints();
      const burnAmount = (amount * burnRate) / 10000n;
      const receivedAmount = amount - burnAmount;
      expect(await mockToken.balanceOf(user1.address)).to.equal(initialBalance + receivedAmount);
    });

    it("Should not allow non-owner to disburse tokens", async function () {
      const { treasury, mockToken, admin, user1, user2 } = await loadFixture(deployTreasuryFixture);
      const amount = ethers.parseEther("1000");
      
      // Add mock token as supported
      await treasury.connect(admin).addSupportedToken(await mockToken.getAddress());
      
      await expect(treasury.connect(user1).disburseToken(
        await mockToken.getAddress(),
        user2.address,
        amount
      ))
        .to.be.reverted;
    });

    it("Should not allow disbursement to zero address", async function () {
      const { treasury, mockToken, admin } = await loadFixture(deployTreasuryFixture);
      const amount = ethers.parseEther("1000");
      
      // Add mock token as supported
      await treasury.connect(admin).addSupportedToken(await mockToken.getAddress());
      
      await expect(treasury.connect(admin).disburseToken(
        await mockToken.getAddress(),
        ethers.ZeroAddress,
        amount
      ))
        .to.be.revertedWith("Invalid recipient address");
    });

    it("Should not allow disbursement when paused", async function () {
      const { treasury, mockToken, admin, user1 } = await loadFixture(deployTreasuryFixture);
      const amount = ethers.parseEther("1000");
      
      // Add mock token as supported
      await treasury.connect(admin).addSupportedToken(await mockToken.getAddress());
      
      await treasury.connect(admin).pause();
      
      await expect(treasury.connect(admin).disburseToken(
        await mockToken.getAddress(),
        user1.address,
        amount
      ))
        .to.be.reverted;
    });
  });

  describe("ETH Disbursements", function () {
    it("Should allow owner to disburse ETH", async function () {
      const { treasury, admin, user1 } = await loadFixture(deployTreasuryFixture);
      const amount = ethers.parseEther("1");
      
      // Send ETH to treasury
      await admin.sendTransaction({
        to: await treasury.getAddress(),
        value: amount
      });
      
      const initialBalance = await ethers.provider.getBalance(user1.address);
      
      await expect(treasury.connect(admin).disburseETH(user1.address, amount))
        .to.emit(treasury, "ETHWithdrawn")
        .withArgs(user1.address, amount);
      
      expect(await ethers.provider.getBalance(user1.address)).to.equal(initialBalance + amount);
    });

    it("Should not allow non-owner to disburse ETH", async function () {
      const { treasury, user1, user2 } = await loadFixture(deployTreasuryFixture);
      const amount = ethers.parseEther("1");
      
      await expect(treasury.connect(user1).disburseETH(user2.address, amount))
        .to.be.reverted;
    });

    it("Should not allow ETH disbursement to zero address", async function () {
      const { treasury, admin } = await loadFixture(deployTreasuryFixture);
      
      await expect(treasury.connect(admin).disburseETH(ethers.ZeroAddress, ethers.parseEther("1")))
        .to.be.revertedWith("Invalid recipient address");
    });

    it("Should not allow ETH disbursement when insufficient balance", async function () {
      const { treasury, admin, user1 } = await loadFixture(deployTreasuryFixture);
      const amount = ethers.parseEther("1");
      
      await expect(treasury.connect(admin).disburseETH(user1.address, amount))
        .to.be.revertedWith("Insufficient ETH balance");
    });

    it("Should not allow ETH disbursement when paused", async function () {
      const { treasury, admin, user2 } = await loadFixture(deployTreasuryFixture);
      const amount = ethers.parseEther("1");
      
      await treasury.connect(admin).pause();
      
      await expect(treasury.connect(admin).disburseETH(user2.address, amount))
          .to.be.reverted;
    });
  });

  describe("Balance Queries", function () {
    it("Should return correct ERC20 balance", async function () {
      const { treasury, mockToken, admin } = await loadFixture(deployTreasuryFixture);
      const amount = ethers.parseEther("1000");
      
      // Set burn rate to 0 temporarily to avoid burn during transfer
      await mockToken.connect(admin).setBurnRate(0);
      // First transfer tokens from contract to admin (tokens are initially minted to contract)
      await mockToken.connect(admin).distributeInitialSupply(admin.address, amount);
      // Direct transfer to treasury (bypassing burn mechanism)
      await mockToken.connect(admin).transfer(await treasury.getAddress(), amount);
      // Reset burn rate
      await mockToken.connect(admin).setBurnRate(100);
      
      expect(await treasury.getERC20Balance(await mockToken.getAddress())).to.equal(amount);
    });

    it("Should return correct ETH balance", async function () {
      const { treasury, admin } = await loadFixture(deployTreasuryFixture);
      const amount = ethers.parseEther("1");
      
      await admin.sendTransaction({
        to: await treasury.getAddress(),
        value: amount
      });
      
      expect(await ethers.provider.getBalance(await treasury.getAddress())).to.equal(amount);
    });
  });

  describe("Upgrade Functionality", function () {
    it("Should require timelock for upgrades", async function () {
      const { treasury, admin } = await loadFixture(deployTreasuryFixture);
      
      // Deploy new implementation
      const HYPEYTreasuryV2 = await ethers.getContractFactory("HYPEYTreasury");
      const newImplementation = await HYPEYTreasuryV2.deploy();
      await newImplementation.waitForDeployment();
      
      // This should revert because upgrades require timelock authorization
      await expect(treasury.connect(admin).upgradeToAndCall(
        await newImplementation.getAddress(),
        "0x"
      )).to.be.revertedWith("Upgrade only via timelock");
    });

    it("Should not allow non-owner to authorize upgrades", async function () {
      const { treasury, user1 } = await loadFixture(deployTreasuryFixture);
      
      // Deploy new implementation
      const HYPEYTreasuryV2 = await ethers.getContractFactory("HYPEYTreasury");
      const newImplementation = await HYPEYTreasuryV2.deploy();
      await newImplementation.waitForDeployment();
      
      await expect(treasury.connect(user1).upgradeToAndCall(
        await newImplementation.getAddress(),
        "0x"
      ))
        .to.be.reverted;
    });
  });
});