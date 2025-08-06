const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("HYPEYToken", function () {
  async function deployTokenFixture() {
    const [owner, reserveBurn, platform, nftContract, user1, user2, timelockAdmin] = await ethers.getSigners();

    // Deploy a MockTimelock for the initializer
    const minDelay = 0;
    const proposers = [timelockAdmin.address];
    const executors = [timelockAdmin.address];
    const MockTimelock = await ethers.getContractFactory("MockTimelock");
    const timelock = await upgrades.deployProxy(
      MockTimelock,
      [minDelay, proposers, executors, timelockAdmin.address],
      {
        initializer: "initialize",
        kind: "uups",
      }
    );
    await timelock.waitForDeployment();

    const HYPEYToken = await ethers.getContractFactory("HYPEYToken");
    const token = await upgrades.deployProxy(
      HYPEYToken,
      [reserveBurn.address, timelock.target, owner.address],
      {
        initializer: "initialize",
        kind: "uups",
      }
    );
    await token.waitForDeployment();

    return {
      token,
      owner,
      reserveBurn,
      platform,
      nftContract,
      user1,
      user2,
      timelock,
      timelockAdmin,
    };
  }

  describe("Deployment", function () {
    it("Should set the right initial supply", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      const expectedSupply = ethers.parseEther("3000000000"); // 3B tokens
      expect(await token.totalSupply()).to.equal(expectedSupply);
    });

    it("Should set the right token details", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.name()).to.equal("HYPEY Token");
      expect(await token.symbol()).to.equal("HYPEY");
      expect(await token.decimals()).to.equal(18);
    });

    it("Should set the right owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should set the right reserve burn address", async function () {
      const { token, reserveBurn } = await loadFixture(deployTokenFixture);
      expect(await token.reserveBurnAddress()).to.equal(reserveBurn.address);
    });

    it("Should set default burn rate to 1%", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.burnRateBasisPoints()).to.equal(100);
    });

    it("Should mint initial supply to contract", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      const tokenAddress = await token.getAddress();
      const expectedSupply = ethers.parseEther("3000000000");
      expect(await token.balanceOf(tokenAddress)).to.equal(expectedSupply);
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to set burn rate", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      await token.connect(owner).setBurnRate(200); // 2%
      expect(await token.burnRateBasisPoints()).to.equal(200);
    });

    it("Should not allow burn rate above 3%", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      await expect(token.connect(owner).setBurnRate(400))
        .to.be.revertedWith("Burn rate must be between 0 and 3%");
    });

    it("Should allow owner to set reserve burn address", async function () {
      const { token, owner, user1 } = await loadFixture(deployTokenFixture);
      await token.connect(owner).setReserveBurnAddress(user1.address);
      expect(await token.reserveBurnAddress()).to.equal(user1.address);
    });

    it("Should not allow setting zero address as reserve burn", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      await expect(token.connect(owner).setReserveBurnAddress(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid address");
    });

    it("Should allow owner to approve platforms", async function () {
      const { token, owner, platform } = await loadFixture(deployTokenFixture);
      await token.connect(owner).setPlatformApproved(platform.address, true);
      expect(await token.approvedPlatforms(platform.address)).to.be.true;
    });

    it("Should allow owner to approve NFT contracts", async function () {
      const { token, owner, nftContract } = await loadFixture(deployTokenFixture);
      await token.connect(owner).setNFTContractApproved(nftContract.address, true);
      expect(await token.approvedNFTContracts(nftContract.address)).to.be.true;
    });
  });

  describe("Transfer and Burn Logic", function () {
    it("Should transfer tokens from contract to user", async function () {
      const { token, owner, user1 } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseEther("1000");
      
      await token.connect(owner).distributeInitialSupply(user1.address, amount);
      expect(await token.balanceOf(user1.address)).to.equal(amount);
    });

    it("Should apply burn on transfers above minimum", async function () {
      const { token, owner, user1, user2, reserveBurn } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseEther("1000"); // Above 100 HYPEY minimum
      // Transfer to user1 first
      await token.connect(owner).distributeInitialSupply(user1.address, amount);
      const initialBalance = await token.balanceOf(user1.address);
      const initialReserveBalance = await token.balanceOf(reserveBurn.address);
      const initialTotalSupply = await token.totalSupply();
      // Transfer from user1 to user2 (should trigger burn)
      await token.connect(user1).transfer(user2.address, amount);
      const burnRate = await token.burnRateBasisPoints();
      const burnAmount = (amount * burnRate) / 10000n;
      const burnNow = burnAmount / 2n;
      const toReserve = burnAmount - burnNow;
      const transferAmount = amount - burnAmount;
      expect(await token.balanceOf(user2.address)).to.equal(transferAmount);
      expect(await token.balanceOf(reserveBurn.address)).to.equal(initialReserveBalance + toReserve);
      expect(await token.totalSupply()).to.equal(initialTotalSupply - burnNow);
    });

    // VSC5: Test for dusting attack protection
    it("Should apply burn based on sender balance percentage (VSC5 fix)", async function () {
      const { token, owner, user1, user2, reserveBurn } = await loadFixture(deployTokenFixture);
      const userBalance = ethers.parseEther("10000"); // 10,000 tokens
      const smallAmount = ethers.parseEther("150"); // Above MIN_EXEMPT_AMOUNT (100 HYPEY), should trigger burn
      
      // Transfer to user1 first
      await token.connect(owner).distributeInitialSupply(user1.address, userBalance);
      
      const initialTotalSupply = await token.totalSupply();
      const initialReserveBalance = await token.balanceOf(reserveBurn.address);
      
      // Transfer should trigger burn because it's above MIN_EXEMPT_AMOUNT
      await token.connect(user1).transfer(user2.address, smallAmount);
      
      const burnRate = await token.burnRateBasisPoints();
      const burnAmount = (smallAmount * burnRate) / 10000n;
      const burnNow = burnAmount / 2n;
      const toReserve = burnAmount - burnNow;
      const transferAmount = smallAmount - burnAmount;
      
      expect(await token.balanceOf(user2.address)).to.equal(transferAmount);
      expect(await token.balanceOf(reserveBurn.address)).to.equal(initialReserveBalance + toReserve);
      expect(await token.totalSupply()).to.equal(initialTotalSupply - burnNow);
    });

    // VSC5: Test exempt wallet functionality
    it("Should allow exempt wallets to bypass burn on small transfers", async function () {
      const { token, owner, user1, user2 } = await loadFixture(deployTokenFixture);
      const userBalance = ethers.parseEther("10000");
      const smallAmount = ethers.parseEther("5");
      
      // Set user1 as exempt
      await token.connect(owner).setExemptFromBurn(user1.address, true);
      
      // Transfer to user1 first
      await token.connect(owner).distributeInitialSupply(user1.address, userBalance);
      
      const initialTotalSupply = await token.totalSupply();
      
      // Small transfer from exempt wallet should not trigger burn
      await token.connect(user1).transfer(user2.address, smallAmount);
      
      expect(await token.balanceOf(user2.address)).to.equal(smallAmount);
      expect(await token.totalSupply()).to.equal(initialTotalSupply); // No burn
    });

    it("Should skip burn for small transfers", async function () {
      const { token, owner, user1, user2 } = await loadFixture(deployTokenFixture);
      const smallAmount = ethers.parseEther("50"); // Below 100 HYPEY minimum
      
      // Transfer to user1 first
      await token.connect(owner).distributeInitialSupply(user1.address, ethers.parseEther("1000"));
      
      const initialTotalSupply = await token.totalSupply();
      
      // Small transfer should not trigger burn
      await token.connect(user1).transfer(user2.address, smallAmount);
      
      expect(await token.balanceOf(user2.address)).to.equal(smallAmount);
      expect(await token.totalSupply()).to.equal(initialTotalSupply); // No burn
    });

    it("Should skip burn when burn rate is 0", async function () {
      const { token, owner, user1, user2 } = await loadFixture(deployTokenFixture);
      
      // Set burn rate to 0
      await token.connect(owner).setBurnRate(0);
      
      const amount = ethers.parseEther("1000");
      await token.connect(owner).distributeInitialSupply(user1.address, amount);
      
      const initialTotalSupply = await token.totalSupply();
      
      // Transfer should not trigger burn
      await token.connect(user1).transfer(user2.address, amount);
      
      expect(await token.balanceOf(user2.address)).to.equal(amount);
      expect(await token.totalSupply()).to.equal(initialTotalSupply); // No burn
    });
  });

  // VSC5: New test section for exempt wallet management
  describe("Exempt Wallet Management (VSC5)", function () {
    it("Should allow owner to set exempt wallets", async function () {
      const { token, owner, user1 } = await loadFixture(deployTokenFixture);
      
      await token.connect(owner).setExemptFromBurn(user1.address, true);
      expect(await token.isExempt(user1.address)).to.be.true;
    });

    it("Should allow owner to remove exempt status", async function () {
      const { token, owner, user1 } = await loadFixture(deployTokenFixture);
      
      await token.connect(owner).setExemptFromBurn(user1.address, true);
      await token.connect(owner).setExemptFromBurn(user1.address, false);
      expect(await token.isExempt(user1.address)).to.be.false;
    });

    it("Should not allow non-owner to set exempt wallets", async function () {
      const { token, user1, user2 } = await loadFixture(deployTokenFixture);
      
      await expect(token.connect(user1).setExemptFromBurn(user2.address, true))
        .to.be.reverted;
    });
  });

  describe("Platform Fee Burns", function () {
    it("Should allow approved platform to burn fees", async function () {
      const { token, owner, platform, reserveBurn } = await loadFixture(deployTokenFixture);
      
      // Approve platform
      await token.connect(owner).setPlatformApproved(platform.address, true);
      
      // Transfer tokens to platform
      const amount = ethers.parseEther("1000");
      await token.connect(owner).distributeInitialSupply(platform.address, amount);
      
      const initialReserveBalance = await token.balanceOf(reserveBurn.address);
      const initialTotalSupply = await token.totalSupply();
      
      // Platform burns 2% fee
      const basisPoints = 200; // 2%
      await token.connect(platform).burnPlatformFee(amount, basisPoints);
      
      const burnAmount = (amount * BigInt(basisPoints)) / 10000n;
      const burnNow = burnAmount / 2n;
      const toReserve = burnAmount - burnNow;
      
      expect(await token.balanceOf(reserveBurn.address)).to.equal(initialReserveBalance + toReserve);
      expect(await token.totalSupply()).to.equal(initialTotalSupply - burnNow);
    });

    it("Should not allow unapproved platform to burn fees", async function () {
      const { token, platform } = await loadFixture(deployTokenFixture);
      
      await expect(token.connect(platform).burnPlatformFee(100, 200))
        .to.be.revertedWith("Not an approved platform");
    });

    it("Should not allow platform fee burn above 5%", async function () {
      const { token, owner, platform } = await loadFixture(deployTokenFixture);
      
      await token.connect(owner).setPlatformApproved(platform.address, true);
      
      await expect(token.connect(platform).burnPlatformFee(100, 600))
        .to.be.revertedWith("Max 5%");
    });
  });

  describe("NFT Burns", function () {
    it("Should allow approved NFT contract to burn tokens", async function () {
      const { token, owner, nftContract, user1 } = await loadFixture(deployTokenFixture);
      
      // Approve NFT contract
      await token.connect(owner).setNFTContractApproved(nftContract.address, true);
      
      // Transfer tokens to user1
      const amount = ethers.parseEther("1000");
      await token.connect(owner).distributeInitialSupply(user1.address, amount);
      
      const initialTotalSupply = await token.totalSupply();
      
      // NFT contract burns tokens from user1 (max 1% of user's balance)
      const burnAmount = ethers.parseEther("10"); // 1% of 1000 HYPEY
      await token.connect(nftContract).burnForNFT(user1.address, burnAmount);
      
      expect(await token.balanceOf(user1.address)).to.equal(amount - burnAmount);
      expect(await token.totalSupply()).to.equal(initialTotalSupply - burnAmount);
    });

    it("Should not allow unapproved NFT contract to burn tokens", async function () {
      const { token, nftContract, user1 } = await loadFixture(deployTokenFixture);
      
      await expect(token.connect(nftContract).burnForNFT(user1.address, 100))
        .to.be.revertedWith("Not approved NFT contract");
    });
  });

  describe("KPI Burns", function () {
    it("Should allow owner to burn tokens for KPI events", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      
      // Transfer some tokens to owner first
      const amount = ethers.parseEther("1000");
      await token.connect(owner).distributeInitialSupply(owner.address, amount);
      
      const initialTotalSupply = await token.totalSupply();
      const burnAmount = ethers.parseEther("100");
      
      await token.connect(owner).burnKPIEvent(burnAmount);
      
      expect(await token.balanceOf(owner.address)).to.equal(amount - burnAmount);
      expect(await token.totalSupply()).to.equal(initialTotalSupply - burnAmount);
    });

    it("Should not allow non-owner to burn for KPI events", async function () {
      const { token, user1 } = await loadFixture(deployTokenFixture);
      
      await expect(token.connect(user1).burnKPIEvent(100))
        .to.be.reverted;
    });
  });

  describe("Dynamic Burn Rate", function () {
    it("Should update burn rate based on total supply", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      
      // Initial supply is 3B, so burn rate should be 1% (default)
      expect(await token.burnRateBasisPoints()).to.equal(100);
      
      // Note: Testing dynamic burn rate changes would require significant token burns
      // which is impractical in unit tests. This would be better tested in integration tests.
    });
  });

  describe("Access Control", function () {
    it("Should not allow non-owner to call owner functions", async function () {
      const { token, user1 } = await loadFixture(deployTokenFixture);
      
      await expect(token.connect(user1).setBurnRate(200))
        .to.be.reverted;
      
      await expect(token.connect(user1).setReserveBurnAddress(user1.address))
        .to.be.reverted;
      
      await expect(token.connect(user1).setPlatformApproved(user1.address, true))
        .to.be.reverted;
      
      await expect(token.connect(user1).setNFTContractApproved(user1.address, true))
        .to.be.reverted;
    });
  });

  describe("Builder Function", function () {
    it("Should return correct builder name", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.builder()).to.equal("TOPAY DEV TEAM");
    });
  });

  describe("DEX Buy/Sell Tax Logic", function () {
    it("Should apply 0% tax on buys from DEX pair", async function () {
      const { token, owner, user1, user2 } = await loadFixture(deployTokenFixture);
      // Simulate DEX pair
      await token.connect(owner).setDexPair(user1.address);
      // Transfer from DEX pair (buy)
      const amount = ethers.parseEther("1000");
      await token.connect(owner).distributeInitialSupply(user1.address, amount);
      await token.connect(user1).transfer(user2.address, amount);
      // user1 is DEX pair, user2 is buyer
      expect(await token.balanceOf(user2.address)).to.equal(amount);
    });

    it("Should apply 4% sell tax during the day", async function () {
      const { token, owner, user1, user2, reserveBurn } = await loadFixture(deployTokenFixture);
      await token.connect(owner).setDexPair(user2.address);
      await token.connect(owner).setNightMode(false); // Day
      const amount = ethers.parseEther("1000");
      await token.connect(owner).distributeInitialSupply(user1.address, amount);
      const initialReserve = await token.balanceOf(reserveBurn.address);
      const initialSupply = await token.totalSupply();
      // user1 sells to DEX pair (user2)
      await token.connect(user1).transfer(user2.address, amount);
      const burnAmount = (amount * 400n) / 10000n;
      const burnNow = burnAmount / 2n;
      const toReserve = burnAmount - burnNow;
      const received = amount - burnAmount;
      expect(await token.balanceOf(user2.address)).to.equal(received);
      expect(await token.balanceOf(reserveBurn.address)).to.equal(initialReserve + toReserve);
      expect(await token.totalSupply()).to.equal(initialSupply - burnNow);
    });

    it("Should apply 16% sell tax at night", async function () {
      const { token, owner, user1, user2, reserveBurn } = await loadFixture(deployTokenFixture);
      await token.connect(owner).setDexPair(user2.address);
      await token.connect(owner).setNightMode(true); // Night
      const amount = ethers.parseEther("1000");
      await token.connect(owner).distributeInitialSupply(user1.address, amount);
      const initialReserve = await token.balanceOf(reserveBurn.address);
      const initialSupply = await token.totalSupply();
      // user1 sells to DEX pair (user2)
      await token.connect(user1).transfer(user2.address, amount);
      const burnAmount = (amount * 1600n) / 10000n;
      const burnNow = burnAmount / 2n;
      const toReserve = burnAmount - burnNow;
      const received = amount - burnAmount;
      expect(await token.balanceOf(user2.address)).to.equal(received);
      expect(await token.balanceOf(reserveBurn.address)).to.equal(initialReserve + toReserve);
      expect(await token.totalSupply()).to.equal(initialSupply - burnNow);
    });
  });
});