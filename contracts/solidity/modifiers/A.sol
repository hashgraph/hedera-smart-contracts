// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract A{
      
    function show() public pure virtual returns(string memory) {
        return "This is contract A";
    }
}