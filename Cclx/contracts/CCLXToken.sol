// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CCLXToken (ERC20 UUPS Upgradeable)
 * @dev ERC20 token with:
 *  - fixed supply minted at initializer
 *  - AccessControl roles:
 *      * ADMIN_ROLE (DEFAULT_ADMIN_ROLE) - admin of the system
 *      * TREASURER_ROLE
 *      * BURNER_ROLE
 *      * UPGRADER_ROLE
 *      * PAUSER_ROLE
 *      * ORACLE_ROLE
 *  - UUPS upgradeability (only UPGRADER_ROLE can upgrade)
 *  - pausability (only PAUSER_ROLE can pause/unpause)
 *  - burn: anyone can burn their own tokens; addresses with BURNER_ROLE can burn tokens from any account without allowance
 *
 * Notes:
 *  - Designed for EVM mainnet / any EVM-compatible chain.
 *  - Initializer mints the fixed total supply to the initializer (msg.sender).
 */

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract CCLXToken is Initializable, ERC20Upgradeable, AccessControlUpgradeable, PausableUpgradeable, UUPSUpgradeable {
    // Role constants
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");
    bytes32 public constant BURNER_ROLE    = keccak256("BURNER_ROLE");
    bytes32 public constant UPGRADER_ROLE  = keccak256("UPGRADER_ROLE");
    bytes32 public constant PAUSER_ROLE    = keccak256("PAUSER_ROLE");
    bytes32 public constant ORACLE_ROLE    = keccak256("ORACLE_ROLE");
    // ADMIN_ROLE is DEFAULT_ADMIN_ROLE (0x00)
    bytes32 public constant ADMIN_ROLE = 0x00;

    // Token constants
    uint8 private constant TOKEN_DECIMALS = 18;
    uint256 public constant TOTAL_SUPPLY = 200_000_000 * (10 ** uint256(TOKEN_DECIMALS)); // 200 million with 18 decimals

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    /**
     * @dev Initializer (replace constructor for upgradeable contracts).
     * Grants ADMIN_ROLE, PAUSER_ROLE, UPGRADER_ROLE, TREASURER_ROLE, BURNER_ROLE, ORACLE_ROLE to msg.sender.
     * Mints fixed total supply to msg.sender.
     */
    function initialize(string memory name_, string memory symbol_) public initializer {
        // Call parent initializers correctly
        __ERC20_init(name_, symbol_);
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        // Grant roles to deployer (msg.sender)
        _setupRole(ADMIN_ROLE, msg.sender); // DEFAULT_ADMIN_ROLE
        _setRoleAdmin(TREASURER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(BURNER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(UPGRADER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(PAUSER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(ORACLE_ROLE, ADMIN_ROLE);

        _grantRole(TREASURER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);

        // Mint fixed supply to msg.sender
        _mint(msg.sender, TOTAL_SUPPLY);
    }

    // ========== ERC20 Overrides ==========

    function decimals() public view virtual override returns (uint8) {
        return TOKEN_DECIMALS;
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        require(!paused(), "CCLX: token transfer while paused");
    }

    // ========== Pausable ==========

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // ========== Burn functions ==========

    /**
     * @notice Burn tokens from caller
     * @param amount amount to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /**
     * @notice Burn tokens from an account.
     * If caller has BURNER_ROLE, they can burn from any account without allowance checks.
     * Otherwise, standard allowance rules apply.
     * @param account account to burn from
     * @param amount amount to burn
     */
    function burnFrom(address account, uint256 amount) external {
        if (hasRole(BURNER_ROLE, msg.sender)) {
            _burn(account, amount);
        } else {
            uint256 currentAllowance = allowance(account, msg.sender);
            require(currentAllowance >= amount, "CCLX: burn amount exceeds allowance");
            unchecked {
                _approve(account, msg.sender, currentAllowance - amount);
            }
            _burn(account, amount);
        }
    }

    // ========== UUPS Upgrade Authorization ==========

    /**
     * @dev Restrict upgrades to accounts with UPGRADER_ROLE
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

    // ========== Admin helper: recover ERC20 sent accidentally ==========

    /**
     * @notice Recover ERC20 tokens accidentally sent to this token contract.
     * Only ADMIN_ROLE can call.
     * @param tokenAddress token to recover
     * @param to recipient
     * @param amount amount to recover
     */
    function recoverERC20(address tokenAddress, address to, uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(tokenAddress != address(this), "CCLX: cannot recover self token");
        IERC20Upgradeable(tokenAddress).transfer(to, amount);
    }

    // ========== Gap for upgrade safety ==========
    uint256[50] private __gap;
}
