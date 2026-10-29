// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "./IClimber.sol";

contract ClimberSelector {
    function calculateSelector() public pure returns (bytes4) {
        Climber i;
        return i.hasHarness.selector ^ i.hasChalk.selector ^ i.hasClimbingShoes.selector;
    }

    function calculateSelectorNotSupported() public pure returns (bytes4) {
        Climber i;
        return i.hasHarness.selector ^ i.hasChalk.selector;
    }
}
