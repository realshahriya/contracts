// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CCLXBridge
 * @notice ERC20 lock/unlock bridge contract for cross-chain transfers.
 *
 * Features:
 *  - Lock tokens on this chain
 *  - Unlock tokens (only by ORACLE_ROLE)
 *  - Prevent replay with unique messageId
 *  - Optional fee collection
 *  - UUPS upgradeable
 *  - Roles: ADMIN_ROLE (DEFAULT_ADMIN_ROLE), TREASURER_ROLE, ORACLE_ROLE
 */

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract CCLXBridge is Initializable, AccessControlUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");
    bytes32 public constant ORACLE_ROLE    = keccak256("ORACLE_ROLE");
    bytes32 public constant ADMIN_ROLE     = 0x00;

    mapping(bytes32 => bool) public processed;
    uint256 public feeBps;
    address public feeCollector;

    event Locked(
        address indexed token,
        address indexed sender,
        uint256 amount,
        uint256 indexed targetChainId,
        bytes targetRecipient,
        bytes32 messageId
    );

    event Unlocked(
        address indexed token,
        address indexed recipient,
        uint256 amount,
        bytes32 indexed messageId,
        address by
    );

    event FeeParamsUpdated(uint256 feeBps, address feeCollector, address indexed by);
    event Recovered(address indexed token, address indexed to, uint256 amount, address indexed by);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(address admin, uint256 initialFeeBps, address initialFeeCollector) external initializer {
        require(admin != address(0), "Bridge: admin zero");
        require(initialFeeBps <= 10000, "Bridge: fee bps > 10000");

        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setRoleAdmin(TREASURER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(ORACLE_ROLE, DEFAULT_ADMIN_ROLE);

        feeBps = initialFeeBps;
        feeCollector = initialFeeCollector;
    }

    // -----------------------
    // Lock tokens
    // -----------------------
    function lock(
        address token,
        uint256 amount,
        uint256 targetChainId,
        bytes calldata targetRecipient,
        bytes32 messageId
    ) external nonReentrant {
        require(token != address(0), "Bridge: token zero");
        require(amount > 0, "Bridge: amount zero");

        if (messageId == bytes32(0)) {
            messageId = keccak256(abi.encodePacked(msg.sender, token, amount, block.chainid, targetChainId, targetRecipient, block.timestamp));
        }

        require(!processed[messageId], "Bridge: message already processed");

        IERC20Upgradeable(token).safeTransferFrom(msg.sender, address(this), amount);

        if (feeBps > 0 && feeCollector != address(0)) {
            uint256 fee = (amount * feeBps) / 10000;
            if (fee > 0) {
                IERC20Upgradeable(token).safeTransfer(feeCollector, fee);
                amount -= fee;
            }
        }

        processed[messageId] = true;

        emit Locked(token, msg.sender, amount, targetChainId, targetRecipient, messageId);
    }

    // -----------------------
    // Unlock tokens
    // -----------------------
    function unlock(
        address token,
        address recipient,
        uint256 amount,
        bytes32 messageId
    ) external nonReentrant onlyRole(ORACLE_ROLE) {
        require(token != address(0), "Bridge: token zero");
        require(recipient != address(0), "Bridge: recipient zero");
        require(amount > 0, "Bridge: amount zero");
        require(!processed[messageId], "Bridge: message already processed");

        processed[messageId] = true;

        uint256 bal = IERC20Upgradeable(token).balanceOf(address(this));
        require(bal >= amount, "Bridge: insufficient balance");

        IERC20Upgradeable(token).safeTransfer(recipient, amount);

        emit Unlocked(token, recipient, amount, messageId, msg.sender);
    }

    // -----------------------
    // Admin / Treasurer utilities
    // -----------------------
    function setFeeParams(uint256 newFeeBps, address newCollector) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newFeeBps <= 10000, "Bridge: fee bps > 10000");
        feeBps = newFeeBps;
        feeCollector = newCollector;
        emit FeeParamsUpdated(newFeeBps, newCollector, msg.sender);
    }

    function recoverERC20(address token, address to, uint256 amount) external onlyRole(TREASURER_ROLE) nonReentrant {
        require(token != address(0), "Bridge: token zero");
        require(to != address(0), "Bridge: to zero");
        uint256 bal = IERC20Upgradeable(token).balanceOf(address(this));
        require(amount <= bal, "Bridge: insufficient balance");
        IERC20Upgradeable(token).safeTransfer(to, amount);
        emit Recovered(token, to, amount, msg.sender);
    }

    function isProcessed(bytes32 messageId) external view returns (bool) {
        return processed[messageId];
    }

    // -----------------------
    // Upgradeability
    // -----------------------
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    uint256[48] private __gap;
}
