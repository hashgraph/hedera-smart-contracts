// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

library Balances {
    function move(mapping(address => uint256) storage balances, address from, address to, uint amount) internal {
        require(balances[from] >= amount);
        require(balances[to] + amount >= balances[to]);
        balances[from] -= amount;
        balances[to] += amount;
    }
}

contract Token {
    /// storage states
    using Balances for *;
    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowed;

    /// events
    event Transfer(address from, address to, uint amount);
    event Approval(address owner, address spender, uint amount);

    /// constructor
    constructor(uint256 amount) {
        balances[msg.sender] = amount;
    }

    /// transfer `amount` from `msg.sender` to `to`
    function transfer(address to, uint amount) external returns (bool success) {
        balances.move(msg.sender, to, amount);
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    /// transfer `amount` from `from` to `to`
    function transferFrom(address from, address to, uint amount) external returns (bool success) {
        require(allowed[from][msg.sender] >= amount);
        allowed[from][msg.sender] -= amount;
        balances.move(from, to, amount);
        emit Transfer(from, to, amount);
        return true;
    }

    /// approve an `amount` of allowance for `spender`
    function approve(address spender, uint amount) external returns (bool success) {
        require(allowed[msg.sender][spender] == 0, "");
        allowed[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    /// util method to check balances of addresses
    function balanceOf(address tokenOwner) external view returns (uint balance) {
        return balances[tokenOwner];
    }

    /// util method to check allowances
    function allowance(address owner, address spender) external view returns (uint balance) {
        return allowed[owner][spender];
    }
}

