// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

contract BlsBn254 {
    // negated generator of G1
    uint256 constant public nG1x = 1;
    uint256 constant public nG1y = 21888242871839275222246405745257275088696311157297823662689037894645226208581;

    // negated generator of G2
    uint256 constant public nG2x1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant public nG2x0 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant public nG2y1 = 17805874995975841540914202342111839520379459829704422454583296818431106115052;
    uint256 constant public nG2y0 = 13392588948715843804641432497768002650278120570034223513918757245338268106653;

    // nG1  - negative curve of G1
    // nG2  - negative curve of G2
    // H(m) - 32 bytes message hash
    // e    - pair
    // σ    - signature
    // pk   - public key

    // e(G1, σ) ?= e(pk, H(m))
    function verifySingleG1PubKeyG2SigAndMsg(
        uint256[2] memory pubKeyG1,
        uint256[4] memory msgG2,
        uint256[4] memory sigG2
    ) external view returns (bool) {
        uint256[12] memory input = [
            nG1x, nG1y,
            sigG2[1], sigG2[0], sigG2[3], sigG2[2],
            pubKeyG1[0], pubKeyG1[1],
            msgG2[1], msgG2[0], msgG2[3], msgG2[2]
        ];

        uint256[1] memory out;
        bool success;
        assembly {
            success := staticcall(gas(), 0x8, input, 0x180, out, 0x20)
        }

        return out[0] != 0;
    }

    // e(σ, G2) ?= e(H(m), pk)
    function verifySingleG1SigAndMsgG2PubKey(
        uint256[4] memory pubKeyG2,
        uint256[2] memory msgG1,
        uint256[2] memory sigG1
    ) external view returns (bool) {
        uint256[12] memory input = [
            sigG1[0], sigG1[1],
            nG2x1, nG2x0, nG2y1, nG2y0,
            msgG1[0], msgG1[1],
            pubKeyG2[1], pubKeyG2[0], pubKeyG2[3], pubKeyG2[2]
        ];

        uint256[1] memory out;
        bool success;
        assembly {
            success := staticcall(gas(), 0x8, input, 0x180, out, 0x20)
        }

        return out[0] != 0;
    }

    // e(σ[aggr], G2) ?= e(H(m), pk)
    function verifyMultipleG1SigAndMsgG2PubKey(
        uint256[4][] memory pubKeysG2,
        uint256[2][] memory msgsG1,
        uint256[2] memory sigG1
    ) external view returns (bool) {
        uint256 size = pubKeysG2.length;
        uint256 inputSize = (size + 1) * 6;
        uint256[] memory input = new uint256[](inputSize);
        input[0] = sigG1[0];
        input[1] = sigG1[1];
        input[2] = nG2x1;
        input[3] = nG2x0;
        input[4] = nG2y1;
        input[5] = nG2y0;
        for (uint256 i = 0; i < size; i++) {
            input[i * 6 + 6] = msgsG1[i][0];
            input[i * 6 + 7] = msgsG1[i][1];
            input[i * 6 + 8] = pubKeysG2[i][1];
            input[i * 6 + 9] = pubKeysG2[i][0];
            input[i * 6 + 10] = pubKeysG2[i][3];
            input[i * 6 + 11] = pubKeysG2[i][2];
        }

        uint256[1] memory out;
        bool success;
        assembly {
            success := staticcall(
            gas(),
            8,
            add(input, 0x20),
            mul(inputSize, 0x20),
            out,
            0x20
            )
        }

        return out[0] != 0;
    }

    // e(G1, σ[aggr]) ?= e(pk, H(m))
    function verifyMultipleG1PubKeyG2SigAndMsg(
        uint256[2][] memory pubKeysG1,
        uint256[4][] memory msgsG2,
        uint256[4] memory sigG2
    ) external view returns (bool) {
        uint256 size = pubKeysG1.length;
        uint256 inputSize = (size + 1) * 6;
        uint256[] memory input = new uint256[](inputSize);
        input[0] = nG1x;
        input[1] = nG1y;
        input[2] = sigG2[1];
        input[3] = sigG2[0];
        input[4] = sigG2[3];
        input[5] = sigG2[2];
        for (uint256 i = 0; i < size; i++) {
            input[i * 6 + 6] = pubKeysG1[i][0];
            input[i * 6 + 7] = pubKeysG1[i][1];
            input[i * 6 + 8] = msgsG2[i][1];
            input[i * 6 + 9] = msgsG2[i][0];
            input[i * 6 + 10] = msgsG2[i][3];
            input[i * 6 + 11] = msgsG2[i][2];
        }

        uint256[1] memory out;
        bool success;
        assembly {
            success := staticcall(
            gas(),
            8,
            add(input, 0x20),
            mul(inputSize, 0x20),
            out,
            0x20
            )
        }

        return out[0] != 0;
    }
}
