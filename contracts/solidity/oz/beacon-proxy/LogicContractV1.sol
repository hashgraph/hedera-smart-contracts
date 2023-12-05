// SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.0;

contract LogicContractV1 {
    uint256 private value;
    event Value(uint256 value);
    event ValueChanged(uint256 newValue);

    constructor(uint256 _value) {
        value = _value;
    }

    // Stores a new value in the contract
    function store(uint256 _newValue) public {
        value = _newValue;
        emit ValueChanged(_newValue);
    }

    // Reads the last stored value
    function retrieve() public returns (uint256) {
        emit Value(value);
        return value;
    }

    // returns the square of the _input
    function square(uint256 _input) public pure returns (uint256) {
        return _input; // implementation error
    }
}
