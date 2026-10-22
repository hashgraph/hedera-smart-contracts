// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "./Modifiers.sol";
import "./A.sol";

contract B is Modifiers, A {

    constructor(uint256 _baseValue) Modifiers(_baseValue){
        
    }    
    
    function show() public override(Modifiers, A) pure returns(string memory) {
        return "This is the overriding contract B";
    }
}