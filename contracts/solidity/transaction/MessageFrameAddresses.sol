// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

contract MessageFrameAddresses {
    function getTxOrigin() external view returns (address) {
        return tx.origin;
    }

    function getMsgSender() external view returns (address) {
        return msg.sender;
    }
}
