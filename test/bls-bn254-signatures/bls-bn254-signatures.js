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

  let validG1PublicKeyCallData;
  let validG1SigAndMsgCallData;

  const MAX_PERCENTAGE_DIFFERENCE = 5;

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
    const {secretKeyFr, pubKeyG1} = blsBn254Helper.createKeyPairG1Pub();
    const msgG2 = blsBn254Helper.g2FromHex(ethers.keccak256('0x160c'));
    const sigG2 = blsBn254Helper.signG2(msgG2, secretKeyFr);

    const pubKeyG1Ser = blsBn254Helper.serializeG1Point(pubKeyG1);
    const msgG2Ser = blsBn254Helper.serializeG2Point(msgG2);
    const sigG2Ser = blsBn254Helper.serializeG2Point(sigG2);

    validG1PublicKeyCallData = [
      pubKeyG1Ser, // pub G1
      msgG2Ser, // msg G2
      sigG2Ser // sig key G2
    ];

    const isEcPairingValid = await contract.verifySingleG1Pub(...validG1PublicKeyCallData);

    expect(isEcPairingValid).to.be.true;
  });


  it('single verification using G1 for signature and message and G2 for public key', async () => {
    const {secretKeyFr, pubKeyG2} = blsBn254Helper.createKeyPairG2Pub();
    const msgG1 = blsBn254Helper.g1FromHex(ethers.keccak256('0x160c'));
    const sigG1 = blsBn254Helper.signG1(msgG1, secretKeyFr);

    const pubKeyG2Ser = blsBn254Helper.serializeG2Point(pubKeyG2);
    const msgG1Ser = blsBn254Helper.serializeG1Point(msgG1);
    const sigG1Ser = blsBn254Helper.serializeG1Point(sigG1);

    validG1SigAndMsgCallData = [
      pubKeyG2Ser, // pub key G2
      msgG1Ser, // msg G1
      sigG1Ser // sig G1
    ];

    const isEcPairingValid = await contract.verifySingleG1Sig(...validG1SigAndMsgCallData);

    expect(isEcPairingValid).to.be.true;
  });

  it('gas estimation for single verification should be within a range', async () => {
    const g1PubKeyGas = await contract.verifySingleG1Pub.estimateGas(...validG1PublicKeyCallData);
    const g1SigAndMsgGas = await contract.verifySingleG1Sig.estimateGas(...validG1SigAndMsgCallData);

    const percentageDiff = 100 * Math.abs((Number(g1PubKeyGas) - Number(g1SigAndMsgGas)) / ((Number(g1PubKeyGas) + Number(g1SigAndMsgGas)) / 2));
    expect(percentageDiff).to.be.lessThanOrEqual(MAX_PERCENTAGE_DIFFERENCE);
  });
});
