// SPDX-License-Identifier: Apache 2.0
pragma solidity ^0.8.0;

contract KZGPointEvaluation {
    address constant KZG_PRECOMPILE_ADDRESS = 0x000000000000000000000000000000000000000A;

    event ExpectedOutput(bytes result);
    function evaluateKZGProof(
        bytes32 versionedHash,
        bytes32 z,
        bytes32 y,
        bytes memory commitment,
        bytes memory proof
    ) external {
        bytes memory input = abi.encodePacked(versionedHash, z, y, commitment, proof);
        (bool success, bytes memory result) = KZG_PRECOMPILE_ADDRESS.staticcall(input);

        if (!success) {
            emit ExpectedOutput(bytes("KZGPointEvalFailure"));
        } else {
            emit ExpectedOutput(result);
        }

    }
}
