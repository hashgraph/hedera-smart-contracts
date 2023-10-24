// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

contract Precompiles {

    event DebugBytes(bytes data);
    event DebugUint256(uint256 value);

    function verifySignature(
        bytes32 hashedMessage,
        uint8 v,
        bytes32 r,
        bytes32 s,
        address expectedSigner
    ) public pure returns (bool) {
        // Recover the address from the signature
        address recoveredAddress = ecrecover(hashedMessage, v, r, s);

        // Compare the recovered address with the expected signer's address
        return recoveredAddress == expectedSigner;
    }

    function computeSha256Hash(string memory input) public pure returns (bytes32) {
        return sha256(abi.encodePacked(input));
    }

    function computeRipemd160Hash(string memory input) public pure returns (bytes20) {
        return ripemd160(abi.encodePacked(input));
    }

    function getIdentity(uint256 input) public pure returns (uint256) {
        uint256 output;
        assembly {
            // Load data from the call data at the specified index
            output := calldataload(4) // 4 bytes offset for the function selector
        }
        return output;
    }  

    function modExp(uint256 base, uint256 exponent, uint256 modulus) public returns (uint256 result) {
        // Input length for base, exponent, and modulus
        uint256 length = 32; // for simplicity, assuming all inputs are 32 bytes

        emit DebugUint256(base);
        emit DebugUint256(exponent);
        emit DebugUint256(modulus);
        emit DebugBytes(bytes.concat(abi.encode(base), abi.encode(exponent), abi.encode(modulus)));

        assembly {
            // Free memory pointer
            let p := mload(0x40)

            // Define length and position for base, exponent, and modulus
            mstore(p, length)           // Length of base
            mstore(add(p, 0x20), length) // Length of exponent
            mstore(add(p, 0x40), length) // Length of modulus
            mstore(add(p, 0x60), base)   // Base
            mstore(add(p, 0x80), exponent) // Exponent
            mstore(add(p, 0xA0), modulus)  // Modulus

            // Call the MODEXP precompiled contract at address 0x5
            if iszero(call(not(0), 0x05, 0, p, 0xC0, p, 0x20)) {
                revert(0, 0)
            }

            // Load the result
            result := mload(p)
        }
    }  
}
