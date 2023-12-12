// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract Arithmetic {
    string public name = "Arithmetic";
    uint256 maxUint = type(uint256).max;
    uint256 minUint = type(uint256).min;

    function checkName() external view returns (string memory){
        return name;
    }

    function add() external {
        name = "Arithmetic check if NOT reverted";
        maxUint = maxUint + 1;
    }

    function add2() external {
        uint256 tmp = maxUint;
        name = "Arithmetic check if NOT reverted";
        tmp += 100;
    }

    function mul() external {
        uint8 maxUint8 = type(uint8).max;
        name = "Arithmetic check if NOT reverted";
        maxUint8 * 2;
    }

    function dec() external {
        // This subtraction will revert on underflow.
        name = "Arithmetic check if NOT reverted";
        minUint--;
    }

    function sub() external {
        uint256 tmp = minUint;
        name = "Arithmetic check if NOT reverted";
        tmp -= 1;
    }

    function negativeHasMoreValues() external {
        int tmp;
        int x = type(int).min;
        name = "Arithmetic check if NOT reverted";
        tmp = -x;
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
