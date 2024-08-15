/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
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

const Constants = require('../../../constants');
const { Contract } = require('ethers');
const { expect } = require('chai');
const hre = require('hardhat');
const { ethers } = hre;
const utils = require('../utils');

describe('@HRC-719 Test Suite', function () {
  let tokenCreateContract;
  let tokenAddress;
  let hrc719Contract;
  let signers;
  let hrcToken;
  let IHRC719;

  const parseCallResponseEventData = async (tx) => {
    return (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.CallResponseEvent
    )[0].args;
  };

  const decodeHexToDec = (message) => {
    message = message.replace(/^0x/, '');
    return parseInt(message, 16);
  };

  before(async function () {
    signers = await ethers.getSigners();
    tokenCreateContract = await utils.deployTokenCreateContract();
    await utils.updateAccountKeysViaHapi([
      await tokenCreateContract.getAddress(),
    ]);

    // This contract is a wrapper for the associate() and dissociate() functions
    hrc719Contract = await utils.deployHRC719Contract();
    tokenAddress = await utils.createFungibleToken(
      tokenCreateContract,
      signers[0].address
    );
    await utils.updateTokenKeysViaHapi(tokenAddress, [
      await tokenCreateContract.getAddress(),
    ]);

    // create an interface for calling functions via redirectForToken()
    IHRC719 = new ethers.Interface(
      (await hre.artifacts.readArtifact('IHRC719')).abi
    );
    // create a contract object for the token
    hrcToken = new Contract(tokenAddress, IHRC719, signers[0]);
    console.log('hrc719Contract: ', await hrc719Contract.getAddress());
    console.log('signer: ', signers[0].address);
    console.log('tokenAddress: ', tokenAddress);
  });

  it('should be able to associate() to the token from a contract', async function () {
    const txAssociate = await hrc719Contract.associate(
      tokenAddress,
      Constants.GAS_LIMIT_1_000_000
    );
    const receiptAssociate = await txAssociate.wait();
    expect(receiptAssociate).to.exist;
    expect(receiptAssociate.status).to.eq(1);
  });

  xit('should be able to call isAssociated() to the token from a contract when associated', async function () {
    const txDissociate = await hrc719Contract.isAssociated(
      tokenAddress,
      Constants.GAS_LIMIT_1_000_000
    );
    const receiptDissociate = await txDissociate.wait();
    expect(receiptDissociate).to.exist;
    expect(receiptDissociate).to.eq(true);
  });

  xit('should be able to call isAssociated() to the token from a different unassociated signer', async function () {
    const txDissociate = await hrc719Contract.connect(signers[1]).isAssociated(
      tokenAddress,
      Constants.GAS_LIMIT_1_000_000
    );
    const receiptDissociate = await txDissociate.wait();
    expect(receiptDissociate).to.exist;
    expect(receiptDissociate).to.eq(false);
  });

  it('should be able to disssociate() to the token from a contract', async function () {
    const txDissociate = await hrc719Contract.dissociate(
      tokenAddress,
      Constants.GAS_LIMIT_1_000_000
    );
    const receiptDissociate = await txDissociate.wait();
    expect(receiptDissociate).to.exist;
    expect(receiptDissociate.status).to.eq(1);
  });

  xit('should be able to call isAssociated() to the token from a contract after dissociation', async function () {
    const txDissociate = await hrc719Contract.isAssociated(
      tokenAddress
    );

    const receiptDissociate = await txDissociate.wait();
    expect(receiptDissociate).to.exist;
    expect(receiptDissociate).to.eq(false);
  });

  it('should be able to associate() to the token from an EOA', async function () {
    const txAssociate = await hrcToken.associate(Constants.GAS_LIMIT_1_000_000);
    const receiptAssociate = await txAssociate.wait();
    expect(receiptAssociate).to.exist;
    expect(receiptAssociate.status).to.eq(1);
  });

  it('should be able to call isAssociated() to the token from an EOA when associated', async function () {
    const isAssociated = await hrcToken.isAssociated();
    expect(isAssociated).to.exist;
    expect(isAssociated).to.eq(true);
  });

  it('should be able to call isAssociated() to the token from a separate unassociated EOA', async function () {
    const isAssociated = await hrcToken.connect(signers[1]).isAssociated();
    expect(isAssociated).to.exist;
    expect(isAssociated).to.eq(false);
  });

  it('should be able to dissociate() to the token from an EOA', async function () {
    const txDissociate = await hrcToken.dissociate(
      Constants.GAS_LIMIT_1_000_000
    );
    const receiptDissociate = await txDissociate.wait();
    expect(receiptDissociate).to.exist;
    expect(receiptDissociate.status).to.eq(1);
  });

  it('should be able to execute associate() via redirectForToken', async function () {
    const encodedFunc = IHRC719.encodeFunctionData('associate()');
    const tx = await tokenCreateContract.redirectForToken(
      tokenAddress,
      encodedFunc,
      Constants.GAS_LIMIT_1_000_000
    );
    const [success, result] = await parseCallResponseEventData(tx);
    expect(success).to.eq(true);
    expect(decodeHexToDec(result)).to.eq(Constants.TX_SUCCESS_CODE);
  });

  it('should be able to execute dissociate() via redirectForToken', async function () {
    const encodedFunc = IHRC719.encodeFunctionData('dissociate()');
    const tx = await tokenCreateContract.redirectForToken(
      tokenAddress,
      encodedFunc,
      Constants.GAS_LIMIT_1_000_000
    );
    const [success, result] = await parseCallResponseEventData(tx);
    expect(success).to.eq(true);
    expect(decodeHexToDec(result)).to.eq(Constants.TX_SUCCESS_CODE);
  });
});
