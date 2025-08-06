// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";

contract HypeyVesting is Initializable, OwnableUpgradeable, PausableUpgradeable, UUPSUpgradeable, AccessControlUpgradeable {
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

    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    address public immutable trustedInitializer;
    IERC20Upgradeable public token;
    bytes32 public merkleRoot;
    bool public ownerInitialized;
    bytes32 public constant MULTISIG_ADMIN_ROLE = keccak256("MULTISIG_ADMIN_ROLE");
    TimelockControllerUpgradeable public timelock;
    mapping(address => VestingSchedule[]) public vestingSchedules;

    event VestingCreated(address indexed beneficiary, uint256 index, uint256 totalAmount);
    event TokensClaimed(address indexed beneficiary, uint256 index, uint256 amount);
    event MerkleRootUpdated(bytes32 newMerkleRoot);
    event TokensDeposited(address indexed from, uint256 amount);
    event AdminWithdraw(address indexed to, uint256 amount);
    event VestingInitialized(address indexed token, address indexed owner, address indexed timelock); // ZSC5: Missing event emission

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        trustedInitializer = msg.sender;
        _disableInitializers();
    }

    // Step 1: Initialize with token and initial owner
    function initialize(address tokenAddress, address _owner, address payable timelockAddress) public initializer {
        require(msg.sender == trustedInitializer, "Unauthorized initializer");
        require(tokenAddress != address(0), "Invalid token address"); // ZSC7: Consistent error handling
        require(_owner != address(0), "Invalid owner address"); // ZSC7: Consistent error handling
        require(timelockAddress != address(0), "Invalid timelock address"); // ZSC7: Consistent error handling
        
        __Ownable_init();
        __Pausable_init();
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
        
        emit VestingInitialized(tokenAddress, _owner, timelockAddress); // ZSC5: Missing event emission
    }

    // Step 2: Assign ownership after deployment (once only, optional if owner set above)
    // Only allow initializeOwner if not already initialized


    function setMerkleRoot(bytes32 newRoot) external onlyOwner {
        merkleRoot = newRoot;
        emit MerkleRootUpdated(newRoot);
    }

    // Add event for vesting modification
    event VestingModified(address indexed beneficiary, uint256 index);
    event EmergencyAction(string action, address executor);
    function addVestingSchedule(
        address beneficiary,
        uint256 totalAmount,
        uint256 start,
        uint256 cliffDuration,
        uint256 duration,
        uint256 slicePeriodSeconds,
        uint256 cliffUnlockPercent
    ) external onlyRole(MULTISIG_ADMIN_ROLE) {
        require(beneficiary != address(0), "HypeyVesting: Zero address");
        require(totalAmount > 0, "HypeyVesting: Zero amount prohibited");
        require(start >= block.timestamp, "HypeyVesting: Start in past");
        require(cliffDuration <= duration, "HypeyVesting: Cliff > duration");
        require(duration > 0 && slicePeriodSeconds > 0, "HypeyVesting: Invalid duration");
        require(cliffUnlockPercent <= 100, "HypeyVesting: Invalid %");
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
        emit VestingModified(beneficiary, vestingSchedules[beneficiary].length - 1);
    }
    
    // XSC1: Merkle Root functionality for batch vesting
    // Merkle root batch vesting is implemented and validated
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
        require(merkleRoot != bytes32(0), "Merkle root not set");
        bytes32 leaf = keccak256(abi.encodePacked(
            beneficiary,
            totalAmount,
            start,
            cliffDuration,
            duration,
            slicePeriodSeconds,
            cliffUnlockPercent
        ));
        require(MerkleProofUpgradeable.verify(merkleProof, merkleRoot, leaf), "Invalid merkle proof");
        require(beneficiary != address(0), "Invalid beneficiary address");
        require(duration > 0 && slicePeriodSeconds > 0, "Invalid duration or slice");
        require(cliffUnlockPercent <= 100, "Invalid cliff %");
        require(totalAmount > 0, "Total amount must be greater than 0");
        require(start > 0, "Start time must be greater than 0");
        require(cliffDuration <= duration, "Cliff duration cannot exceed total duration");
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

    function claimFor(address beneficiary, uint256 index) public whenNotPaused {
        require(beneficiary != address(0), "Invalid beneficiary address"); // XSC4: Input validation
        require(index < vestingSchedules[beneficiary].length, "Invalid vesting schedule index"); // XSC5: Consistent error messages
        VestingSchedule storage schedule = vestingSchedules[beneficiary][index];
        require(schedule.initialized, "Vesting schedule not found"); // XSC5: Consistent error messages

        uint256 releasable = computeReleasableAmount(schedule);
        require(releasable > 0, "No tokens available for claim"); // XSC5: Consistent error messages

        schedule.released += releasable;
        require(token.transfer(beneficiary, releasable), "Token transfer failed");

        emit TokensClaimed(beneficiary, index, releasable);
    }

    function claim(uint256 index) external whenNotPaused {
        claimFor(msg.sender, index);
    }

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
            
            // XSC2: Fixed calculation - cliff unlock happens only once
            if (block.timestamp >= schedule.cliff && schedule.cliffUnlockPercent > 0) {
                uint256 cliffAmount = (schedule.totalAmount * schedule.cliffUnlockPercent) / 100;
                vestedAmount = cliffAmount;
            }

            // XSC2: Fixed linear vesting calculation for remainder
            uint256 timeFromStart = block.timestamp - schedule.start;
            uint256 remainingAmount = schedule.totalAmount - ((schedule.totalAmount * schedule.cliffUnlockPercent) / 100);
            
            if (timeFromStart > 0) {
                // Use precise calculation to avoid rounding errors
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
    
    // Batch vesting functionality for multiple addresses
    function addBatchVestingSchedules(
        address[] calldata beneficiaries,
        uint256[] calldata totalAmounts,
        uint256[] calldata starts,
        uint256[] calldata cliffDurations,
        uint256[] calldata durations,
        uint256[] calldata slicePeriodSeconds,
        uint256[] calldata cliffUnlockPercents
    ) external onlyRole(MULTISIG_ADMIN_ROLE) {
        require(beneficiaries.length == totalAmounts.length, "Array length mismatch");
        require(beneficiaries.length == starts.length, "Array length mismatch");
        require(beneficiaries.length == cliffDurations.length, "Array length mismatch");
        require(beneficiaries.length == durations.length, "Array length mismatch");
        require(beneficiaries.length == slicePeriodSeconds.length, "Array length mismatch");
        require(beneficiaries.length == cliffUnlockPercents.length, "Array length mismatch");
        require(beneficiaries.length > 0, "Empty arrays");
        require(beneficiaries.length <= 100, "Too many beneficiaries"); // Prevent gas limit issues
        
        for (uint256 i = 0; i < beneficiaries.length; i++) {
            require(beneficiaries[i] != address(0), "Invalid beneficiary address");
            require(durations[i] > 0 && slicePeriodSeconds[i] > 0, "Invalid duration or slice");
            require(cliffUnlockPercents[i] <= 100, "Invalid cliff %");
            require(totalAmounts[i] > 0, "Total amount must be greater than 0");
            require(starts[i] >= block.timestamp, "Start time cannot be in the past");
            require(cliffDurations[i] <= durations[i], "Cliff duration cannot exceed total duration");
            
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
            emit VestingCreated(beneficiaries[i], vestingSchedules[beneficiaries[i]].length - 1, totalAmounts[i]);
        }
    }

    function getPoolBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function getTotalLocked(address beneficiary) external view returns (uint256 total) {
        VestingSchedule[] storage schedules = vestingSchedules[beneficiary];
        for (uint256 i = 0; i < schedules.length; i++) {
            total += schedules[i].totalAmount - schedules[i].released;
        }
    }

    function adminWithdraw(address to, uint256 amount) external onlyRole(MULTISIG_ADMIN_ROLE) {
        require(token.balanceOf(address(this)) >= amount, "Insufficient pool balance");
        require(token.transfer(to, amount), "Withdraw failed");
        emit AdminWithdraw(to, amount);
    }

    function depositTokens(uint256 amount) external {
        require(token.transferFrom(msg.sender, address(this), amount), "Deposit failed");
        emit TokensDeposited(msg.sender, amount);
    }

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

    function pause() external onlyRole(MULTISIG_ADMIN_ROLE) {
        _pause();
        emit EmergencyAction("pause", msg.sender);
    }

    function unpause() external onlyRole(MULTISIG_ADMIN_ROLE) {
        _unpause();
        emit EmergencyAction("unpause", msg.sender);
    }
    
    function builder() external pure returns (string memory) {
        return "TOPAY DEV TEAM";
    }
    
    // === UUPS Upgrade Authorization ===
    // VSC1: Upgradeable Contract Backdoor - Require timelock AND multisig
    function _authorizeUpgrade(address newImplementation) internal override {
        require(msg.sender == address(timelock), "Upgrade only via timelock");
        require(hasRole(MULTISIG_ADMIN_ROLE, tx.origin), "Upgrade requires multisig admin");
    }
}