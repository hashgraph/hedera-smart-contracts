// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Modifiers {
    uint256 public data;
    address public owner;

    uint256 public constant MAX_SUPPLY = 1000000;  
    uint256 public immutable deploymentTimestamp;  

    event Transfer(address indexed from, address indexed to, uint256 value, string message);

    constructor(uint256 _initialData) {
        data = _initialData;
        owner = msg.sender;
        deploymentTimestamp = block.timestamp;
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

    function emitExampleTransferEvent(address _to, uint256 _value, string memory _message) public {
        emit Transfer(msg.sender, _to, _value, _message);
    }
}
