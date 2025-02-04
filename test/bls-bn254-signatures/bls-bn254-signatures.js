/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

const {expect} = require('chai');
const {ethers} = require('hardhat');
const mcl = require('mcl-wasm');

const BlsHelper = require('./blsHelper');
const Constants = require('../constants');

describe('BLS BN254 signatures', function () {
  let signers;
  let contract;
  let blsBn254Helper;

  let validSingleG1PubKeyCallData;
  let validSingleG1SigAndMsgCallData;

  const MAX_PERCENTAGE_DIFFERENCE = 1;

  before(async function () {
    signers = await ethers.getSigners();

    await mcl.init(mcl.BN_SNARK1);
    mcl.setETHserialization(true);
    mcl.setMapToMode(0);

    blsBn254Helper = new BlsHelper();

    const factory = await ethers.getContractFactory(Constants.Contract.BlsBn254);
    contract = await factory.deploy();
    await contract.waitForDeployment();
  });

  it('single verification using G1 for public key and G2 for signature and message', async () => {
    const {secretKeyFr, pubKeyG1} = blsBn254Helper.createKeyPairG1PubKey();
    const msgG2 = blsBn254Helper.g2FromHex(ethers.keccak256('0x160c'));
    const sigG2 = blsBn254Helper.signG2(msgG2, secretKeyFr);

    const pubKeyG1Ser = blsBn254Helper.serializeG1Point(pubKeyG1);
    const msgG2Ser = blsBn254Helper.serializeG2Point(msgG2);
    const sigG2Ser = blsBn254Helper.serializeG2Point(sigG2);

    validSingleG1PubKeyCallData = [
      pubKeyG1Ser,
      msgG2Ser,
      sigG2Ser
    ];

    const isEcPairingValid = await contract.verifySingleG1PubKeyG2SigAndMsg(...validSingleG1PubKeyCallData);
    expect(isEcPairingValid).to.be.true;
  });

  it('single verification using G1 for signature and message and G2 for public key', async () => {
    const {secretKeyFr, pubKeyG2} = blsBn254Helper.createKeyPairG2PubKey();
    const msgG1 = blsBn254Helper.g1FromHex(ethers.keccak256('0x160c'));
    const sigG1 = blsBn254Helper.signG1(msgG1, secretKeyFr);

    const pubKeyG2Ser = blsBn254Helper.serializeG2Point(pubKeyG2);
    const msgG1Ser = blsBn254Helper.serializeG1Point(msgG1);
    const sigG1Ser = blsBn254Helper.serializeG1Point(sigG1);

    validSingleG1SigAndMsgCallData = [
      pubKeyG2Ser,
      msgG1Ser,
      sigG1Ser
    ];

    const isEcPairingValid = await contract.verifySingleG1SigAndMsgG2PubKey(...validSingleG1SigAndMsgCallData);
    expect(isEcPairingValid).to.be.true;
  });

  it('gas estimation for single verification should be within a range', async () => {
    const pubKeyG1Gas = await contract.verifySingleG1PubKeyG2SigAndMsg.estimateGas(...validSingleG1PubKeyCallData);
    const sigAndMsgG1Gas = await contract.verifySingleG1SigAndMsgG2PubKey.estimateGas(...validSingleG1SigAndMsgCallData);

    const percentageDiff = 100 * Math.abs((Number(pubKeyG1Gas) - Number(sigAndMsgG1Gas)) / ((Number(pubKeyG1Gas) + Number(sigAndMsgG1Gas)) / 2));
    expect(percentageDiff).to.be.lessThanOrEqual(MAX_PERCENTAGE_DIFFERENCE);
  });

  for (const actors of [5, 10, 50, 100, 200]) {
    let g1PubKeyCallData;
    let g1SigAndMsgCallData;

    it(`single verification using G1 for ${actors} aggregated public key and G2 for ${actors} aggregated signature and same message`, async () => {
      let pubKeysG1Aggregated;
      let sigG2Aggregated;

      const msgG2 = blsBn254Helper.g2FromHex(ethers.keccak256('0x160c'));
      for (let i = 0; i < actors; i++) {
        const signer = blsBn254Helper.createKeyPairG1PubKey();
        const pubKeyG1 = signer.pubKeyG1;
        const sigG2 = blsBn254Helper.signG2(msgG2, signer.secretKeyFr);

        pubKeysG1Aggregated = (i === 0) ? pubKeyG1 : blsBn254Helper.pAdd(pubKeysG1Aggregated, pubKeyG1);
        sigG2Aggregated = (i === 0) ? sigG2 : blsBn254Helper.pAdd(sigG2Aggregated, sigG2);
      }

      g1PubKeyCallData = [
        blsBn254Helper.serializeG1Point(pubKeysG1Aggregated),
        blsBn254Helper.serializeG2Point(msgG2),
        blsBn254Helper.serializeG2Point(sigG2Aggregated)
      ]
      const isEcPairingValid = await contract.verifySingleG1PubKeyG2SigAndMsg(...g1PubKeyCallData);
      expect(isEcPairingValid).to.be.true;
    });

    it(`single verification using G1 for ${actors} signature and same message and G2 for ${actors} public key`, async () => {
      let pubKeysG2Aggregated;
      let sigG1Aggregated;

      const msgG1 = blsBn254Helper.g1FromHex(ethers.keccak256('0x160c'));
      for (let i = 0; i < actors; i++) {
        const signer = blsBn254Helper.createKeyPairG2PubKey();
        const pubKeyG2 = signer.pubKeyG2;
        const sigG1 = blsBn254Helper.signG1(msgG1, signer.secretKeyFr);

        pubKeysG2Aggregated = (i === 0) ? pubKeyG2 : blsBn254Helper.pAdd(pubKeysG2Aggregated, pubKeyG2);
        sigG1Aggregated = (i === 0) ? sigG1 : blsBn254Helper.pAdd(sigG1Aggregated, sigG1);
      }

      g1SigAndMsgCallData = [
        blsBn254Helper.serializeG2Point(pubKeysG2Aggregated),
        blsBn254Helper.serializeG1Point(msgG1),
        blsBn254Helper.serializeG1Point(sigG1Aggregated)
      ];

      const isEcPairingValid = await contract.verifySingleG1SigAndMsgG2PubKey(...g1SigAndMsgCallData);
      expect(isEcPairingValid).to.be.true;
    });

    it(`gas estimation for ${actors} aggregated signatures and public keys should be within a range`, async () => {
      const pubKeyG1Gas = await contract.verifySingleG1PubKeyG2SigAndMsg.estimateGas(...g1PubKeyCallData);
      const sigAndMsgG1Gas = await contract.verifySingleG1SigAndMsgG2PubKey.estimateGas(...g1SigAndMsgCallData);

      const percentageDiff = 100 * Math.abs((Number(pubKeyG1Gas) - Number(sigAndMsgG1Gas)) / ((Number(pubKeyG1Gas) + Number(sigAndMsgG1Gas)) / 2));
      expect(percentageDiff).to.be.lessThanOrEqual(MAX_PERCENTAGE_DIFFERENCE);
    });
  }

  for (const pairs of [2, 10, 20, 50, 75]) {
    let g1PubKeyCallData;
    let g1SigAndMsgCallData;

    it(`${pairs} verifications using G1 for public key G2 for signature and message`, async () => {
      let pubKeysG1Arr = [];
      let msgsG2Arr = [];
      let sigG2Aggregated;
      for (let i = 0; i < pairs; i++) {
        const signer = blsBn254Helper.createKeyPairG1PubKey();
        const msgG2 = blsBn254Helper.g2FromHex(ethers.keccak256('0x' + (5644 + i).toString()));
        const sigG2 = blsBn254Helper.signG2(msgG2, signer.secretKeyFr);

        pubKeysG1Arr.push(blsBn254Helper.serializeG1Point(signer.pubKeyG1));
        msgsG2Arr.push(blsBn254Helper.serializeG2Point(msgG2));

        sigG2Aggregated = (i === 0) ? sigG2 : blsBn254Helper.pAdd(sigG2Aggregated, sigG2);
      }

      g1PubKeyCallData = [
        pubKeysG1Arr,
        msgsG2Arr,
        blsBn254Helper.serializeG2Point(sigG2Aggregated)
      ];

      const isEcPairingValid = await contract.verifyMultipleG1PubKeyG2SigAndMsg(...g1PubKeyCallData);
      expect(isEcPairingValid).to.be.true;
    });

    it(`${pairs} verification using G1 for signature and message and G2 for public key`, async () => {
      let pubKeysG2Arr = [];
      let msgsG1Arr = [];
      let sigG1Aggregated;
      for (let i = 0; i < pairs; i++) {
        const signer = blsBn254Helper.createKeyPairG2PubKey();
        const msgG1 = blsBn254Helper.g1FromHex(ethers.keccak256('0x' + (5644 + i).toString()));
        const sigG1 = blsBn254Helper.signG1(msgG1, signer.secretKeyFr);

        pubKeysG2Arr.push(blsBn254Helper.serializeG2Point(signer.pubKeyG2));
        msgsG1Arr.push(blsBn254Helper.serializeG1Point(msgG1));

        sigG1Aggregated = (i === 0) ? sigG1 : blsBn254Helper.pAdd(sigG1Aggregated, sigG1);
      }

      g1SigAndMsgCallData = [
        pubKeysG2Arr,
        msgsG1Arr,
        blsBn254Helper.serializeG1Point(sigG1Aggregated)
      ];

      const isEcPairingValid = await contract.verifyMultipleG1SigAndMsgG2PubKey(...g1SigAndMsgCallData);
      expect(isEcPairingValid).to.be.true;
    });

    it(`gas estimation for ${pairs} verifications should be within a range`, async () => {
      const pubKeyG1Gas = await contract.verifyMultipleG1PubKeyG2SigAndMsg.estimateGas(...g1PubKeyCallData);
      const sigAndMsgG1Gas = await contract.verifyMultipleG1SigAndMsgG2PubKey.estimateGas(...g1SigAndMsgCallData);

      const percentageDiff = 100 * Math.abs((Number(pubKeyG1Gas) - Number(sigAndMsgG1Gas)) / ((Number(pubKeyG1Gas) + Number(sigAndMsgG1Gas)) / 2));
      expect(percentageDiff).to.be.lessThanOrEqual(MAX_PERCENTAGE_DIFFERENCE);
    });
  }
});
