//SPDX-License-Identifier: Apache-2.0

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../ReentrancyGuard/ReentrancyGuardTestReceiver.sol";

contract ReentrancyGuardTestSender is ReentrancyGuard {
    uint256 public counter = 0;

    constructor() payable {}

    function reentrancyTest() external {
        counter = counter + 1;
        (bool sent,) = msg.sender.call{value: 100000000}("");
    }

    function reentrancyTestNonReentrant() external nonReentrant {
        counter = counter + 1;
        (bool sent,) = msg.sender.call{value: 100000000}("");
    }

    receive() external payable {}
}
