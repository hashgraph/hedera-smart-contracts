// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract OZERC20Mock is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}
    
    function mint(address to, uint256 amount) public virtual {
        require(amount > 0);
        _mint(to, amount);
    }
}
