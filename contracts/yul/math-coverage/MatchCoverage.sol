// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract MathCoverage {

    /// addition
    function add(int256 x, int256 y) external pure returns (int256 result){
        assembly {
            result := add(x, y)
        }
    }

    /// subtraction
    function sub(int256 x, int256 y) external pure returns (int256 result) {
        assembly {
            result := sub(x, y)
        }
    }

    /// multiply
    function mul(int256 x, int256 y) external pure returns (int256 result) {
        assembly {
            result := mul(x, y)
        }
    }

    /// division - x / y or 0 if y == 0
    function div(uint256 x, uint256 y) external pure returns (uint256 result) {
        assembly {
            result := div(x, y)
        }
    }

    /// signed division - x / y, for signed numbers in two’s complement, 0 if y == 0
    function sdiv(int256 x, int256 y) external pure returns (int256 result) {
        assembly {
            result := sdiv(x, y)
        }
    }

    /// modulous - x % y, 0 if y == 0
    function mod(uint256 x, uint256 y) external pure returns (uint256 result) {
        assembly {
            result := mod(x, y)
        }
    }

    /// signed modulous - x % y, for signed numbers in two’s complement, 0 if y == 0
    function smod(int256 x, int256 y) external pure returns (int256 result) {
        assembly {
            result := smod(x, y)
        }
    }

    /// exponent -  x to the power of y
    function exp(int256 x, int256 y) external pure returns (int256 result) {
        assembly {
            result := exp(x, y)
        }
    }

    /// less than -  1 if x < y, 0 otherwise
    function lt(uint256 x, uint256 y) external pure returns (uint256 result) {
        assembly {
            result := lt(x, y)
        }
    }

    /// greater than -  1 if x > y, 0 otherwise
    function gt(uint256 x, uint256 y) external pure returns (uint256 result) {
        assembly {
            result := gt(x, y)
        }
    }

    /// signed less than - 1 if x < y, 0 otherwise, for signed numbers in two’s complement
    function slt(int256 x, int256 y) external pure returns (int256 result) {
        assembly {
            result := slt(x, y)
        }
    }

    /// signed greater than -  1 if x > y, 0 otherwise, for signed numbers in two’s complement
    function sgt(int256 x, int256 y) external pure returns (int256 result) {
        assembly {
            result := sgt(x, y)
        }
    }

    /// equal - 1 if x == y, 0 otherwise
    function eq(int256 x, int256 y) external pure returns (int256 result) {
        assembly {
            result := eq(x, y)
        }
    }

    /// is zero - 1 if x == 0, 0 otherwise
    function iszero(int256 x) external pure returns (int256 result) {
        assembly {
            result := iszero(x)
        }
    }

    /// add modulous - (x + y) % m with arbitrary precision arithmetic, 0 if m == 0
    function addMod(int256 x, int256 y, int256 m) external pure returns (int256 result) {
        assembly {
            result := addmod(x, y, m)
        }
    }

    /// multiply modulous - (x * y) % m with arbitrary precision arithmetic, 0 if m == 0
    function mulMod(int256 x, int256 y, int256 m) external pure returns (int256 result) {
        assembly {
            result := mulmod(x, y, m)
        }
    }
}

