// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract Bitwise {
    /// bitwise “not” of x (every bit of x is negated)
    /// example x = 2 => not(x) = -3
    /// explanation: x = 2 => binaryX = 0|0010 => ~binaryX = 1|1101
    ///              1's complement (flip bit) 1sX = 1|0010
    ///              2's complement (add 1) 2sX = 1|0010 + 1 = 1|0011 => -3    
    function not(int256 x) external pure returns (int256 result) {
        assembly {
            result := not(x)
        }
    }

    /// bitwise “and” of x and y
    function and(int256 x, int256 y) external pure returns (int256 result) {
        assembly {
            result := and(x, y)
        }
    }

    /// bitwise or” of x and y
    function or(int256 x, int256 y) external pure returns (int256 result) {
        assembly {
            result := or(x, y)
        }
    }

    /// bitwise “xor” of x and y
    function xor(int256 x, int256 y) external pure returns (int256 result) {
        assembly {
            result := xor(x, y)
        }
    }

    /// nth byte of x, where the most significant byte is the 0th byte
    function extractbyteat(uint256 n, uint256 x) external pure returns (uint256 result) {
        assembly {
            result := byte(n , x)
        }
    }

    /// logical shift left y by x bits
    function shl(int256 x, int256 y) external pure returns (int256 result) {
        assembly {
            result := shl(x, y)
        }
    }

    /// logical shift right y by x bits
    function shr(uint256 x, uint256 y) external pure returns (uint256 result) {
        assembly {
            result := shr(x, y)
        }
    }

    /// signed arithmetic shift right y by x bits
    function sar(int256 x, int256 y) external pure returns (int256 result) {
        assembly {
            result := sar(x, y)
        }
    }
}

