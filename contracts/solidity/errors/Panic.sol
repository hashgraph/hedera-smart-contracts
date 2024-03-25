// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract Panic {
    uint[] someArray;
    uint[] anotherArray = [1, 2, 3];

    enum Button {
        ON,
        OFF
    }
    constructor() {
    }

    function verifyPanicError0x01() external pure {
        assert(false);
    }

    function verifyPanicError0x11() external pure returns(uint8) {
        uint8 test = 255;
        uint8 test2 = 1;
        return test + test2;
    }

    function verifyPanicError0x12() external pure returns(uint8) {
        uint8 number1 = 5;
        uint8 number2 = 12-12;
        return number1 / number2;
    }

    function verifyPanicError0x21() external pure {
        int testValue = -1;
        Button(testValue);
    }

    function verifyPanicError0x22() external pure returns(uint8) {
        return 0;
    }

    function verifyPanicError0x31() external {
       someArray.pop();
    }

    function verifyPanicError0x32() external view returns(uint) {
       return anotherArray[5];
    }

    function verifyPanicError0x41() external pure returns(uint[] memory) {
       uint[] memory largeArray = new uint[](2**64);
       return largeArray;
    }

    function verifyPanicError0x51() external pure returns(uint) {
       function (uint, uint) internal pure returns (uint) funcPtr;

       return funcPtr(5, 6);
    }

    function getSomeArray() external view returns(uint[] memory) {
       return someArray;
    }
    
}
