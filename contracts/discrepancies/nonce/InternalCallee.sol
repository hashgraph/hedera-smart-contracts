// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

contract Sample {}

contract InternalCallee {
    uint calledTimes = 0;

    function factorySample() external returns (address) {
        return address(new Sample());
    }

    function externalFunction() external returns (uint) {
        return ++calledTimes;
    }

    function revertWithRevertReason() public returns (bool) {
        if (calledTimes < 0) {++calledTimes;}
        revert("RevertReason");
    }

    function revertWithoutRevertReason() public pure returns (bool) {
        revert();
    }

    function selfDestruct(address payable _addr) external {
        selfdestruct(_addr);
    }
}
