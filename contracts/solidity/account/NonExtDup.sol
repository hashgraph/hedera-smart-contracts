// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.23;

contract NonExtDup {
    function ping() external pure returns (string memory){
        return "pong";
    }
}
