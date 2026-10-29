// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.7;

contract CryptoMath {

    // addmod(uint x, uint y, uint k) returns (uint)
    function callAddMod(uint x, uint y, uint k) external pure returns (uint) {
        return addmod(x, y, k);
    }

    // mulmod(uint x, uint y, uint k) returns (uint)
    function callMulMod(uint x, uint y, uint k) external pure returns (uint) {
        return mulmod(x, y, k);
    }

    // keccak256(bytes memory) returns (bytes32)
    function callKeccak256(bytes memory input) external pure returns (bytes32) {
        return keccak256(input);
    }

    // sha256(bytes memory) returns (bytes32)
    function callSha256(bytes memory input) external pure returns (bytes32) {
        return sha256(input);
    }

    // ripemd160(bytes memory) returns (bytes20)
    function callRipemd160(bytes memory input) external pure returns (bytes20) {
        return ripemd160(input);
    }

    // ecrecover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) returns (address)
    function callEcrecover(bytes32 hash, uint8 v, bytes32 r, bytes32 s) external pure returns (address) {
        return ecrecover(hash, v, r, s);
    }
    
}
