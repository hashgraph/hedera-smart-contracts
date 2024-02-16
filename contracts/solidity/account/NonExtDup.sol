// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

contract NonExtDup {
    function ping() external pure returns (string memory){
        return "pong";
    }
}
