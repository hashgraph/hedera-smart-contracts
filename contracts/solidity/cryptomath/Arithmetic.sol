// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Arithmetic {
    string public name = "Arithmetic";
    uint256 maxUint = type(uint256).max;
    uint256 minUint = type(uint256).min;

    function checkName() external view returns (string memory){
        return name;
    }

    function add() external returns (bool) {
        name = "Arithmetic check if NOT reverted";
        maxUint = maxUint + 1;
        return true;
    }

    function add2() external returns (uint) {
        uint256 tmp = maxUint;
        name = "Arithmetic check if NOT reverted";
        tmp += 100;
        
        return tmp;
    }

    function mul() external returns (bool) {
        uint8 maxUint8 = type(uint8).max;
        name = "Arithmetic check if NOT reverted";
        maxUint8 * 2;

        return true;
    }

    function dec() external returns (bool) {
        // This subtraction will revert on underflow.
        name = "Arithmetic check if NOT reverted";
        minUint--;

        return true;
    }

    function sub() external returns (bool) {
        uint256 tmp = minUint;
        name = "Arithmetic check if NOT reverted";
        tmp -= 1;

        return true;
    }

    function negativeHasMoreValues() external returns (bool) {
        int tmp;
        int x = type(int).min;
        name = "Arithmetic check if NOT reverted";
        tmp = -x;

        return true;
    }

    function uncheckedAdd() external view returns (bool) {
        unchecked {
            uint256 tmp;
            tmp = maxUint + 1;

            return true;
        }
    }

    function uncheckedSub() external view returns (bool) {
        unchecked {
           uint256 tmp = minUint;
            tmp -= 1;

            return true;
        }
    }
    
}
