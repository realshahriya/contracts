// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";

/**
 * @title HYPEYTreasury
 * @author TOPAY DEV TEAM
 * @notice Treasury contract for managing HYPEY token and other supported tokens
 * @dev This contract handles token disbursements and treasury management with enhanced security
 */
contract HYPEYTreasury is 
    Initializable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable, 
    AccessControlUpgradeable 
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    /*//////////////////////////////////////////////////////////////
                            CONSTANTS
    //////////////////////////////////////////////////////////////*/
    
    bytes32 public constant MULTISIG_ADMIN_ROLE = keccak256("MULTISIG_ADMIN_ROLE");
    uint256 public constant MAX_SUPPORTED_TOKENS = 50;
    uint256 public constant MAX_WITHDRAWAL_LIMIT = 1_000_000 * 1e18;
    uint256 public constant DAILY_WITHDRAWAL_LIMIT = 500_000 * 1e18;
    uint256 public constant LARGE_WITHDRAWAL_THRESHOLD = 100_000 * 1e18;
    uint256 public constant TIMELOCK_DELAY = 24 hours;
    uint256 public constant MAX_BATCH_OPERATIONS = 50; // Gas limit protection

    /*//////////////////////////////////////////////////////////////
                        IMMUTABLE VARIABLES
    //////////////////////////////////////////////////////////////*/
    
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    address public immutable trustedInitializer;

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Timelock controller for governance
    TimelockControllerUpgradeable public timelock;
    
    /// @notice Mapping to track supported tokens
    mapping(address => bool) public supportedTokens;
    
    /// @notice Array of supported token addresses
    address[] public supportedTokenList;
    
    /// @notice Flag to track if owner has been initialized
    bool public ownerInitialized;
    
    /// @notice Daily withdrawal tracking per token (ZSC2 fix)
    mapping(address => mapping(uint256 => uint256)) public dailyWithdrawals;
    
    /// @notice Daily ETH withdrawal tracking (ZSC2 fix)
    mapping(uint256 => uint256) public dailyETHWithdrawals;
    
    /// @notice Cumulative daily withdrawal tracking across all tokens (ZSC2 critical fix)
    mapping(uint256 => uint256) public dailyTotalWithdrawals;
    
    /// @notice Pending large withdrawal requests (ZSC2 fix)
    mapping(bytes32 => PendingWithdrawal) public pendingWithdrawals;
    
    /// @notice Counter for withdrawal request IDs
    uint256 public withdrawalRequestCounter;
    
    /// @notice Struct for pending large withdrawals
    struct PendingWithdrawal {
        address token;
        address to;
        uint256 amount;
        uint256 requestTime;
        bool executed;
        bool isETH;
    }

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Emitted when token support status changes
    event TokenSupported(address indexed token, bool enabled);
    
    /// @notice Emitted when tokens are withdrawn
    event TokensWithdrawn(address indexed token, address indexed to, uint256 amount);
    
    /// @notice Emitted when ETH is withdrawn
    event ETHWithdrawn(address indexed to, uint256 amount);
    
    /// @notice Emitted when tokens are deposited
    event TokensDeposited(address indexed token, address indexed from, uint256 amount);
    
    /// @notice Emitted when ETH is deposited
    event ETHDeposited(address indexed from, uint256 amount);
    
    /// @notice Emitted when treasury is initialized
    event TreasuryInitialized(address indexed admin, address indexed timelock);
    
    /// @notice Emitted when a large withdrawal is requested (ZSC2 fix)
    event LargeWithdrawalRequested(bytes32 indexed requestId, address indexed token, address indexed to, uint256 amount, bool isETH);
    
    /// @notice Emitted when a large withdrawal is executed (ZSC2 fix)
    event LargeWithdrawalExecuted(bytes32 indexed requestId, address indexed token, address indexed to, uint256 amount, bool isETH);
    
    /// @notice Emitted when daily withdrawal limit is exceeded (ZSC2 fix)
    event DailyLimitExceeded(address indexed token, uint256 attempted, uint256 limit, bool isETH);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    
    error UnauthorizedInitializer();
    error InvalidAddress();
    error TokenAlreadySupported();
    error TokenNotSupported();
    error MaxTokensReached();
    error InvalidAmount();
    error InsufficientBalance();
    error ExceedsMaxWithdrawal();
    error TransferFailed();
    error UpgradeOnlyViaTimelock();
    error UpgradeRequiresMultisigAdmin();
    error DailyLimitExceededError(address token, uint256 attempted, uint256 limit, bool isETH);
    error WithdrawalRequestNotFound();
    error WithdrawalRequestAlreadyExecuted();
    error WithdrawalRequestTooEarly();
    error WithdrawalRequestExpired();

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        trustedInitializer = msg.sender;
        _disableInitializers();
    }

    /*//////////////////////////////////////////////////////////////
                            INITIALIZER
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Initialize the treasury contract with admin and timelock
     * @param admin Initial admin address
     * @param timelockAddress Timelock controller address
     */
    function initialize(address admin, address timelockAddress) public initializer {
        if (msg.sender != trustedInitializer) revert UnauthorizedInitializer();
        if (admin == address(0)) revert InvalidAddress();
        if (timelockAddress == address(0)) revert InvalidAddress();
        
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        timelock = TimelockControllerUpgradeable(payable(timelockAddress));
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MULTISIG_ADMIN_ROLE, admin);
        _grantRole(DEFAULT_ADMIN_ROLE, address(timelock));
        _grantRole(MULTISIG_ADMIN_ROLE, address(timelock));
        
        ownerInitialized = true;
        
        emit TreasuryInitialized(admin, timelockAddress);
    }

    /*//////////////////////////////////////////////////////////////
                    SUPPORTED TOKEN MANAGEMENT
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Add a token to the supported tokens list
     * @param token Address of the token to add
     */
    function addSupportedToken(address token) external onlyRole(MULTISIG_ADMIN_ROLE) {
        if (token == address(0)) revert InvalidAddress();
        if (supportedTokens[token]) revert TokenAlreadySupported();
        if (supportedTokenList.length >= MAX_SUPPORTED_TOKENS) revert MaxTokensReached();
        
        supportedTokens[token] = true;
        supportedTokenList.push(token);
        emit TokenSupported(token, true);
    }

    /**
     * @notice Remove a token from the supported tokens list
     * @param token Address of the token to remove
     */
    function removeSupportedToken(address token) external onlyRole(MULTISIG_ADMIN_ROLE) {
        if (!supportedTokens[token]) revert TokenNotSupported();
        
        supportedTokens[token] = false;
        for (uint256 i = 0; i < supportedTokenList.length; i++) {
            if (supportedTokenList[i] == token) {
                supportedTokenList[i] = supportedTokenList[supportedTokenList.length - 1];
                supportedTokenList.pop();
                break;
            }
        }
        emit TokenSupported(token, false);
    }

    /**
     * @notice Get the list of supported tokens
     * @return Array of supported token addresses
     */
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokenList;
    }

    /*//////////////////////////////////////////////////////////////
                        DISBURSEMENT FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Disburse tokens to a recipient (ZSC2 fix - with daily limits)
     * @param token Address of the token to disburse
     * @param to Recipient address
     * @param amount Amount to disburse
     */
    function disburseToken(
        address token,
        address to,
        uint256 amount
    ) external onlyRole(MULTISIG_ADMIN_ROLE) whenNotPaused nonReentrant {
        if (!supportedTokens[token]) revert TokenNotSupported();
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (amount > MAX_WITHDRAWAL_LIMIT) revert ExceedsMaxWithdrawal();
        
        // Check if this is a large withdrawal that requires timelock
        if (amount >= LARGE_WITHDRAWAL_THRESHOLD) {
            revert ExceedsMaxWithdrawal(); // Large withdrawals must go through request system
        }
        
        // Check daily withdrawal limits (both per-token and cumulative)
        uint256 today = block.timestamp / 1 days;
        uint256 todayWithdrawn = dailyWithdrawals[token][today];
        uint256 todayTotalWithdrawn = dailyTotalWithdrawals[today];
        
        // Check per-token daily limit
        if (todayWithdrawn + amount > DAILY_WITHDRAWAL_LIMIT) {
            emit DailyLimitExceeded(token, amount, DAILY_WITHDRAWAL_LIMIT, false);
            revert DailyLimitExceededError(token, amount, DAILY_WITHDRAWAL_LIMIT, false);
        }
        
        // Check cumulative daily limit across all tokens (CRITICAL FIX)
        if (todayTotalWithdrawn + amount > DAILY_WITHDRAWAL_LIMIT * 2) { // 2x limit for total
            emit DailyLimitExceeded(token, amount, DAILY_WITHDRAWAL_LIMIT * 2, false);
            revert DailyLimitExceededError(token, amount, DAILY_WITHDRAWAL_LIMIT * 2, false);
        }
        
        // Update daily withdrawal tracking
        dailyWithdrawals[token][today] = todayWithdrawn + amount;
        dailyTotalWithdrawals[today] = todayTotalWithdrawn + amount;
        
        IERC20Upgradeable(token).safeTransfer(to, amount);
        emit TokensWithdrawn(token, to, amount);
    }

    /**
     * @notice Disburse ETH to a recipient (ZSC2 fix - with daily limits)
     * @param to Recipient address
     * @param amount Amount to disburse
     */
    function disburseETH(
        address payable to, 
        uint256 amount
    ) external onlyRole(MULTISIG_ADMIN_ROLE) whenNotPaused nonReentrant {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (address(this).balance < amount) revert InsufficientBalance();
        if (amount > MAX_WITHDRAWAL_LIMIT) revert ExceedsMaxWithdrawal();
        
        // Check if this is a large withdrawal that requires timelock
        if (amount >= LARGE_WITHDRAWAL_THRESHOLD) {
            revert ExceedsMaxWithdrawal(); // Large withdrawals must go through request system
        }
        
        // Check daily withdrawal limits (both ETH-specific and cumulative)
        uint256 today = block.timestamp / 1 days;
        uint256 todayWithdrawn = dailyETHWithdrawals[today];
        uint256 todayTotalWithdrawn = dailyTotalWithdrawals[today];
        
        // Check ETH-specific daily limit
        if (todayWithdrawn + amount > DAILY_WITHDRAWAL_LIMIT) {
            emit DailyLimitExceeded(address(0), amount, DAILY_WITHDRAWAL_LIMIT, true);
            revert DailyLimitExceededError(address(0), amount, DAILY_WITHDRAWAL_LIMIT, true);
        }
        
        // Check cumulative daily limit across all tokens including ETH (CRITICAL FIX)
        if (todayTotalWithdrawn + amount > DAILY_WITHDRAWAL_LIMIT * 2) { // 2x limit for total
            emit DailyLimitExceeded(address(0), amount, DAILY_WITHDRAWAL_LIMIT * 2, true);
            revert DailyLimitExceededError(address(0), amount, DAILY_WITHDRAWAL_LIMIT * 2, true);
        }
        
        // Update daily withdrawal tracking
        dailyETHWithdrawals[today] = todayWithdrawn + amount;
        dailyTotalWithdrawals[today] = todayTotalWithdrawn + amount;
        
        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit ETHWithdrawn(to, amount);
    }

    /*//////////////////////////////////////////////////////////////
                    LARGE WITHDRAWAL REQUEST SYSTEM (ZSC2 FIX)
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Request a large withdrawal that requires timelock delay
     * @param token Address of the token (address(0) for ETH)
     * @param to Recipient address
     * @param amount Amount to withdraw
     * @return requestId The ID of the withdrawal request
     */
    function requestLargeWithdrawal(
        address token,
        address to,
        uint256 amount
    ) external onlyRole(MULTISIG_ADMIN_ROLE) returns (bytes32 requestId) {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        if (amount < LARGE_WITHDRAWAL_THRESHOLD) revert InvalidAmount();
        if (amount > MAX_WITHDRAWAL_LIMIT) revert ExceedsMaxWithdrawal();
        
        bool isETH = token == address(0);
        if (!isETH && !supportedTokens[token]) revert TokenNotSupported();
        
        requestId = keccak256(abi.encodePacked(
            block.timestamp,
            withdrawalRequestCounter++,
            token,
            to,
            amount
        ));
        
        pendingWithdrawals[requestId] = PendingWithdrawal({
            token: token,
            to: to,
            amount: amount,
            requestTime: block.timestamp,
            executed: false,
            isETH: isETH
        });
        
        emit LargeWithdrawalRequested(requestId, token, to, amount, isETH);
    }
    
    /**
     * @notice Execute a large withdrawal after timelock delay
     * @param requestId The ID of the withdrawal request
     */
    function executeLargeWithdrawal(bytes32 requestId) 
        external 
        onlyRole(MULTISIG_ADMIN_ROLE) 
        whenNotPaused 
        nonReentrant 
    {
        PendingWithdrawal storage request = pendingWithdrawals[requestId];
        
        if (request.requestTime == 0) revert WithdrawalRequestNotFound();
        if (request.executed) revert WithdrawalRequestAlreadyExecuted();
        if (block.timestamp < request.requestTime + TIMELOCK_DELAY) revert WithdrawalRequestTooEarly();
        if (block.timestamp > request.requestTime + TIMELOCK_DELAY + 7 days) revert WithdrawalRequestExpired();
        
        request.executed = true;
        
        if (request.isETH) {
            if (address(this).balance < request.amount) revert InsufficientBalance();
            (bool success, ) = payable(request.to).call{value: request.amount}("");
            if (!success) revert TransferFailed();
            emit ETHWithdrawn(request.to, request.amount);
        } else {
            IERC20Upgradeable(request.token).safeTransfer(request.to, request.amount);
            emit TokensWithdrawn(request.token, request.to, request.amount);
        }
        
        emit LargeWithdrawalExecuted(requestId, request.token, request.to, request.amount, request.isETH);
    }
    
    /**
     * @notice Get pending withdrawal request details
     * @param requestId The ID of the withdrawal request
     * @return request The withdrawal request details
     */
    function getPendingWithdrawal(bytes32 requestId) 
        external 
        view 
        returns (PendingWithdrawal memory request) 
    {
        return pendingWithdrawals[requestId];
    }

    /*//////////////////////////////////////////////////////////////
                        DEPOSIT FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Deposit tokens to the treasury
     * @param token Address of the token to deposit
     * @param amount Amount to deposit
     */
    function depositToken(address token, uint256 amount) external nonReentrant {
        if (!supportedTokens[token]) revert TokenNotSupported();
        
        IERC20Upgradeable(token).safeTransferFrom(msg.sender, address(this), amount);
        emit TokensDeposited(token, msg.sender, amount);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Get the balance of a specific ERC20 token
     * @param token Address of the token
     * @return Token balance
     */
    function getERC20Balance(address token) external view returns (uint256) {
        return IERC20Upgradeable(token).balanceOf(address(this));
    }

    /**
     * @notice Get the ETH balance of the treasury
     * @return ETH balance
     */
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get contract builder information
     * @return string Builder team name
     */
    function builder() external pure returns (string memory) {
        return "TOPAY DEV TEAM";
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Pause the contract
     */
    function pause() external onlyRole(MULTISIG_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyRole(MULTISIG_ADMIN_ROLE) {
        _unpause();
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Authorize upgrade with timelock and multisig requirements
     * @param newImplementation Address of the new implementation
     */
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyRole(MULTISIG_ADMIN_ROLE) 
    {
        if (msg.sender != address(timelock)) revert UpgradeOnlyViaTimelock();
        if (!hasRole(MULTISIG_ADMIN_ROLE, tx.origin)) revert UpgradeRequiresMultisigAdmin();
        
        // Silence unused parameter warning
        newImplementation;
    }

    /*//////////////////////////////////////////////////////////////
                        RECEIVE FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Receive ETH and emit event
     */
    receive() external payable {
        emit ETHDeposited(msg.sender, msg.value);
    }

    /**
     * @notice Fallback function to handle ETH deposits
     */
    fallback() external payable {
        if (msg.value > 0) {
            emit ETHDeposited(msg.sender, msg.value);
        }
    }
}