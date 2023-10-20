// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Modifiers.sol";

contract DerivedContract is Modifiers {

    constructor(uint256 _baseValue) Modifiers(_baseValue) {
        
    }    
    
    function show() public pure override returns(string memory) {
        return "This is the derived contract";
    }
}