//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract Receiver {

    struct SomeData {
        uint a;
        uint b;
        uint c;
        uint d;
    }

    function processLongInput(SomeData memory longInput) pure external returns (uint sum) {
        sum = 5;
    }

    function processLongOutput(
        uint24 count
    ) external pure returns (SomeData[] memory) {
        SomeData[] memory data = new SomeData[](count);
        return data;
    }
}
