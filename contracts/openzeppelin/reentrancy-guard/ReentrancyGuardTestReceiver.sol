//SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "./ReentrancyGuardTestSender.sol";

contract ReentrancyGuardTestReceiver {
    ReentrancyGuardTestSender public reentrancyGuardTestSender;
    bool nonReentrant = false;

    constructor (address payable _reentrancyGuardTestSender) {
        reentrancyGuardTestSender = ReentrancyGuardTestSender(_reentrancyGuardTestSender);
    }

    receive() external payable {
        if(address(msg.sender).balance >= 100000000 && !nonReentrant) {
            reentrancyGuardTestSender.reentrancyTest();
        } else if (nonReentrant) {
            reentrancyGuardTestSender.reentrancyTestNonReentrant();
        }
    }

    function attack() external payable {
        reentrancyGuardTestSender.reentrancyTest();
    }

    function attackNonReentrant() external payable {
        reentrancyGuardTestSender.reentrancyTestNonReentrant();
    }

    function setNonReentrant(bool _nonReentrant) external {
        nonReentrant = _nonReentrant;
    }
}
