// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract DataAllocation {
    uint256 a = 0;
    uint256 b = 12;

    /// mstore - mem[p…(p+32)) := v
    /// mload - mem[p…(p+32))
    function allocateMemory(uint256 p, uint256 v) external pure returns (uint256 n) {
        assembly {
            mstore(p, v)
            n := mload(p)
        }
        return n;
    }

    /// mstore8 - mem[p] := v & 0xff (only modifies a single byte)
    /// mload - mem[p…(p+32))
    function allocateMemory8(uint256 p, uint8 v) external pure returns (uint8 n) {
        bytes1 value;
        assembly {
            mstore8(p, v)
            value := mload(p)
        }
        n = uint8(value);
    }

    /// sload - storage[p]
    function sload(uint256 p) external view returns (uint256 n) {
        assembly {
            n := sload(p)
        }
    }

    /// sstore - storage[p] := v
    function sstore(uint256 p, uint256 v) external {
        assembly {
            sstore(p, v)
        }
    }
}

