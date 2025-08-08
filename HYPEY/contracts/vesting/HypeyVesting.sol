// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";

/**
 * @title HypeyVesting
 * @author TOPAY DEV TEAM
 * @notice Vesting contract for HYPEY tokens with cliff and linear vesting
 * @dev This contract handles token vesting schedules with enhanced security and batch operations
 */
contract HypeyVesting is 
    Initializable, 
    OwnableUpgradeable, 
    PausableUpgradeable, 
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable, 
    AccessControlUpgradeable 
{
    /*//////////////////////////////////////////////////////////////
                            CONSTANTS
    //////////////////////////////////////////////////////////////*/
    
    bytes32 public constant MULTISIG_ADMIN_ROLE = keccak256("MULTISIG_ADMIN_ROLE");
    uint256 public constant MAX_BATCH_SIZE = 100;
    uint256 public constant MAX_CLIFF_PERCENT = 100;

    /*//////////////////////////////////////////////////////////////
                        IMMUTABLE VARIABLES
    //////////////////////////////////////////////////////////////*/
    
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    address public immutable trustedInitializer;

    /*//////////////////////////////////////////////////////////////
                            STRUCTS
    //////////////////////////////////////////////////////////////*/
    
    struct VestingSchedule {
        bool initialized;
        uint256 totalAmount;
        uint256 released;
        uint256 start;
        uint256 cliff;
        uint256 duration;
        uint256 slicePeriodSeconds;
        uint256 cliffUnlockPercent;
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    
    /// @notice The ERC20 token being vested
    IERC20Upgradeable public token;
    
    /// @notice Merkle root for batch vesting verification
    bytes32 public merkleRoot;
    
    /// @notice Flag to track if owner has been initialized
    bool public ownerInitialized;
    
    /// @notice Timelock controller for governance
    TimelockControllerUpgradeable public timelock;
    
    /// @notice Mapping of beneficiary to their vesting schedules
    mapping(address => VestingSchedule[]) public vestingSchedules;
    
    /// @notice Mapping to track if a vesting schedule has been finalized (immutable)
    mapping(address => mapping(uint256 => bool)) public vestingFinalized;
    
    /// @notice Total amount of tokens allocated across all vesting schedules
    uint256 public totalAllocated;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Emitted when a vesting schedule is created
    event VestingCreated(address indexed beneficiary, uint256 index, uint256 totalAmount);
    
    /// @notice Emitted when tokens are claimed
    event TokensClaimed(address indexed beneficiary, uint256 index, uint256 amount);
    
    /// @notice Emitted when merkle root is updated
    event MerkleRootUpdated(bytes32 newMerkleRoot);
    
    /// @notice Emitted when tokens are deposited
    event TokensDeposited(address indexed from, uint256 amount);
    
    /// @notice Emitted when admin withdraws tokens
    event AdminWithdraw(address indexed to, uint256 amount);
    
    /// @notice Emitted when vesting contract is initialized
    event VestingInitialized(address indexed token, address indexed owner, address indexed timelock);
    
    /// @notice Emitted when vesting schedule is modified
    event VestingModified(address indexed beneficiary, uint256 index);
    
    /// @notice Emitted during emergency actions
    event EmergencyAction(string action, address executor);
    
    /// @notice Emitted when a vesting schedule is finalized
    event VestingFinalized(address indexed beneficiary, uint256 index);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/
    
    error UnauthorizedInitializer();
    error InvalidAddress();
    error InvalidAmount();
    error InvalidDuration();
    error InvalidCliffPercent();
    error StartTimeInPast();
    error CliffExceedsDuration();
    error ArrayLengthMismatch();
    error EmptyArray();
    error BatchSizeExceeded();
    error InvalidVestingIndex();
    error VestingNotInitialized();
    error NoTokensAvailable();
    error TransferFailed();
    error InsufficientPoolBalance();
    error MerkleRootNotSet();
    error InvalidMerkleProof();
    error UpgradeOnlyViaTimelock();
    error UpgradeRequiresMultisigAdmin();
    
    // XSC4: Additional validation errors
    error ExcessiveAmount();
    error StartTimeTooFarInFuture();
    error SlicePeriodTooShort();
    error SlicePeriodExceedsDuration();
    error DurationTooLong();
    error TimeOverflow();
    error VestingAlreadyFinalized();
    error TotalAllocationExceeded();
    error VestingNotFinalized();

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
     * @notice Initialize the vesting contract
     * @param tokenAddress Address of the token to be vested
     * @param _owner Initial owner of the contract
     * @param timelockAddress Address of the timelock controller
     */
    function initialize(
        address tokenAddress, 
        address _owner, 
        address payable timelockAddress
    ) public initializer {
        if (msg.sender != trustedInitializer) revert UnauthorizedInitializer();
        if (tokenAddress == address(0)) revert InvalidAddress();
        if (_owner == address(0)) revert InvalidAddress();
        if (timelockAddress == address(0)) revert InvalidAddress();
        
        __Ownable_init();
        __Pausable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        __AccessControl_init();
        
        token = IERC20Upgradeable(tokenAddress);
        
        if (_owner != msg.sender) {
            _transferOwnership(_owner);
        }
        
        _setupRole(DEFAULT_ADMIN_ROLE, _owner);
        _setupRole(MULTISIG_ADMIN_ROLE, _owner);
        
        timelock = TimelockControllerUpgradeable(timelockAddress);
        _setupRole(DEFAULT_ADMIN_ROLE, address(timelock));
        _setupRole(MULTISIG_ADMIN_ROLE, address(timelock));
        
        emit VestingInitialized(tokenAddress, _owner, timelockAddress);
    }

    /*//////////////////////////////////////////////////////////////
                        MERKLE ROOT MANAGEMENT
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Set the merkle root for batch vesting verification
     * @param newRoot New merkle root
     */
    function setMerkleRoot(bytes32 newRoot) external onlyOwner {
        merkleRoot = newRoot;
        emit MerkleRootUpdated(newRoot);
    }

    /*//////////////////////////////////////////////////////////////
                        VESTING SCHEDULE MANAGEMENT
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Add a vesting schedule for a beneficiary
     * @param beneficiary Address of the beneficiary
     * @param totalAmount Total amount to be vested
     * @param start Start time of vesting
     * @param cliffDuration Duration of cliff period
     * @param duration Total vesting duration
     * @param slicePeriodSeconds Period between vesting slices
     * @param cliffUnlockPercent Percentage unlocked at cliff
     */
    function addVestingSchedule(
        address beneficiary,
        uint256 totalAmount,
        uint256 start,
        uint256 cliffDuration,
        uint256 duration,
        uint256 slicePeriodSeconds,
        uint256 cliffUnlockPercent
    ) external onlyRole(MULTISIG_ADMIN_ROLE) {
        _validateVestingParams(
            beneficiary,
            totalAmount,
            start,
            cliffDuration,
            duration,
            slicePeriodSeconds,
            cliffUnlockPercent
        );
        
        // Check total allocation limit (CRITICAL FIX)
        uint256 maxAllocation = token.balanceOf(address(this)) + totalAllocated;
        if (totalAllocated + totalAmount > maxAllocation) {
            revert TotalAllocationExceeded();
        }
        
        vestingSchedules[beneficiary].push(
            VestingSchedule({
                initialized: true,
                totalAmount: totalAmount,
                released: 0,
                start: start,
                cliff: start + cliffDuration,
                duration: duration,
                slicePeriodSeconds: slicePeriodSeconds,
                cliffUnlockPercent: cliffUnlockPercent
            })
        );
        
        totalAllocated += totalAmount;
        uint256 index = vestingSchedules[beneficiary].length - 1;
        emit VestingCreated(beneficiary, index, totalAmount);
        emit VestingModified(beneficiary, index);
    }

    /**
     * @notice Finalize a vesting schedule to make it immutable (CRITICAL SECURITY FIX)
     * @param beneficiary Address of the beneficiary
     * @param index Index of the vesting schedule
     */
    function finalizeVesting(address beneficiary, uint256 index) 
        external 
        onlyRole(MULTISIG_ADMIN_ROLE) 
    {
        if (index >= vestingSchedules[beneficiary].length) revert InvalidVestingIndex();
        if (vestingFinalized[beneficiary][index]) revert VestingAlreadyFinalized();
        
        VestingSchedule storage schedule = vestingSchedules[beneficiary][index];
        if (!schedule.initialized) revert VestingNotInitialized();
        
        vestingFinalized[beneficiary][index] = true;
        emit VestingFinalized(beneficiary, index);
    }

    /**
     * @notice Add a vesting schedule with merkle proof verification
     * @param beneficiary Address of the beneficiary
     * @param totalAmount Total amount to be vested
     * @param start Start time of vesting
     * @param cliffDuration Duration of cliff period
     * @param duration Total vesting duration
     * @param slicePeriodSeconds Period between vesting slices
     * @param cliffUnlockPercent Percentage unlocked at cliff
     * @param merkleProof Merkle proof for verification
     */
    function addVestingScheduleWithProof(
        address beneficiary,
        uint256 totalAmount,
        uint256 start,
        uint256 cliffDuration,
        uint256 duration,
        uint256 slicePeriodSeconds,
        uint256 cliffUnlockPercent,
        bytes32[] calldata merkleProof
    ) external {
        if (merkleRoot == bytes32(0)) revert MerkleRootNotSet();
        
        bytes32 leaf = keccak256(abi.encodePacked(
            beneficiary,
            totalAmount,
            start,
            cliffDuration,
            duration,
            slicePeriodSeconds,
            cliffUnlockPercent
        ));
        
        if (!MerkleProofUpgradeable.verify(merkleProof, merkleRoot, leaf)) {
            revert InvalidMerkleProof();
        }
        
        _validateVestingParams(
            beneficiary,
            totalAmount,
            start,
            cliffDuration,
            duration,
            slicePeriodSeconds,
            cliffUnlockPercent
        );
        
        vestingSchedules[beneficiary].push(
            VestingSchedule({
                initialized: true,
                totalAmount: totalAmount,
                released: 0,
                start: start,
                cliff: start + cliffDuration,
                duration: duration,
                slicePeriodSeconds: slicePeriodSeconds,
                cliffUnlockPercent: cliffUnlockPercent
            })
        );
        
        emit VestingCreated(beneficiary, vestingSchedules[beneficiary].length - 1, totalAmount);
    }

    /**
     * @notice Add multiple vesting schedules in batch
     * @param beneficiaries Array of beneficiary addresses
     * @param totalAmounts Array of total amounts
     * @param starts Array of start times
     * @param cliffDurations Array of cliff durations
     * @param durations Array of total durations
     * @param slicePeriodSeconds Array of slice periods
     * @param cliffUnlockPercents Array of cliff unlock percentages
     */
    function addBatchVestingSchedules(
        address[] calldata beneficiaries,
        uint256[] calldata totalAmounts,
        uint256[] calldata starts,
        uint256[] calldata cliffDurations,
        uint256[] calldata durations,
        uint256[] calldata slicePeriodSeconds,
        uint256[] calldata cliffUnlockPercents
    ) external onlyRole(MULTISIG_ADMIN_ROLE) {
        uint256 length = beneficiaries.length;
        
        if (length == 0) revert EmptyArray();
        if (length > MAX_BATCH_SIZE) revert BatchSizeExceeded();
        if (length != totalAmounts.length) revert ArrayLengthMismatch();
        if (length != starts.length) revert ArrayLengthMismatch();
        if (length != cliffDurations.length) revert ArrayLengthMismatch();
        if (length != durations.length) revert ArrayLengthMismatch();
        if (length != slicePeriodSeconds.length) revert ArrayLengthMismatch();
        if (length != cliffUnlockPercents.length) revert ArrayLengthMismatch();
        
        for (uint256 i = 0; i < length; i++) {
            _validateVestingParams(
                beneficiaries[i],
                totalAmounts[i],
                starts[i],
                cliffDurations[i],
                durations[i],
                slicePeriodSeconds[i],
                cliffUnlockPercents[i]
            );
            
            vestingSchedules[beneficiaries[i]].push(
                VestingSchedule({
                    initialized: true,
                    totalAmount: totalAmounts[i],
                    released: 0,
                    start: starts[i],
                    cliff: starts[i] + cliffDurations[i],
                    duration: durations[i],
                    slicePeriodSeconds: slicePeriodSeconds[i],
                    cliffUnlockPercent: cliffUnlockPercents[i]
                })
            );
            
            emit VestingCreated(
                beneficiaries[i], 
                vestingSchedules[beneficiaries[i]].length - 1, 
                totalAmounts[i]
            );
        }
    }

    /*//////////////////////////////////////////////////////////////
                        CLAIMING FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Claim vested tokens for a specific vesting schedule
     * @param index Index of the vesting schedule
     */
    function claim(uint256 index) external whenNotPaused nonReentrant {
        claimFor(msg.sender, index);
    }

    /**
     * @notice Claim vested tokens for a beneficiary
     * @param beneficiary Address of the beneficiary
     * @param index Index of the vesting schedule
     */
    function claimFor(address beneficiary, uint256 index) public whenNotPaused nonReentrant {
        if (beneficiary == address(0)) revert InvalidAddress();
        if (index >= vestingSchedules[beneficiary].length) revert InvalidVestingIndex();
        
        VestingSchedule storage schedule = vestingSchedules[beneficiary][index];
        if (!schedule.initialized) revert VestingNotInitialized();

        uint256 releasable = computeReleasableAmount(schedule);
        if (releasable == 0) revert NoTokensAvailable();

        schedule.released += releasable;
        
        if (!token.transfer(beneficiary, releasable)) revert TransferFailed();

        emit TokensClaimed(beneficiary, index, releasable);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Get vesting information for a beneficiary
     * @param beneficiary Address of the beneficiary
     * @return schedules Array of vesting schedules
     * @return releasable Array of releasable amounts
     */
    function getVestingInfo(address beneficiary) external view returns (
        VestingSchedule[] memory schedules,
        uint256[] memory releasable
    ) {
        uint256 count = vestingSchedules[beneficiary].length;
        schedules = new VestingSchedule[](count);
        releasable = new uint256[](count);

        for (uint256 i = 0; i < count; i++) {
            schedules[i] = vestingSchedules[beneficiary][i];
            releasable[i] = computeReleasableAmount(schedules[i]);
        }
    }

    /**
     * @notice Compute the releasable amount for a vesting schedule
     * @param schedule The vesting schedule
     * @return The amount that can be released
     */
    function computeReleasableAmount(VestingSchedule memory schedule) public view returns (uint256) {
        if (!schedule.initialized || schedule.totalAmount == 0) {
            return 0;
        }
        
        if (block.timestamp < schedule.cliff) {
            return 0;
        } else if (block.timestamp >= schedule.start + schedule.duration) {
            return schedule.totalAmount - schedule.released;
        } else {
            uint256 vestedAmount = 0;
            
            // Cliff unlock happens only once
            if (block.timestamp >= schedule.cliff && schedule.cliffUnlockPercent > 0) {
                uint256 cliffAmount = (schedule.totalAmount * schedule.cliffUnlockPercent) / 100;
                vestedAmount = cliffAmount;
            }

            // Linear vesting calculation for remainder
            uint256 timeFromStart = block.timestamp - schedule.start;
            uint256 remainingAmount = schedule.totalAmount - ((schedule.totalAmount * schedule.cliffUnlockPercent) / 100);
            
            if (timeFromStart > 0) {
                uint256 vestedSlices = timeFromStart / schedule.slicePeriodSeconds;
                uint256 totalSlices = schedule.duration / schedule.slicePeriodSeconds;
                
                if (totalSlices > 0) {
                    uint256 linearVested = (remainingAmount * vestedSlices) / totalSlices;
                    vestedAmount += linearVested;
                }
            }

            // Ensure we don't exceed total amount
            if (vestedAmount > schedule.totalAmount) {
                vestedAmount = schedule.totalAmount;
            }
            
            return vestedAmount > schedule.released ? vestedAmount - schedule.released : 0;
        }
    }

    /**
     * @notice Get the total pool balance
     * @return The token balance of this contract
     */
    function getPoolBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    /**
     * @notice Get the total locked tokens for a beneficiary
     * @param beneficiary Address of the beneficiary
     * @return total Total locked amount
     */
    function getTotalLocked(address beneficiary) external view returns (uint256 total) {
        VestingSchedule[] storage schedules = vestingSchedules[beneficiary];
        for (uint256 i = 0; i < schedules.length; i++) {
            total += schedules[i].totalAmount - schedules[i].released;
        }
    }

    /**
     * @notice Get user pool status
     * @param beneficiary Address of the beneficiary
     * @return poolBalance Current pool balance
     * @return totalLocked Total locked tokens for the beneficiary
     */
    function getUserPoolStatus(address beneficiary) external view returns (
        uint256 poolBalance,
        uint256 totalLocked
    ) {
        poolBalance = token.balanceOf(address(this));
        VestingSchedule[] storage schedules = vestingSchedules[beneficiary];
        for (uint256 i = 0; i < schedules.length; i++) {
            totalLocked += schedules[i].totalAmount - schedules[i].released;
        }
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
     * @notice Admin withdraw tokens from the pool
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function adminWithdraw(address to, uint256 amount) external onlyRole(MULTISIG_ADMIN_ROLE) nonReentrant {
        if (token.balanceOf(address(this)) < amount) revert InsufficientPoolBalance();
        if (!token.transfer(to, amount)) revert TransferFailed();
        
        emit AdminWithdraw(to, amount);
    }

    /**
     * @notice Deposit tokens to the pool
     * @param amount Amount to deposit
     */
    function depositTokens(uint256 amount) external nonReentrant {
        if (!token.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        
        emit TokensDeposited(msg.sender, amount);
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyRole(MULTISIG_ADMIN_ROLE) {
        _pause();
        emit EmergencyAction("pause", msg.sender);
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyRole(MULTISIG_ADMIN_ROLE) {
        _unpause();
        emit EmergencyAction("unpause", msg.sender);
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    
    /**
     * @notice Validate vesting parameters
     * @param beneficiary Address of the beneficiary
     * @param totalAmount Total amount to be vested
     * @param start Start time of vesting
     * @param cliffDuration Duration of cliff period
     * @param duration Total vesting duration
     * @param slicePeriodSeconds Period between vesting slices
     * @param cliffUnlockPercent Percentage unlocked at cliff
     */
    function _validateVestingParams(
        address beneficiary,
        uint256 totalAmount,
        uint256 start,
        uint256 cliffDuration,
        uint256 duration,
        uint256 slicePeriodSeconds,
        uint256 cliffUnlockPercent
    ) internal view {
        // XSC3: Zero address validation
        if (beneficiary == address(0)) revert InvalidAddress();
        
        // XSC3: Amount validation with sanity checks
        if (totalAmount == 0) revert InvalidAmount();
        
        // XSC4: Total amount sanity check - prevent extremely large amounts
        uint256 maxSupply = 1_000_000_000 * 10**18; // 1 billion tokens max
        if (totalAmount > maxSupply) revert ExcessiveAmount();
        
        // XSC4: Time consistency checks
        if (start < block.timestamp) revert StartTimeInPast();
        
        // Prevent start time too far in the future (max 10 years)
        if (start > block.timestamp + 10 * 365 days) revert StartTimeTooFarInFuture();
        
        if (cliffDuration > duration) revert CliffExceedsDuration();
        if (duration == 0 || slicePeriodSeconds == 0) revert InvalidDuration();
        
        // XSC4: Duration sanity checks
        if (duration > 10 * 365 days) revert DurationTooLong(); // Max 10 years
        if (slicePeriodSeconds < 1 days) revert SlicePeriodTooShort(); // Min 1 day slice
        if (slicePeriodSeconds > duration) revert SlicePeriodExceedsDuration(); // Slice can't exceed duration
        
        if (cliffUnlockPercent > MAX_CLIFF_PERCENT) revert InvalidCliffPercent();
        
        // XSC4: Ensure cliff + start doesn't overflow
        if (start + cliffDuration < start) revert TimeOverflow();
        if (start + duration < start) revert TimeOverflow();
    }

    /**
     * @notice Authorize upgrade with timelock and multisig requirements
     * @param newImplementation Address of the new implementation
     */
    function _authorizeUpgrade(address newImplementation) internal override {
        if (msg.sender != address(timelock)) revert UpgradeOnlyViaTimelock();
        if (!hasRole(MULTISIG_ADMIN_ROLE, tx.origin)) revert UpgradeRequiresMultisigAdmin();
        
        // Silence unused parameter warning
        newImplementation;
    }
}