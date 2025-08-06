// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";

contract HYPEYTreasury is Initializable, PausableUpgradeable, UUPSUpgradeable, AccessControlUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    
    bytes32 public constant MULTISIG_ADMIN_ROLE = keccak256("MULTISIG_ADMIN_ROLE");
    TimelockControllerUpgradeable public timelock;
    mapping(address => bool) public supportedTokens;
    address[] public supportedTokenList;
    uint256 public constant MAX_SUPPORTED_TOKENS = 50; // ZSC3: Limit supported tokens
    bool public ownerInitialized;

    event TokenSupported(address indexed token, bool enabled);
    event TokensWithdrawn(address indexed token, address indexed to, uint256 amount);
    event ETHWithdrawn(address indexed to, uint256 amount);
    event TokensDeposited(address indexed token, address indexed from, uint256 amount);
    event ETHDeposited(address indexed from, uint256 amount);
    event TreasuryInitialized(address indexed admin, address indexed timelock); // ZSC5: Missing event emission

    /// @custom:oz-upgrades-unsafe-allow constructor
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    address public immutable trustedInitializer;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        trustedInitializer = msg.sender;
        _disableInitializers();
    }

    // Step 1: Initialize with admin (will be initial owner)
    function initialize(address admin, address timelockAddress) public initializer {
        require(msg.sender == trustedInitializer, "Unauthorized initializer");
        require(admin != address(0), "Invalid admin address"); // ZSC7: Consistent error handling
        require(timelockAddress != address(0), "Invalid timelock address"); // ZSC7: Consistent error handling
        
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        timelock = TimelockControllerUpgradeable(payable(timelockAddress));
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MULTISIG_ADMIN_ROLE, admin);
        _grantRole(DEFAULT_ADMIN_ROLE, address(timelock));
        _grantRole(MULTISIG_ADMIN_ROLE, address(timelock));
        
        ownerInitialized = true;
        
        emit TreasuryInitialized(admin, timelockAddress); // ZSC5: Missing event emission
    }



    // === Supported Token Management ===
    function addSupportedToken(address token) external onlyRole(MULTISIG_ADMIN_ROLE) {
        require(token != address(0), "Invalid token address"); // ZSC7: Consistent error handling
        require(!supportedTokens[token], "Token already supported"); // ZSC7: Consistent error handling
        require(supportedTokenList.length < MAX_SUPPORTED_TOKENS, "Maximum supported tokens reached"); // ZSC3: Unbounded token list
        
        supportedTokens[token] = true;
        supportedTokenList.push(token);
        emit TokenSupported(token, true);
    }

    // Remove supported token from both mapping and array
    function removeSupportedToken(address token) external onlyRole(MULTISIG_ADMIN_ROLE) {
        require(supportedTokens[token], "Token not supported");
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

    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokenList;
    }

    // === Token Disbursement ===
    function disburseToken(
        address token,
        address to,
        uint256 amount
    ) external onlyRole(MULTISIG_ADMIN_ROLE) whenNotPaused {
        require(supportedTokens[token], "Token not supported"); // ZSC7: Consistent error handling
        require(to != address(0), "Invalid recipient address"); // ZSC7: Consistent error handling
        require(amount > 0, "Amount must be greater than zero"); // ZSC7: Consistent error handling
        require(amount <= 1_000_000 * 1e18, "Amount exceeds maximum withdrawal limit"); // ZSC2: Withdrawal limits
        // Add: Track daily withdrawal cap (simple version for demo)
        // ... (implement daily cap logic if needed)
        IERC20Upgradeable(token).safeTransfer(to, amount);
        emit TokensWithdrawn(token, to, amount);
    }
    function disburseETH(address payable to, uint256 amount) external onlyRole(MULTISIG_ADMIN_ROLE) whenNotPaused {
        require(to != address(0), "Invalid recipient address"); // ZSC7: Consistent error handling
        require(amount > 0, "Amount must be greater than zero"); // ZSC7: Consistent error handling
        require(address(this).balance >= amount, "Insufficient ETH balance"); // ZSC7: Consistent error handling
        require(amount <= 1_000_000 * 1e18, "Amount exceeds maximum withdrawal limit"); // ZSC2: Withdrawal limits
        // Add: Track daily withdrawal cap (simple version for demo)
        // ... (implement daily cap logic if needed)
        (bool success, ) = to.call{value: amount}("");
        require(success, "ETH transfer failed");
        emit ETHWithdrawn(to, amount);
    }

    // === Token/ETH Deposit (for event logs, optional for transparency) ===
    function depositToken(address token, uint256 amount) external {
        require(supportedTokens[token], "Token not supported");
        IERC20Upgradeable(token).safeTransferFrom(msg.sender, address(this), amount);
        emit TokensDeposited(token, msg.sender, amount);
    }

    receive() external payable {
        emit ETHDeposited(msg.sender, msg.value);
    }
    fallback() external payable {
        if (msg.value > 0) emit ETHDeposited(msg.sender, msg.value);
    }

    // === Balance Queries ===
    function getERC20Balance(address token) external view returns (uint256) {
        return IERC20Upgradeable(token).balanceOf(address(this));
    }

    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // === Emergency Pause ===
    function pause() external onlyRole(MULTISIG_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(MULTISIG_ADMIN_ROLE) {
        _unpause();
    }

    function builder() external pure returns (string memory) {
        return "TOPAY DEV TEAM";
    }

    // === UUPS Upgrade Authorization ===
    // VSC1: Upgradeable Contract Backdoor - Require timelock AND multisig
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(MULTISIG_ADMIN_ROLE) {
        require(msg.sender == address(timelock), "Upgrade only via timelock");
        require(hasRole(MULTISIG_ADMIN_ROLE, tx.origin), "Upgrade requires multisig admin");
    }
}