// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CCLXTreasury
 * @notice Treasury contract for managing CCLX and other ERC20/ERC721/ETH if desired.
 *
 * Roles:
 *  - ADMIN_ROLE (DEFAULT_ADMIN_ROLE)  : full admin control
 *  - TREASURER_ROLE                   : can release funds
 *  - ORACLE_ROLE                      : can approve certain actions if needed
 *
 * Features:
 *  - Holds ERC20 tokens (including CCLX)
 *  - Holds ETH (via receive/fallback)
 *  - Controlled release of tokens/ETH by TREASURER_ROLE
 *  - Admin can recover mistakenly sent ERC20 tokens
 *  - UUPS upgradeable
 */

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract CCLXTreasury is Initializable, AccessControlUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");
    bytes32 public constant ORACLE_ROLE    = keccak256("ORACLE_ROLE");
    // ADMIN_ROLE is DEFAULT_ADMIN_ROLE (0x00)
    bytes32 public constant ADMIN_ROLE = 0x00;

    event ERC20Deposited(address indexed token, address indexed from, uint256 amount);
    event ERC20Released(address indexed token, address indexed to, uint256 amount, address indexed by);
    event ETHDeposited(address indexed from, uint256 amount);
    event ETHReleased(address indexed to, uint256 amount, address indexed by);
    event Recovered(address indexed token, address indexed to, uint256 amount, address indexed by);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(address admin) external initializer {
        require(admin != address(0), "Treasury: admin zero");

        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setRoleAdmin(TREASURER_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(ORACLE_ROLE, DEFAULT_ADMIN_ROLE);
    }

    // -----------------------
    // ERC20 Handling
    // -----------------------

    function depositERC20(address token, uint256 amount) external nonReentrant {
        require(token != address(0), "Treasury: token zero");
        require(amount > 0, "Treasury: amount zero");

        IERC20Upgradeable(token).safeTransferFrom(msg.sender, address(this), amount);
        emit ERC20Deposited(token, msg.sender, amount);
    }

    function releaseERC20(address token, address to, uint256 amount) external nonReentrant onlyRole(TREASURER_ROLE) {
        require(token != address(0), "Treasury: token zero");
        require(to != address(0), "Treasury: recipient zero");
        require(amount > 0, "Treasury: amount zero");

        IERC20Upgradeable(token).safeTransfer(to, amount);
        emit ERC20Released(token, to, amount, msg.sender);
    }

    // -----------------------
    // ETH Handling
    // -----------------------

    receive() external payable {
        emit ETHDeposited(msg.sender, msg.value);
    }

    fallback() external payable {
        if (msg.value > 0) {
            emit ETHDeposited(msg.sender, msg.value);
        }
    }

    function releaseETH(address payable to, uint256 amount) external nonReentrant onlyRole(TREASURER_ROLE) {
        require(to != address(0), "Treasury: recipient zero");
        require(amount > 0, "Treasury: amount zero");
        require(address(this).balance >= amount, "Treasury: insufficient balance");

        (bool success, ) = to.call{value: amount}("");
        require(success, "Treasury: ETH transfer failed");

        emit ETHReleased(to, amount, msg.sender);
    }

    // -----------------------
    // Admin utilities
    // -----------------------

    function recoverERC20(address token, address to, uint256 amount) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(token != address(0), "Treasury: token zero");
        require(to != address(0), "Treasury: recipient zero");

        IERC20Upgradeable(token).safeTransfer(to, amount);
        emit Recovered(token, to, amount, msg.sender);
    }

    // -----------------------
    // Upgradeability
    // -----------------------

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(ADMIN_ROLE) {}

    uint256[48] private __gap;
}
