// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CCLXVesting
 * @notice Upgradeable vesting contract for ERC20 tokens.
 *
 * Features:
 *  - UUPS upgradeable
 *  - Role-based access: ADMIN_ROLE (DEFAULT_ADMIN_ROLE)
 *  - Multiple vesting schedules per beneficiary
 *  - Cliff + linear vesting
 *  - Optional revocable schedules
 *  - Funded via ERC20 token transfers by ADMIN
 */

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract CCLXVesting is Initializable, AccessControlUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    bytes32 public constant ADMIN_ROLE = 0x00;

    IERC20Upgradeable public token;

    struct Schedule {
        address beneficiary;
        uint256 totalAmount;
        uint256 released;
        uint64 start;
        uint64 cliff;
        uint64 duration;
        bool revocable;
        bool revoked;
    }

    mapping(uint256 => Schedule) public schedules;
    mapping(address => uint256[]) public beneficiaryScheduleIds;
    uint256 public nextScheduleId;
    uint256 public availableFunds;

    event Funded(address indexed from, uint256 amount, uint256 availableFunds);
    event ScheduleCreated(uint256 indexed scheduleId, address indexed beneficiary, uint256 amount, uint64 start, uint64 cliff, uint64 duration, bool revocable);
    event Released(uint256 indexed scheduleId, address indexed beneficiary, uint256 amount);
    event Revoked(uint256 indexed scheduleId, address indexed beneficiary, uint256 vestedAmount, uint256 returnedAmount);
    event WithdrawUnallocated(address indexed to, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function initialize(address admin, address tokenAddress) external initializer {
        require(admin != address(0), "Vesting: admin zero");
        require(tokenAddress != address(0), "Vesting: token zero");

        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        _setupRole(ADMIN_ROLE, admin);
        token = IERC20Upgradeable(tokenAddress);
        nextScheduleId = 1;
    }

    // ---------------------------
    // Funding
    // ---------------------------

    function fund(uint256 amount) external nonReentrant onlyRole(ADMIN_ROLE) {
        require(amount > 0, "Vesting: zero amount");
        token.safeTransferFrom(msg.sender, address(this), amount);
        availableFunds += amount;
        emit Funded(msg.sender, amount, availableFunds);
    }

    function withdrawUnallocated(address to, uint256 amount) external nonReentrant onlyRole(ADMIN_ROLE) {
        require(to != address(0), "Vesting: to zero");
        require(amount <= availableFunds, "Vesting: insufficient funds");
        availableFunds -= amount;
        token.safeTransfer(to, amount);
        emit WithdrawUnallocated(to, amount);
    }

    // ---------------------------
    // Schedule management
    // ---------------------------

    function createSchedule(
        address beneficiary,
        uint256 amount,
        uint64 start,
        uint64 cliffDuration,
        uint64 duration,
        bool revocable
    ) external onlyRole(ADMIN_ROLE) returns (uint256) {
        require(beneficiary != address(0), "Vesting: beneficiary zero");
        require(amount > 0, "Vesting: amount zero");
        require(duration > 0, "Vesting: duration zero");
        require(cliffDuration <= duration, "Vesting: cliff > duration");
        require(amount <= availableFunds, "Vesting: insufficient funds");

        uint64 cliffTimestamp = start + cliffDuration;
        uint256 id = nextScheduleId++;
        schedules[id] = Schedule({
            beneficiary: beneficiary,
            totalAmount: amount,
            released: 0,
            start: start,
            cliff: cliffTimestamp,
            duration: duration,
            revocable: revocable,
            revoked: false
        });

        beneficiaryScheduleIds[beneficiary].push(id);
        availableFunds -= amount;

        emit ScheduleCreated(id, beneficiary, amount, start, cliffTimestamp, duration, revocable);
        return id;
    }

    function getScheduleIdsForBeneficiary(address beneficiary) external view returns (uint256[] memory) {
        return beneficiaryScheduleIds[beneficiary];
    }

    // ---------------------------
    // Vesting & release
    // ---------------------------

    function vestedAmount(uint256 scheduleId) public view returns (uint256) {
        Schedule storage s = schedules[scheduleId];
        require(s.totalAmount > 0, "Vesting: schedule not found");

        if (block.timestamp < s.cliff) return 0;
        else if (block.timestamp >= uint256(s.start) + uint256(s.duration) || s.revoked) return s.totalAmount;
        else return (s.totalAmount * (block.timestamp - s.start)) / s.duration;
    }

    function releasableAmount(uint256 scheduleId) external view returns (uint256) {
        Schedule storage s = schedules[scheduleId];
        if (s.totalAmount == 0) return 0;
        if (s.revoked) return s.totalAmount > s.released ? s.totalAmount - s.released : 0;
        uint256 vested = vestedAmount(scheduleId);
        return vested > s.released ? vested - s.released : 0;
    }

    function release(uint256 scheduleId) external nonReentrant {
        Schedule storage s = schedules[scheduleId];
        require(s.totalAmount > 0, "Vesting: schedule not found");
        require(!s.revoked, "Vesting: revoked");

        uint256 vested = vestedAmount(scheduleId);
        require(vested > s.released, "Vesting: nothing to release");
        uint256 unreleased = vested - s.released;

        s.released += unreleased;
        token.safeTransfer(s.beneficiary, unreleased);
        emit Released(scheduleId, s.beneficiary, unreleased);
    }

    function revoke(uint256 scheduleId) external nonReentrant onlyRole(ADMIN_ROLE) {
        Schedule storage s = schedules[scheduleId];
        require(s.totalAmount > 0, "Vesting: schedule not found");
        require(s.revocable, "Vesting: not revocable");
        require(!s.revoked, "Vesting: already revoked");

        uint256 vested = vestedAmount(scheduleId);
        uint256 releasable = vested > s.released ? vested - s.released : 0;

        if (releasable > 0) {
            s.released += releasable;
            token.safeTransfer(s.beneficiary, releasable);
            emit Released(scheduleId, s.beneficiary, releasable);
        }

        uint256 unvested = s.totalAmount - s.released;
        s.revoked = true;

        if (unvested > 0) {
            token.safeTransfer(msg.sender, unvested);
        }

        emit Revoked(scheduleId, s.beneficiary, vested, unvested);
    }

    function totalSchedules() external view returns (uint256) {
        return nextScheduleId - 1;
    }

    // ---------------------------
    // Upgradeability
    // ---------------------------

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(ADMIN_ROLE) {}

    uint256[48] private __gap;
}
