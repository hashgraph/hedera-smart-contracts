//SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

contract Receiver {

    uint public counter = 0;
    event Counter(uint);

    struct SomeData {
        uint a;
        uint b;
        uint c;
        uint d;
    }

    function processLongInput() pure external returns (uint result) {
        result = 5;
    }

    function processLongOutput(
        uint24 count
    ) external pure returns (SomeData[] memory) {
        SomeData[] memory data = new SomeData[](count);
        return data;
    }

    function processLongInputTx() payable external returns (uint) {
        counter += 1;
        return counter;
    }

    function processLongOutputTx(
        uint24 count
    ) external payable returns (SomeData[] memory) {
        counter += 1;
        SomeData[] memory data = new SomeData[](count);
        emit Counter(counter);
        return data;
    }

    receive() external payable {}
    fallback() external payable {}
}
