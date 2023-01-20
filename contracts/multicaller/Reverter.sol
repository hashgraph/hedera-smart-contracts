//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract Reverter {

    struct SomeData {
        uint a;
        uint b;
        uint c;
        uint d;
    }

    function processLongInput(SomeData memory longInput) pure external returns (uint sum) {
        revert("SomeRevertReason");
    }

    function processLongOutput(
        uint24 count
    ) external pure returns (SomeData[] memory) {
        revert("SomeRevertReason");
    }
}
