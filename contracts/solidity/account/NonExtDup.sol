// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract NonExtDup {
    function ping() external pure returns (string memory){
        return "pong";
    }
}
