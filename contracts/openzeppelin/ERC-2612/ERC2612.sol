// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract ERC2612Test is ERC20Permit {
    event Signer(address signer);
     bytes32 private constant PERMIT_TYPEHASH =
        keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

    constructor() ERC20Permit("ERC2612Test") ERC20("ERC2612Test", "$"){
    }

    function mint(uint256 mintAmount) external {
        _mint(msg.sender, mintAmount);
    }

    function permitTest(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external {
        permit(owner, spender, value, deadline, v, r, s);
    }
}
