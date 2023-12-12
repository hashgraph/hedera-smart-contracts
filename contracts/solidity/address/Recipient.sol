// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract Recipient {
    receive() external payable {}
    event msgValue(uint256 value);
    event emitMessage(string message);
    string message = "Hello World from Recipient contract!";
    uint myNumber = 5;

    function getNumber() external view returns (uint) {
        return myNumber;
    }

    function setNumber(uint number) external returns (uint) {
        return myNumber = number;
    }

    function getMessageValue() external payable {
        emit msgValue(msg.value);
    }

    function helloWorldMessage() external {
        emit emitMessage(message);
    }

    fallback() external payable {
        
    }
}
