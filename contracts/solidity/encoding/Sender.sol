// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Receiver.sol";

contract Sender {
    Receiver public receiver;

    constructor(address _receiver) {
        receiver = Receiver(_receiver);
    }

    function sendData(uint256 data) public {
        // Using abi.encodeWithSignature to create the data payload
        bytes memory payload = abi.encodeWithSignature("receiveData(uint256)", data);

        // Making an external call using the encoded payload
        (bool success,) = address(receiver).call(payload);
        require(success, "External call failed");
    }
}