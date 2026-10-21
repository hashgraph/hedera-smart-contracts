//SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

contract Reverter {

    struct SomeData {
        uint a;
        uint b;
        uint c;
        uint d;
    }

    function processLongInput() pure external {
        revert("SomeRevertReason");
    }

    function processLongOutput() pure external {
        revert("SomeRevertReason");
    }
}
