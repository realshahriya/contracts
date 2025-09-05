// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract USDT_Clone_3M_Optimized {
    string public name = "USD Test Token";
    string public symbol = "USDT-DEV";
    uint8 public constant decimals = 6;
    uint256 public totalSupply;
    address public owner;

    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowances;

    // Optional expiry: 40 days from deploy
    uint256 public immutable expiryTimestamp;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier notExpired() {
        require(block.timestamp < expiryTimestamp, "Token expired");
        _;
    }

    constructor() {
        owner = msg.sender;
        totalSupply = 3_000_000 * 10 ** decimals;
        balances[owner] = totalSupply;

        expiryTimestamp = block.timestamp + 40 days;
        emit Transfer(address(0), owner, totalSupply);
    }

    // -------------------
    // Ownership
    // -------------------
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // -------------------
    // ERC20 logic
    // -------------------
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }

    function transfer(address to, uint256 amount) external notExpired returns (bool) {
        require(to != address(0), "Invalid recipient");
        uint256 senderBalance = balances[msg.sender];
        require(senderBalance >= amount, "Insufficient balance");

        unchecked {
            balances[msg.sender] = senderBalance - amount;
            balances[to] += amount;
        }

        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function allowance(address owner_, address spender) external view returns (uint256) {
        return allowances[owner_][spender];
    }

    function transferFrom(address from, address to, uint256 amount) external notExpired returns (bool) {
        require(to != address(0), "Invalid recipient");
        uint256 fromBalance = balances[from];
        require(fromBalance >= amount, "Insufficient balance");
        uint256 allowed = allowances[from][msg.sender];
        require(allowed >= amount, "Allowance exceeded");

        unchecked {
            balances[from] = fromBalance - amount;
            balances[to] += amount;
            allowances[from][msg.sender] = allowed - amount;
        }

        emit Transfer(from, to, amount);
        return true;
    }
}
