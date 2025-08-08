// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

/**
 * @title MockTimelock
 * @author TOPAY DEV TEAM
 * @notice Mock timelock controller for testing and development purposes
 * @dev This contract extends TimelockControllerUpgradeable with UUPS upgradeability
 */
contract MockTimelock is 
    Initializable,
    TimelockControllerUpgradeable,
    UUPSUpgradeable,
    ReentrancyGuardUpgradeable
{
    /*//////////////////////////////////////////////////////////////
                            CONSTANTS
    //////////////////////////////////////////////////////////////*/
    
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    uint256 public constant MIN_DELAY = 1 hours;
    uint256 public constant MAX_DELAY = 30 days;

    /*//////////////////////////////////////////////////////////////
                        IMMUTABLE VARIABLES
    //////////////////////////////////////////////////////////////*/
    
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    address public immutable trustedInitializer;

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Flag to track if timelock has been initialized
    bool public timelockInitialized;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Emitted when timelock is initialized
    event TimelockInitialized(
        uint256 minDelay,
        address[] proposers,
        address[] executors,
        address admin
    );
    
    /// @notice Emitted when upgrade is authorized
    event UpgradeAuthorized(address indexed implementation, address indexed authorizer);
    
    /// @notice Emitted during emergency actions
    event EmergencyAction(string action, address executor);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    
    error UnauthorizedInitializer();
    error InvalidDelay();
    error InvalidAddress();
    error AlreadyInitialized();
    error UnauthorizedUpgrade();
    error EmptyProposersArray();
    error EmptyExecutorsArray();

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
     * @notice Initialize the timelock controller
     * @param minDelay Minimum delay for operations
     * @param proposers Array of proposer addresses
     * @param executors Array of executor addresses
     * @param admin Admin address (can be zero address for no admin)
     */
    function initialize(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) public initializer {
        if (msg.sender != trustedInitializer) revert UnauthorizedInitializer();
        if (minDelay < MIN_DELAY || minDelay > MAX_DELAY) revert InvalidDelay();
        if (proposers.length == 0) revert EmptyProposersArray();
        if (executors.length == 0) revert EmptyExecutorsArray();
        
        // Validate proposer addresses
        for (uint256 i = 0; i < proposers.length; i++) {
            if (proposers[i] == address(0)) revert InvalidAddress();
        }
        
        // Validate executor addresses
        for (uint256 i = 0; i < executors.length; i++) {
            if (executors[i] == address(0)) revert InvalidAddress();
        }
        
        __TimelockController_init(minDelay, proposers, executors, admin);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        
        // Setup upgrader role
        _setupRole(UPGRADER_ROLE, admin);
        if (admin != address(0)) {
            _setupRole(UPGRADER_ROLE, admin);
        }
        
        // Grant upgrader role to proposers as well
        for (uint256 i = 0; i < proposers.length; i++) {
            _setupRole(UPGRADER_ROLE, proposers[i]);
        }
        
        timelockInitialized = true;
        
        emit TimelockInitialized(minDelay, proposers, executors, admin);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Get contract builder information
     * @return string Builder team name
     */
    function builder() external pure returns (string memory) {
        return "TOPAY DEV TEAM";
    }
    
    /**
     * @notice Check if timelock is properly initialized
     * @return bool True if initialized
     */
    function isInitialized() external view returns (bool) {
        return timelockInitialized;
    }
    
    /**
     * @notice Get the minimum delay for operations
     * @return uint256 Minimum delay in seconds
     */
    function getMinDelay() public view override returns (uint256) {
        return super.getMinDelay();
    }
    
    /**
     * @notice Check if an operation is pending
     * @param id Operation identifier
     * @return bool True if operation is pending
     */
    function isOperationPending(bytes32 id) public view override returns (bool) {
        return super.isOperationPending(id);
    }
    
    /**
     * @notice Check if an operation is ready for execution
     * @param id Operation identifier
     * @return bool True if operation is ready
     */
    function isOperationReady(bytes32 id) public view override returns (bool) {
        return super.isOperationReady(id);
    }
    
    /**
     * @notice Check if an operation is done
     * @param id Operation identifier
     * @return bool True if operation is done
     */
    function isOperationDone(bytes32 id) public view override returns (bool) {
        return super.isOperationDone(id);
    }
    
    /**
     * @notice Get the timestamp when an operation becomes ready
     * @param id Operation identifier
     * @return uint256 Timestamp when operation is ready
     */
    function getTimestamp(bytes32 id) public view override returns (uint256) {
        return super.getTimestamp(id);
    }

    /*//////////////////////////////////////////////////////////////
                        ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Emergency pause function (if needed for testing)
     * @dev This is a mock function for testing purposes
     */
    function emergencyPause() external onlyRole(TIMELOCK_ADMIN_ROLE) {
        emit EmergencyAction("emergency_pause", msg.sender);
    }
    
    /**
     * @notice Emergency unpause function (if needed for testing)
     * @dev This is a mock function for testing purposes
     */
    function emergencyUnpause() external onlyRole(TIMELOCK_ADMIN_ROLE) {
        emit EmergencyAction("emergency_unpause", msg.sender);
    }

    /*//////////////////////////////////////////////////////////////
                        UPGRADE FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Authorize upgrade with proper access control
     * @param newImplementation Address of the new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal override {
        if (!hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) revert UnauthorizedUpgrade();
        if (newImplementation == address(0)) revert InvalidAddress();
        
        emit UpgradeAuthorized(newImplementation, msg.sender);
    }

    /*//////////////////////////////////////////////////////////////
                        OVERRIDE FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Override supportsInterface to include all inherited interfaces
     * @param interfaceId Interface identifier
     * @return bool True if interface is supported
     */
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        virtual 
        override 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }

}