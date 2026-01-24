// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CenceraUserData
 * @dev Replaces traditional database for User Profile & Settings.
 * Allows users to store their public identity on-chain.
 * WARNING: All data stored here is public. Do not store API Keys, passwords, or other secrets.
 */
contract CenceraUserData {

    struct UserProfile {
        bool isRegistered;
        bool isVerified;
        string name;
        string username;
        string bio;
        uint64 joinedAt;
        uint64 lastActive;
    }

    uint256 public constant MAX_BIO_WORDS = 100;
    uint256 public constant MAX_BIO_BYTES = 512;
    uint256 public constant MIN_USERNAME_LENGTH = 3;
    uint256 public constant MAX_USERNAME_LENGTH = 32;

    address public owner;
    mapping(address => UserProfile) private _users;
    mapping(bytes32 => address) private _usernameOwner;

    event UserRegistered(address indexed user, string name, string username);
    event ProfileUpdated(address indexed user, string name, string username, string bio);
    event VerificationUpdated(address indexed user, bool isVerified);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero owner");
        address previousOwner = owner;
        owner = newOwner;
        emit OwnershipTransferred(previousOwner, newOwner);
    }

    /**
     * @dev Register or Update Identity
     */
    function updateProfile(string calldata _name, string calldata _username, string calldata _bio) external {
        bytes memory bioBytes = bytes(_bio);
        require(bioBytes.length <= MAX_BIO_BYTES, "bio too long");

        uint256 wordCount = _countWords(_bio);
        require(wordCount <= MAX_BIO_WORDS, "too many words");

        bytes memory newUsernameBytes = bytes(_username);
        if (newUsernameBytes.length > 0) {
            require(
                newUsernameBytes.length >= MIN_USERNAME_LENGTH &&
                newUsernameBytes.length <= MAX_USERNAME_LENGTH,
                "username length"
            );
            for (uint256 i = 0; i < newUsernameBytes.length; i++) {
                bytes1 c = newUsernameBytes[i];
                bool isLower = (c >= 0x61 && c <= 0x7A); // a-z
                bool isDigit = (c >= 0x30 && c <= 0x39); // 0-9
                bool isSymbol = (c == 0x5F || c == 0x2E); // '_' or '.'
                require(isLower || isDigit || isSymbol, "username chars");
            }
        }

        bytes32 newUsernameKey = newUsernameBytes.length > 0 ? keccak256(newUsernameBytes) : bytes32(0);

        if (newUsernameKey != bytes32(0)) {
            address currentOwner = _usernameOwner[newUsernameKey];
            require(currentOwner == address(0) || currentOwner == msg.sender, "username taken");
        }

        if (_users[msg.sender].isRegistered) {
            bytes memory oldUsernameBytes = bytes(_users[msg.sender].username);
            if (oldUsernameBytes.length > 0) {
                bytes32 oldKey = keccak256(oldUsernameBytes);
                if (oldKey != newUsernameKey && _usernameOwner[oldKey] == msg.sender) {
                    _usernameOwner[oldKey] = address(0);
                }
            }
        }

        if (!_users[msg.sender].isRegistered) {
            _users[msg.sender].isRegistered = true;
            _users[msg.sender].joinedAt = uint64(block.timestamp);
            emit UserRegistered(msg.sender, _name, _username);
        }
        
        _users[msg.sender].name = _name;
        _users[msg.sender].username = _username;
        _users[msg.sender].bio = _bio;
        _users[msg.sender].lastActive = uint64(block.timestamp);
        if (newUsernameKey != bytes32(0)) {
            _usernameOwner[newUsernameKey] = msg.sender;
        }
        
        emit ProfileUpdated(msg.sender, _name, _username, _bio);
    }

    /**
     * @dev Get user's full profile
     */
    function getUserData(address user) external view returns (
        bool isRegistered,
        bool isVerified,
        string memory name,
        string memory username,
        string memory bio,
        uint64 joinedAt,
        uint64 lastActive
    ) {
        UserProfile storage u = _users[user];
        return (u.isRegistered, u.isVerified, u.name, u.username, u.bio, u.joinedAt, u.lastActive);
    }

    function setVerified(address user, bool verified) external onlyOwner {
        require(_users[user].isRegistered, "user not found");
        _users[user].isVerified = verified;
        emit VerificationUpdated(user, verified);
    }

    function _countWords(string calldata text) private pure returns (uint256) {
        bytes calldata b = bytes(text);
        uint256 len = b.length;
        if (len == 0) return 0;

        uint256 words = 0;
        bool inWord = false;

        for (uint256 i = 0; i < len; i++) {
            bytes1 c = b[i];
            bool isSpace = (c == 0x20 || c == 0x0A || c == 0x0D || c == 0x09);

            if (!isSpace && !inWord) {
                inWord = true;
                words++;
                if (words > MAX_BIO_WORDS) {
                    return words;
                }
            } else if (isSpace && inWord) {
                inWord = false;
            }
        }

        return words;
    }
}
