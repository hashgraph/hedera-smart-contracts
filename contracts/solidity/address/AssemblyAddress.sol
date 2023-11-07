// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

contract AssemblyAddress {
    function codesizeat(address addr) external view returns(uint256 size) {
        assembly {
            size := extcodesize(addr)
        }
    }

    function codehashat(address addr) external view returns (bytes32 hash) {
        assembly {
            hash := extcodehash(addr)
        }
    }

    function codecopyat(address addr) external view returns (bytes memory code) {
        assembly {
            // retrieve the size of the code, this needs assembly
            let size := extcodesize(addr)
            // allocate output byte array - this could also be done without assembly
            // by using code = new bytes(size)
            code := mload(0x40)
            // new "memory end" including padding
            mstore(0x40, add(code, and(add(add(size, 0x20), 0x1f), not(0x1f))))
            // store length in memory
            mstore(code, size)
            // actually retrieve the code, this needs assembly
            extcodecopy(addr, add(code, 0x20), 0, size)
        }
    }
}

