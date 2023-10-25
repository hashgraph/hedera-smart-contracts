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

    function ecAdd(uint256[2] memory point1, uint256[2] memory point2) public view returns (uint256[2] memory result) {
        // Input format: (x1, y1, x2, y2)
        uint256[4] memory input;
        input[0] = point1[0];
        input[1] = point1[1];
        input[2] = point2[0];
        input[3] = point2[1];

        assembly {
            // Call the ecAdd precompile at address 0x6
            if iszero(staticcall(not(0), 0x6, input, 0x80, result, 0x40)) {
                revert(0, 0)
            }
        }
    }    

    function ecMul(uint256[2] memory point, uint256 k, uint256 prime) public returns (uint256[2] memory result) {
        // Ensure the input point is on the curve
        require(isOnCurve(point, prime), "Point is not on the curve");

        // Use the precompiled contract for the ecMul operation
        // The precompiled contract for ecMul is at address 0x07
        assembly {
            // Free memory pointer
            let p := mload(0x40)
            
            // Store input data in memory
            mstore(p, mload(point))
            mstore(add(p, 0x20), mload(add(point, 0x20)))
            mstore(add(p, 0x40), k)
            
            // Call the precompiled contract
            // Input: 0x60 bytes (point x, point y, scalar k)
            // Output: 0x40 bytes (resulting point x', y')
            if iszero(call(not(0), 0x07, 0, p, 0x60, p, 0x40)) {
                revert(0, 0)
            }
            
            // Load the result from memory
            result := p
        }
    }    

    function isOnCurve(uint256[2] memory point, uint256 prime) public pure returns (bool) {
        uint256 x = point[0];
        uint256 y = point[1];
        uint256 lhs = mulmod(y, y, prime);
        uint256 rhs = addmod(mulmod(mulmod(x, x, prime), x, prime), 3, prime);
        return lhs == rhs;
    }    
}
