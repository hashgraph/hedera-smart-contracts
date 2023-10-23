// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

contract Precompiles {

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

}
