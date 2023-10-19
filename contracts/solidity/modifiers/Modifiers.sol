// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Modifiers {
    uint256 public data;
    address public owner;

    constructor(uint256 _initialData) {
        data = _initialData;
        owner = msg.sender;
    }

    function addPure(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b;
    }

    function makePayment() public payable {
        require(msg.value > 0, "Payment amount should be greater than 0");
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }    

    function getData() public view returns (uint256) {
        return data;
    }
}
