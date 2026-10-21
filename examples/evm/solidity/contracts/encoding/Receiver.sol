// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract Receiver {
    event ReceivedData(uint256 data);

    function receiveData(uint256 data) external {
        emit ReceivedData(data);
    }
}
