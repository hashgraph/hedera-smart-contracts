// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "./Receiver.sol";

contract Sender {
    Receiver public receiver;

    constructor(address _receiver) {
        receiver = Receiver(_receiver);
    }

    function sendDataEncodeWithSignature(uint256 data) public {
        bytes memory payload = abi.encodeWithSignature("receiveData(uint256)", data);

        (bool success,) = address(receiver).call(payload);
        require(success, "External call using abi.encodeWithSignature failed");
    }

    function sendDataEncodeCall(uint256 data) public {
        bytes memory payload = abi.encodeCall(
            Receiver(address(receiver)).receiveData,
            (data)
        );

        (bool success,) = address(receiver).call(payload);
        require(success, "External call using abi.encodeCall failed"); 
    }

}
