// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract SimpleStore {
    uint256 public value;

    function setValue(uint256 newValue) public {
        value = newValue;
    }
}
