// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/**
 * @title HYPEYToken
 * @dev Advanced ERC20 token with dynamic burn mechanics, governance, and platform integration
 * @notice This contract implements a sophisticated tokenomics system with time-based burn rates
 */
contract HYPEYToken is 
    ERC20Upgradeable, 
    OwnableUpgradeable, 
    UUPSUpgradeable, 
    AccessControlUpgradeable,
    ReentrancyGuardUpgradeable 
{
    /*//////////////////////////////////////////////////////////////
                                CONSTANTS
    //////////////////////////////////////////////////////////////*/
    
    uint256 public constant INITIAL_SUPPLY = 3_000_000_000 * 10**18;
    uint256 public constant MIN_EXEMPT_AMOUNT = 100 * 10**18;
    uint256 public constant MAX_BURN_RATE_BPS = 300; // 3%
    uint256 public constant DAY_SELL_TAX_BPS = 400; // 4%
    uint256 public constant NIGHT_SELL_TAX_BPS = 1600; // 16%
    uint256 public constant BASIS_POINTS_DENOMINATOR = 10000;
    
    bytes32 public constant MULTISIG_ADMIN_ROLE = keccak256("MULTISIG_ADMIN_ROLE");
    bytes32 public constant PLATFORM_MANAGER_ROLE = keccak256("PLATFORM_MANAGER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Current burn rate in basis points (1% = 100)
    uint256 public burnRateBasisPoints;
    
    /// @notice Address where reserve burn tokens are sent
    address public reserveBurnAddress;
    
    /// @notice Mapping of addresses exempt from burn mechanics
    mapping(address => bool) public exemptFromBurn;
    
    /// @notice Mapping of addresses exempt from small transfer restrictions (VSC5 fix)
    mapping(address => bool) public isExemptFromSmallTransferRestrictions;
    
    /// @notice Whether owner has been initialized
    bool public ownerInitialized;
    
    /// @notice Mapping of approved platform addresses
    mapping(address => bool) public approvedPlatforms;
    
    /// @notice Mapping of approved NFT contract addresses
    mapping(address => bool) public approvedNFTContracts;
    
    /// @notice Timelock controller for governance
    TimelockControllerUpgradeable public timelock;
    
    /// @notice Whether dynamic burn rate adjustment is enabled
    bool public dynamicBurnEnabled;
    
    /// @notice DEX pair address for tax calculations
    address public dexPair;
    
    /// @notice Whether night mode (higher tax) is active
    bool public isNight;

    // Add timelock and rate limiting state variables
    mapping(bytes32 => uint256) public timelockProposals;
    mapping(string => uint256) public lastParameterChange;
    uint256 public constant TIMELOCK_DELAY = 2 days;
    uint256 public constant RATE_CHANGE_COOLDOWN = 1 days;
    uint256 public constant MAX_RATE_CHANGE_PER_DAY = 100; // 1% max change per day

    // Emergency pause mechanism
    bool public emergencyPaused;

    /*//////////////////////////////////////////////////////////////
                            IMMUTABLE VARIABLES
    //////////////////////////////////////////////////////////////*/
    
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    address public immutable trustedInitializer;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    event ReserveBurnAddressChanged(address indexed oldAddress, address indexed newAddress);
    event BurnRateChanged(uint256 oldRate, uint256 newRate);
    event ExemptStatusChanged(address indexed wallet, bool exempt);
    event SmallTransferExemptStatusChanged(address indexed wallet, bool exempt);
    event PlatformApprovalChanged(address indexed platform, bool approved);
    event NFTContractApprovalChanged(address indexed nftContract, bool approved);
    event DexPairUpdated(address indexed oldPair, address indexed newPair);
    event NightModeToggled(bool isNight);
    event DynamicBurnToggled(bool enabled);
    event TokensDistributed(address indexed recipient, uint256 amount);
    event BurnExecuted(address indexed from, uint256 burnAmount, uint256 reserveAmount);
    
    // Events for timelock
    event TimelockProposalCreated(bytes32 indexed proposalId, string action, uint256 executeTime);
    event TimelockProposalExecuted(bytes32 indexed proposalId, string action);
    event EmergencyPauseToggled(bool paused);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    
    error UnauthorizedInitializer();
    error InvalidAddress();
    error InvalidBurnRate();
    error InsufficientBalance();
    error TransferFailed();
    error ExceedsMaxBurnRate();
    error SelfApprovalNotAllowed();
    error UnauthorizedAccount(address account, bytes32 role);
    
    // Errors for timelock
    error ProposalNotReady();
    error ProposalExpired();
    error ProposalNotFound();
    error RateChangeTooFrequent();
    error RateChangeExceedsLimit();
    error ContractPaused();

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        trustedInitializer = msg.sender;
        _disableInitializers();
    }

    /*//////////////////////////////////////////////////////////////
                            INITIALIZATION
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Initialize the token contract
     * @param _reserveBurnAddress Address to receive reserve burn tokens
     * @param timelockAddress Address of the timelock controller
     * @param initialOwner Address of the initial owner
     */
    function initialize(
        address _reserveBurnAddress, 
        address timelockAddress, 
        address initialOwner
    ) public initializer {
        if (msg.sender != trustedInitializer) revert UnauthorizedInitializer();
        if (_reserveBurnAddress == address(0)) revert InvalidAddress();
        if (timelockAddress == address(0)) revert InvalidAddress();
        if (initialOwner == address(0)) revert InvalidAddress();

        __ERC20_init("HYPEY Token", "HYPEY");
        __Ownable_init();
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __ReentrancyGuard_init();

        _transferOwnership(initialOwner);
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(MULTISIG_ADMIN_ROLE, initialOwner);
        _grantRole(PLATFORM_MANAGER_ROLE, initialOwner);
        _grantRole(DEFAULT_ADMIN_ROLE, timelockAddress);
        _grantRole(MULTISIG_ADMIN_ROLE, timelockAddress);

        timelock = TimelockControllerUpgradeable(payable(timelockAddress));
        reserveBurnAddress = _reserveBurnAddress;
        burnRateBasisPoints = 100; // Default to 1%

        _mint(address(this), INITIAL_SUPPLY);
        ownerInitialized = true;
    }

    /*//////////////////////////////////////////////////////////////
                            MODIFIERS
    //////////////////////////////////////////////////////////////*/
    
    // Emergency pause modifier
    modifier whenNotEmergencyPaused() {
        if (emergencyPaused) revert ContractPaused();
        _;
    }

    modifier onlyMultisigAdmin() {
        if (!hasRole(MULTISIG_ADMIN_ROLE, msg.sender)) {
            revert UnauthorizedAccount(msg.sender, MULTISIG_ADMIN_ROLE);
        }
        _;
    }

    /*//////////////////////////////////////////////////////////////
                        TRANSFER OVERRIDES
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Transfer tokens with burn mechanics
     * @param recipient Address to receive tokens
     * @param amount Amount of tokens to transfer
     * @return bool Success status
     */
    function transfer(address recipient, uint256 amount) 
        public 
        override 
        whenNotEmergencyPaused
        nonReentrant 
        returns (bool) 
    {
        _transferWithBurn(_msgSender(), recipient, amount);
        return true;
    }

    /**
     * @notice Transfer tokens from one address to another with burn mechanics
     * @param sender Address to send tokens from
     * @param recipient Address to receive tokens
     * @param amount Amount of tokens to transfer
     * @return bool Success status
     */
    function transferFrom(address sender, address recipient, uint256 amount) 
        public 
        override 
        whenNotEmergencyPaused
        nonReentrant 
        returns (bool) 
    {
        _spendAllowance(sender, _msgSender(), amount);
        _transferWithBurn(sender, recipient, amount);
        return true;
    }

    /*//////////////////////////////////////////////////////////////
                        BURN MECHANICS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Internal function to handle transfers with burn logic
     * @param sender Address sending tokens
     * @param recipient Address receiving tokens
     * @param amount Amount of tokens being transferred
     */
    function _transferWithBurn(address sender, address recipient, uint256 amount) internal {
        // Skip burn logic for exempt addresses
        if (exemptFromBurn[sender] || exemptFromBurn[recipient]) {
            super._transfer(sender, recipient, amount);
            return;
        }

        // Calculate minimum burn threshold
        uint256 senderBalance = balanceOf(sender);
        uint256 minBurnAmount = _calculateMinBurnAmount(senderBalance);
        
        // VSC5 Fix: Apply burn tax to small transfers unless sender is specifically exempted
        if (amount < minBurnAmount && !isExemptFromSmallTransferRestrictions[sender]) {
            // Apply burn tax even for small transfers to prevent dusting attacks
            uint256 smallTransferTaxBps = _calculateTaxRate(sender, recipient);
            if (smallTransferTaxBps > 0) {
                _executeBurnAndTransfer(sender, recipient, amount, smallTransferTaxBps);
                return;
            }
        }
        
        // Skip burn for exempt addresses or exempted small transfers
        if (amount < minBurnAmount && isExemptFromSmallTransferRestrictions[sender]) {
            super._transfer(sender, recipient, amount);
            return;
        }

        // Determine tax rate based on transaction type
        uint256 taxBps = _calculateTaxRate(sender, recipient);
        
        if (taxBps == 0) {
            super._transfer(sender, recipient, amount);
            return;
        }

        // Execute burn and transfer
        _executeBurnAndTransfer(sender, recipient, amount, taxBps);
    }

    /**
     * @notice Calculate minimum burn amount based on balance
     * @param balance Current balance of the sender
     * @return uint256 Minimum amount required for burn
     */
    function _calculateMinBurnAmount(uint256 balance) internal pure returns (uint256) {
        uint256 minBurnAmount = balance / 1000; // 0.1% of balance
        return minBurnAmount < MIN_EXEMPT_AMOUNT ? MIN_EXEMPT_AMOUNT : minBurnAmount;
    }

    /**
     * @notice Calculate tax rate based on transaction type
     * @param sender Address sending tokens
     * @param recipient Address receiving tokens
     * @return uint256 Tax rate in basis points
     */
    function _calculateTaxRate(address sender, address recipient) internal view returns (uint256) {
        if (dexPair == address(0)) {
            return burnRateBasisPoints;
        }

        if (sender == dexPair) {
            // Buy transaction: 0% tax
            return 0;
        } else if (recipient == dexPair) {
            // Sell transaction: time-based tax
            return isNight ? NIGHT_SELL_TAX_BPS : DAY_SELL_TAX_BPS;
        } else {
            // Normal transfer
            return burnRateBasisPoints;
        }
    }

    /**
     * @notice Execute burn and transfer logic
     * @param sender Address sending tokens
     * @param recipient Address receiving tokens
     * @param amount Total amount being transferred
     * @param taxBps Tax rate in basis points
     */
    function _executeBurnAndTransfer(
        address sender, 
        address recipient, 
        uint256 amount, 
        uint256 taxBps
    ) internal {
        // CRITICAL FIX: Integer overflow protection
        uint256 burnAmount;
        unchecked {
            // Safe multiplication check
            if (amount > type(uint256).max / taxBps) {
                revert("Burn calculation overflow");
            }
            burnAmount = (amount * taxBps) / BASIS_POINTS_DENOMINATOR;
        }
        uint256 burnNow = burnAmount / 2;
        uint256 toReserve = burnAmount - burnNow;
        uint256 sendAmount = amount - burnAmount;

        // Execute burn
        _burn(sender, burnNow);
        
        // Transfer to reserve
        super._transfer(sender, reserveBurnAddress, toReserve);
        
        // Transfer remaining to recipient
        super._transfer(sender, recipient, sendAmount);

        emit BurnExecuted(sender, burnNow, toReserve);
    }

    /**
     * @notice Update dynamic burn rate based on supply
     */
    function _updateDynamicBurnRate() internal {
        if (!dynamicBurnEnabled) return;
        
        uint256 supply = totalSupply();
        uint256 newRate;

        if (supply > 2_500_000_000 * 1e18) {
            newRate = 300; // 3%
        } else if (supply > 2_000_000_000 * 1e18) {
            newRate = 200; // 2%
        } else {
            newRate = 100; // 1%
        }

        if (newRate != burnRateBasisPoints) {
            uint256 oldRate = burnRateBasisPoints;
            burnRateBasisPoints = newRate;
            emit BurnRateChanged(oldRate, newRate);
        }
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Set burn rate with timelock protection (owner only)
     * @param _basisPoints New burn rate in basis points
     */
    function setBurnRate(uint256 _basisPoints) external onlyMultisigAdmin whenNotEmergencyPaused {
        if (_basisPoints > MAX_BURN_RATE_BPS) revert ExceedsMaxBurnRate();
        
        // Check rate change limits
        if (block.timestamp < lastParameterChange["burnRate"] + RATE_CHANGE_COOLDOWN) {
            revert RateChangeTooFrequent();
        }
        
        uint256 currentRate = burnRateBasisPoints;
        uint256 rateDiff = _basisPoints > currentRate ? 
            _basisPoints - currentRate : 
            currentRate - _basisPoints;
            
        if (rateDiff > MAX_RATE_CHANGE_PER_DAY) {
            revert RateChangeExceedsLimit();
        }
        
        // Create timelock proposal for significant changes
        if (rateDiff > 50) { // 0.5% threshold for timelock
            bytes32 proposalId = keccak256(abi.encodePacked("setBurnRate", _basisPoints, block.timestamp));
            timelockProposals[proposalId] = block.timestamp + TIMELOCK_DELAY;
            emit TimelockProposalCreated(proposalId, "setBurnRate", block.timestamp + TIMELOCK_DELAY);
            return;
        }
        
        uint256 oldRate = burnRateBasisPoints;
        burnRateBasisPoints = _basisPoints;
        lastParameterChange["burnRate"] = block.timestamp;
        emit BurnRateChanged(oldRate, _basisPoints);
    }

    /**
     * @notice Execute timelock proposal for burn rate change
     * @param _basisPoints New burn rate in basis points
     * @param proposalTimestamp Original proposal timestamp
     */
    function executeBurnRateChange(uint256 _basisPoints, uint256 proposalTimestamp) 
        external 
        onlyMultisigAdmin 
        whenNotEmergencyPaused 
    {
        bytes32 proposalId = keccak256(abi.encodePacked("setBurnRate", _basisPoints, proposalTimestamp));
        uint256 executeTime = timelockProposals[proposalId];
        
        if (executeTime == 0) revert ProposalNotFound();
        if (block.timestamp < executeTime) revert ProposalNotReady();
        if (block.timestamp > executeTime + 7 days) revert ProposalExpired();
        
        delete timelockProposals[proposalId];
        
        uint256 oldRate = burnRateBasisPoints;
        burnRateBasisPoints = _basisPoints;
        lastParameterChange["burnRate"] = block.timestamp;
        
        emit TimelockProposalExecuted(proposalId, "setBurnRate");
        emit BurnRateChanged(oldRate, _basisPoints);
    }

    /**
     * @notice Set reserve burn address (owner only)
     * @param _addr New reserve burn address
     */
    function setReserveBurnAddress(address _addr) external onlyMultisigAdmin {
        if (_addr == address(0)) revert InvalidAddress();
        if (_addr == address(this)) revert SelfApprovalNotAllowed();
        
        address oldAddress = reserveBurnAddress;
        reserveBurnAddress = _addr;
        emit ReserveBurnAddressChanged(oldAddress, _addr);
    }
    
    /**
     * @notice Set exempt status for an address (owner only)
     * @param wallet Address to modify
     * @param exempt Whether the address should be exempt
     */
    function setExemptFromBurn(address wallet, bool exempt) external onlyOwner {
        if (wallet == address(0)) revert InvalidAddress();
        
        exemptFromBurn[wallet] = exempt;
        emit ExemptStatusChanged(wallet, exempt);
    }
    
    /**
     * @notice Check if an address is exempt from burns
     * @param sender Address to check
     * @return bool Whether the address is exempt
     */
    function isExempt(address sender) public view returns (bool) {
        return exemptFromBurn[sender];
    }
    
    /**
     * @notice Set small transfer exemption status (owner only) - VSC5 Fix
     * @param wallet Address to modify
     * @param exempt Whether the address should be exempt from small transfer restrictions
     */
    function setSmallTransferExemption(address wallet, bool exempt) external onlyOwner {
        if (wallet == address(0)) revert InvalidAddress();
        
        isExemptFromSmallTransferRestrictions[wallet] = exempt;
        emit SmallTransferExemptStatusChanged(wallet, exempt);
    }
    
    /**
     * @notice Toggle dynamic burn rate adjustment (owner only)
     * @param enabled Whether dynamic burn should be enabled
     */
    function setDynamicBurnEnabled(bool enabled) external onlyOwner {
        dynamicBurnEnabled = enabled;
        emit DynamicBurnToggled(enabled);
    }

    /**
     * @notice Set DEX pair address for tax calculations (owner only)
     * @param _pair DEX pair address
     */
    function setDexPair(address _pair) external onlyMultisigAdmin {
        if (_pair == address(0)) revert InvalidAddress();
        
        address oldPair = dexPair;
        dexPair = _pair;
        emit DexPairUpdated(oldPair, _pair);
    }

    /**
     * @notice Toggle night mode for higher sell taxes (owner only)
     * @param _isNight Whether night mode should be active
     */
    function setNightMode(bool _isNight) external onlyOwner whenNotEmergencyPaused {
        // Prevent rapid night mode toggling (front-running protection)
        if (block.timestamp < lastParameterChange["nightMode"] + 1 hours) {
            revert RateChangeTooFrequent();
        }
        
        isNight = _isNight;
        lastParameterChange["nightMode"] = block.timestamp;
        emit NightModeToggled(_isNight);
    }

    /**
     * @notice Distribute initial supply from contract (owner only)
     * @param recipient Address to receive tokens
     * @param amount Amount of tokens to distribute
     */
    function distributeInitialSupply(address recipient, uint256 amount) 
        external 
        onlyOwner 
        nonReentrant 
    {
        if (recipient == address(0)) revert InvalidAddress();
        if (balanceOf(address(this)) < amount) revert InsufficientBalance();
        
        super._transfer(address(this), recipient, amount);
        emit TokensDistributed(recipient, amount);
    }

    /**
     * @notice Set platform approval status (platform manager only)
     * @param platform Platform address
     * @param approved Whether the platform should be approved
     */
    function setPlatformApproved(address platform, bool approved) 
        external 
        onlyRole(PLATFORM_MANAGER_ROLE) 
    {
        if (platform == address(0)) revert InvalidAddress();
        if (platform == address(this)) revert SelfApprovalNotAllowed();
        
        approvedPlatforms[platform] = approved;
        emit PlatformApprovalChanged(platform, approved);
    }

    /**
     * @notice Set NFT contract approval status (platform manager only)
     * @param nftContract NFT contract address
     * @param approved Whether the NFT contract should be approved
     */
    function setNFTContractApproved(address nftContract, bool approved) 
        external 
        onlyRole(PLATFORM_MANAGER_ROLE) 
    {
        if (nftContract == address(0)) revert InvalidAddress();
        
        approvedNFTContracts[nftContract] = approved;
        emit NFTContractApprovalChanged(nftContract, approved);
    }

    /*//////////////////////////////////////////////////////////////
                        PLATFORM BURN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Burn tokens via platform fees (approved platforms only)
     * @param amount Amount of tokens to burn
     * @param basisPoints Burn rate in basis points (max 5%)
     */
    function burnPlatformFee(uint256 amount, uint256 basisPoints) 
        external 
        nonReentrant 
    {
        if (!approvedPlatforms[msg.sender]) revert UnauthorizedInitializer();
        if (basisPoints > 500) revert ExceedsMaxBurnRate(); // Max 5%
        if (amount == 0) revert InvalidBurnRate();
        if (balanceOf(msg.sender) < amount) revert InsufficientBalance();

        uint256 burnAmount = (amount * basisPoints) / BASIS_POINTS_DENOMINATOR;
        uint256 burnNow = burnAmount / 2;
        uint256 toReserve = burnAmount - burnNow;

        _burn(msg.sender, burnNow);
        super._transfer(msg.sender, reserveBurnAddress, toReserve);
        
        emit BurnExecuted(msg.sender, burnNow, toReserve);
    }

    /**
     * @notice Burn tokens for NFT interactions (approved NFT contracts only)
     * @param user User whose tokens will be burned
     * @param amount Amount of tokens to burn
     */
    function burnForNFT(address user, uint256 amount) 
        external 
        nonReentrant 
    {
        if (!approvedNFTContracts[msg.sender]) revert UnauthorizedInitializer();
        if (user == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidBurnRate();
        if (amount > balanceOf(user)) revert InsufficientBalance();
        
        // Limit NFT burn to reasonable amounts (max 1% of user's balance per call)
        if (amount > balanceOf(user) / 100) revert ExceedsMaxBurnRate();
        
        _burn(user, amount);
        emit BurnExecuted(user, amount, 0);
    }

    /**
     * @notice Burn tokens for KPI milestones (owner only)
     * @param amount Amount of tokens to burn
     */
    function burnKPIEvent(uint256 amount) 
        external 
        onlyOwner 
        nonReentrant 
    {
        if (amount > balanceOf(_msgSender())) revert InsufficientBalance();
        
        _burn(_msgSender(), amount);
        emit BurnExecuted(_msgSender(), amount, 0);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Get current tax rate for a specific transaction
     * @param sender Address sending tokens
     * @param recipient Address receiving tokens
     * @return uint256 Tax rate in basis points
     */
    function getCurrentTaxRate(address sender, address recipient) 
        external 
        view 
        returns (uint256) 
    {
        if (exemptFromBurn[sender] || exemptFromBurn[recipient]) {
            return 0;
        }
        return _calculateTaxRate(sender, recipient);
    }

    /**
     * @notice Returns the buy tax rate (always 0)
     * @return uint256 Buy tax rate in basis points
     */
    function getBuyTaxBps() external pure returns (uint256) {
        return 0;
    }

    /**
     * @notice Get contract builder information
     * @return string Builder team name
     */
    function builder() external pure returns (string memory) {
        return "TOPAY DEV TEAM";
    }

    /*//////////////////////////////////////////////////////////////
                        EMERGENCY FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Emergency pause mechanism (multisig admin only)
     * @param paused Whether to pause the contract
     */
    function setEmergencyPause(bool paused) external onlyRole(MULTISIG_ADMIN_ROLE) {
        emergencyPaused = paused;
        emit EmergencyPauseToggled(paused);
    }

    /*//////////////////////////////////////////////////////////////
                        UPGRADE AUTHORIZATION
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Authorize contract upgrades (multisig admin only)
     * @param newImplementation Address of new implementation
     */
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyRole(MULTISIG_ADMIN_ROLE) 
    {
        // Additional security: require timelock for upgrades
        require(msg.sender == address(timelock), "Upgrade only via timelock");
        require(hasRole(MULTISIG_ADMIN_ROLE, tx.origin), "Upgrade requires multisig admin");
        
        // Silence unused parameter warning
        newImplementation;
    }

    /*//////////////////////////////////////////////////////////////
                        HOOKS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Hook called before token transfers
     * @param from Address sending tokens
     * @param to Address receiving tokens
     * @param amount Amount being transferred
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._beforeTokenTransfer(from, to, amount);
        
        // Update dynamic burn rate if enabled
        if (dynamicBurnEnabled && from != address(0) && to != address(0)) {
            _updateDynamicBurnRate();
        }
    }
}