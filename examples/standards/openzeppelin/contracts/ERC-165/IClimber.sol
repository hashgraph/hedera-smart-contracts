// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

interface Climber {
    function hasHarness() external returns (bool);
    function hasChalk() external returns (string memory);
    function hasClimbingShoes() external returns (string memory);
}

