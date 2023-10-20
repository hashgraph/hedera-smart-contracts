// SPDX-License-Identifier: UNLICENSED
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

    function testPanicError0x01() external pure {
        assert(false);
    }

    function testPanicError0x11() external pure returns(uint8) {
        uint8 test = 255;
        uint8 test2 = 1;
        return test + test2;
    }

    function testPanicError0x12() external pure returns(uint8) {
        uint8 number1 = 5;
        uint8 number2 = 12-12;
        return number1 / number2;
    }

    function testPanicError0x21() external pure {
        int testValue = -1;
        Button value = Button(testValue);
    }

    function testPanicError0x22() external pure returns(uint8) {
        return 0;
    }

    function testPanicError0x31() external {
       someArray.pop();
    }

    function testPanicError0x32() external view returns(uint) {
       return anotherArray[5];
    }

    function testPanicError0x41() external pure returns(uint[] memory) {
       uint[] memory largeArray = new uint[](2**64);
    }

    function testPanicError0x51() external pure returns(uint) {
       function (uint, uint) internal pure returns (uint) funcPtr;

       return funcPtr(5, 6);
    }

    function getSomeArray() external view returns(uint[] memory) {
       return someArray;
    }
    
}
