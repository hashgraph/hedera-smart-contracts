// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract Modifiers {
    uint256 public data;
    address public owner;

    uint256 public constant MAX_SUPPLY = 1000000;  
    uint256 public immutable deploymentTimestamp;  

    event RegularEvent(address indexed from, address indexed to, uint256 value, string message);
    event AnonymousEvent(address indexed sender, uint256 value) anonymous;

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

    function triggerRegularEvent(address _to, uint256 _value, string memory _message) public {
        emit RegularEvent(msg.sender, _to, _value, _message);
    }

    function triggerAnonymousEvent(uint256 _value) public {
        emit AnonymousEvent(msg.sender, _value);
    }

    function show() public virtual returns(string memory) {
        return "This is the base Modifiers contract";
    }    
    
}
