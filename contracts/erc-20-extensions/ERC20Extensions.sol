// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC20BurnableMock is ERC20Burnable {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    function mint(address to, uint256 amount) public virtual {
        require(amount > 0);
        _mint(to, amount);
    }
}

contract ERC20CappedMock is ERC20Capped {
    constructor(string memory name, string memory symbol, uint256 cap) ERC20(name, symbol) ERC20Capped(cap){}

    function mint(address to, uint256 amount) public virtual {
        require(amount > 0);
        _mint(to, amount);
    }
}

contract ERC20PausableMock is ERC20Pausable, Ownable {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) Ownable(msg.sender){}
    
    function mint(address to, uint256 amount) public virtual {
        require(amount > 0);
        _mint(to, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
