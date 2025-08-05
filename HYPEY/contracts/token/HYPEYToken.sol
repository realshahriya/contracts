// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";

contract HYPEYToken is ERC20Upgradeable, OwnableUpgradeable, UUPSUpgradeable, AccessControlUpgradeable {
    uint256 public constant INITIAL_SUPPLY = 3_000_000_000 * 10**18;
    uint256 public constant MIN_EXEMPT_AMOUNT = 100 * 10**18;

    uint256 public burnRateBasisPoints; // 1% = 100, 3% = 300
    address public reserveBurnAddress;
    mapping(address => bool) public exemptFromBurn; // VSC5: Exempt wallets

    bool public ownerInitialized;
    mapping(address => bool) public approvedPlatforms;
    mapping(address => bool) public approvedNFTContracts;
    
    // VSC1: Timelock and multisig for upgrades
    bytes32 public constant MULTISIG_ADMIN_ROLE = keccak256("MULTISIG_ADMIN_ROLE");
    TimelockControllerUpgradeable public timelock;
    
    // Events for audit compliance
    event ReserveBurnAddressChanged(address indexed oldAddress, address indexed newAddress);
    event BurnRateChanged(uint256 oldRate, uint256 newRate);
    event ExemptStatusChanged(address indexed wallet, bool exempt);

    /// @custom:oz-upgrades-unsafe-allow constructor
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    address public immutable trustedInitializer;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        trustedInitializer = msg.sender;
        _disableInitializers();
    }

    /// Step 1: Initialize token and supply
    function initialize(address _reserveBurnAddress, address timelockAddress, address initialOwner) public initializer {
        require(msg.sender == trustedInitializer, "Unauthorized initializer");
        require(_reserveBurnAddress != address(0), "Invalid reserve burn address");
        require(timelockAddress != address(0), "Invalid timelock address");
        require(initialOwner != address(0), "Invalid initial owner");

        __ERC20_init("HYPEY Token", "HYPEY");
        __Ownable_init();
        __UUPSUpgradeable_init();
        __AccessControl_init();

        _transferOwnership(initialOwner);
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(MULTISIG_ADMIN_ROLE, initialOwner);
        _grantRole(DEFAULT_ADMIN_ROLE, timelockAddress);
        _grantRole(MULTISIG_ADMIN_ROLE, timelockAddress);

        timelock = TimelockControllerUpgradeable(payable(timelockAddress));
        reserveBurnAddress = _reserveBurnAddress;
        burnRateBasisPoints = 100; // Default to 1%

        _mint(address(this), INITIAL_SUPPLY); // Mint 3B to contract
        ownerInitialized = true;
    }



    // --- Transfer Overrides with Burn Logic ---

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        _transferWithBurn(_msgSender(), recipient, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        _spendAllowance(sender, _msgSender(), amount);
        _transferWithBurn(sender, recipient, amount);
        return true;
    }

    bool public dynamicBurnEnabled;

    address public dexPair;
    bool public isNight;
    uint256 public constant DAY_SELL_TAX_BPS = 400; // 4%
    uint256 public constant NIGHT_SELL_TAX_BPS = 1600; // 16%

    function setDexPair(address _pair) external onlyOwner {
        require(_pair != address(0), "Invalid pair address");
        dexPair = _pair;
    }
    function setNightMode(bool _isNight) external onlyOwner {
        isNight = _isNight;
    }

    function _transferWithBurn(address sender, address recipient, uint256 amount) internal {
        // --- TAX LOGIC CLARIFICATION ---
        // Buy (sender == dexPair): 0% tax (no tokens are deducted)
        // Sell (recipient == dexPair): 4% (day) or 16% (night) tax
        // All other transfers: burnRateBasisPoints (default 1%, configurable by owner)
        if (exemptFromBurn[sender] || exemptFromBurn[recipient]) {
            super._transfer(sender, recipient, amount);
            return;
        }
        uint256 senderBalance = balanceOf(sender);
        uint256 minBurnAmount = senderBalance * 5 / 1000;
        if (minBurnAmount < MIN_EXEMPT_AMOUNT) {
            minBurnAmount = MIN_EXEMPT_AMOUNT;
        }
        if (amount < minBurnAmount) {
            super._transfer(sender, recipient, amount);
            return;
        }
        uint256 taxBps = 0;
        if (dexPair != address(0)) {
            if (sender == dexPair) {
                // Buy: 0% tax
                taxBps = 0;
            } else if (recipient == dexPair) {
                // Sell: 4% day, 16% night
                taxBps = isNight ? NIGHT_SELL_TAX_BPS : DAY_SELL_TAX_BPS;
            } else {
                // Normal transfer
                taxBps = burnRateBasisPoints;
            }
        } else {
            taxBps = burnRateBasisPoints;
        }
        if (taxBps == 0) {
            super._transfer(sender, recipient, amount);
            return;
        }
        uint256 burnAmount = (amount * taxBps) / 10000;
        uint256 burnNow = burnAmount / 2;
        uint256 toReserve = burnAmount - burnNow;
        uint256 sendAmount = amount - burnAmount;
        _burn(sender, burnNow);
        super._transfer(sender, reserveBurnAddress, toReserve);
        super._transfer(sender, recipient, sendAmount);
    }

    function _updateDynamicBurnRate() internal {
        // Optional auto-burn scaling (can be removed if only manual control desired)
        uint256 supply = totalSupply();

        if (supply > 2_500_000_000 * 1e18) {
            burnRateBasisPoints = 300; // 3%
        } else if (supply > 2_000_000_000 * 1e18) {
            burnRateBasisPoints = 200; // 2%
        } else {
            burnRateBasisPoints = 100; // 1%
        }
    }

    // --- Manual Admin Burn Settings ---

    function setBurnRate(uint256 _basisPoints) external onlyOwner {
        require(_basisPoints <= 300, "Burn rate must be between 0 and 3%");
        uint256 oldRate = burnRateBasisPoints;
        burnRateBasisPoints = _basisPoints;
        emit BurnRateChanged(oldRate, _basisPoints);
    }

    function setReserveBurnAddress(address _addr) external onlyOwner {
        require(_addr != address(0), "Invalid address");
        require(_addr != address(this), "Cannot be contract address"); // VSC2: Prevent hijacking
        address oldAddress = reserveBurnAddress;
        reserveBurnAddress = _addr;
        emit ReserveBurnAddressChanged(oldAddress, _addr);
    }
    
    // VSC5: Exempt wallet management
    function setExemptFromBurn(address wallet, bool exempt) external onlyOwner {
        require(wallet != address(0), "Invalid wallet address");
        exemptFromBurn[wallet] = exempt;
        emit ExemptStatusChanged(wallet, exempt);
    }
    
    // VSC4: Dynamic rate manipulation protection
    function setDynamicBurnEnabled(bool enabled) external onlyOwner {
        dynamicBurnEnabled = enabled;
    }

    /// @notice Allows owner to distribute initial supply from contract
    function distributeInitialSupply(address recipient, uint256 amount) external onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        require(balanceOf(address(this)) >= amount, "Insufficient contract balance");
        super._transfer(address(this), recipient, amount);
    }

    function setPlatformApproved(address platform, bool approved) external onlyOwner {
        require(platform != address(0), "Invalid platform address");
        require(platform != address(this), "Cannot approve self");
        approvedPlatforms[platform] = approved;
    }

    function setNFTContractApproved(address nftContract, bool approved) external onlyOwner {
        require(nftContract != address(0), "Invalid NFT contract address");
        require(nftContract != address(this), "Cannot approve self");
        approvedNFTContracts[nftContract] = approved;
    }

    // --- Burn via Platform Fees (ads, subscriptions, etc) ---

    function burnPlatformFee(uint256 amount, uint256 basisPoints) external {
        require(approvedPlatforms[msg.sender], "Not an approved platform");
        require(basisPoints <= 500, "Max 5%");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        uint256 burnAmount = (amount * basisPoints) / 10000;
        uint256 burnNow = burnAmount / 2;
        uint256 toReserve = burnAmount - burnNow;

        _burn(msg.sender, burnNow);
        super._transfer(msg.sender, reserveBurnAddress, toReserve);
    }

    // --- Burn via NFT Interactions (mint, upgrade, etc) ---

    function burnForNFT(address user, uint256 amount) external {
        require(approvedNFTContracts[msg.sender], "Not approved NFT contract");
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= balanceOf(user), "Insufficient user balance");
        // VSC3: Limit NFT burn to reasonable amounts (max 1% of user's balance per call)
        require(amount <= balanceOf(user) / 100, "NFT burn amount too high");
        _burn(user, amount);
    }

    // --- Burn via KPI Milestones (manual trigger by owner) ---

    function burnKPIEvent(uint256 amount) external onlyOwner {
        _burn(_msgSender(), amount);
    }
    
    function builder() external pure returns (string memory) {
        return "TOPAY DEV TEAM";
    }
    
    // --- UUPS Upgrade Authorization ---
    // VSC1: Upgradeable Contract Backdoor - Require timelock AND multisig
    function _authorizeUpgrade(address newImplementation) internal override {
        require(msg.sender == address(timelock), "Upgrade only via timelock");
        require(hasRole(MULTISIG_ADMIN_ROLE, tx.origin), "Upgrade requires multisig admin");
    }
}

    /// @notice Returns the buy tax rate (always 0)
    function getBuyTaxBps() external pure returns (uint256) {
        return 0;
    }