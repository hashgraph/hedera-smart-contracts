// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

contract BlsBn254 {
    struct G1Point {
        uint x;
        uint y;
    }

    struct G2Point {
        uint[2] x;
        uint[2] y;
    }

    // Negated generator of G1
    uint256 constant public nG1x = 1;
    uint256 constant public nG1y = 21888242871839275222246405745257275088696311157297823662689037894645226208581;

    // Negated generator of G2
    uint256 constant public nG2x1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant public nG2x0 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant public nG2y1 = 17805874995975841540914202342111839520379459829704422454583296818431106115052;
    uint256 constant public nG2y0 = 13392588948715843804641432497768002650278120570034223513918757245338268106653;

    function verifySingleG1Pub(
        uint256[2] memory pubKeyG1,
        uint256[4] memory messageG2,
        uint256[4] memory sigG2
    ) external view returns (bool) {
        uint256[12] memory input = [nG1x, nG1y, sigG2[1], sigG2[0], sigG2[3], sigG2[2], pubKeyG1[0], pubKeyG1[1], messageG2[1], messageG2[0], messageG2[3], messageG2[2]];
        uint256[1] memory out;
        bool success;
        assembly {
            success := staticcall(gas(), 8, input, 384, out, 32)
        }
        return out[0] != 0;
    }

    function verifySingleG1Sig(
        uint256[4] memory pubKey,
        uint256[2] memory message,
        uint256[2] memory signature
    ) external view returns (bool) {
        uint256[12] memory input = [signature[0], signature[1], nG2x1, nG2x0, nG2y1, nG2y0, message[0], message[1], pubKey[1], pubKey[0], pubKey[3], pubKey[2]];
        uint256[1] memory out;
        bool success;
        assembly {
            success := staticcall(gas(), 8, input, 384, out, 32)
        }

        return out[0] != 0;
    }
}
