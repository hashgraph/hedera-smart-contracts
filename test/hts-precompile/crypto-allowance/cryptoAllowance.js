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

const utils = require('../utils');
const Utils = require('../utils');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../constants');
const {
  pollForNewSignerBalanceUsingProvider,
} = require('../../../utils/helpers');

describe('@CryptoAllowance Test Suite', () => {
  let walletA, walletB, walletC, cryptoAllowanceContract;
  const amount = 3000;

  before(async () => {
    [walletA, walletB, walletC, receiver] = await ethers.getSigners();

    const CryptoAllowanceFactory = await ethers.getContractFactory(
      Constants.Contract.CryptoAllowance
    );

    cryptoAllowanceContract = await CryptoAllowanceFactory.deploy();
    await cryptoAllowanceContract.waitForDeployment();
  });

  it('Should execute hbarApprovePublic and return success response code', async () => {
    const tx = await cryptoAllowanceContract.hbarApprovePublic(
      cryptoAllowanceContract.target,
      walletA.address,
      amount,
      Constants.GAS_LIMIT_1_000_000
    );
    const receipt = await tx.wait();
    const responseCode = receipt.logs.find(
      (l) => l.fragment.name === 'ResponseCode'
    );
    expect(responseCode.args).to.deep.eq([22n]);
  });

  it('Should execute hbarAllowancePublic and return an event with the allowance information', async () => {
    const approveTx = await cryptoAllowanceContract.hbarApprovePublic(
      cryptoAllowanceContract.target,
      walletB.address,
      amount,
      Constants.GAS_LIMIT_1_000_000
    );
    await approveTx.wait();

    const allowanceTx = await cryptoAllowanceContract.hbarAllowancePublic(
      cryptoAllowanceContract.target,
      walletB.address,
      Constants.GAS_LIMIT_1_000_000
    );

    const receipt = await allowanceTx.wait();
    const responseCode = receipt.logs.find(
      (l) => l.fragment.name === 'ResponseCode'
    );
    const logs = receipt.logs.find((l) => l.fragment.name === 'HbarAllowance');

    expect(responseCode.args).to.deep.eq([22n]);
    expect(logs.args[0]).to.eq(cryptoAllowanceContract.target);
    expect(logs.args[1]).to.eq(walletB.address);
    expect(logs.args[2]).to.eq(amount);
  });

  it('Should allow an approval on behalf of hbar owner WITH its signature', async () => {
    // update accountKeys
    const ecdsaPrivateKeys = await Utils.getHardhatSignersPrivateKeys(false);
    await utils.updateAccountKeysViaHapi(
      [cryptoAllowanceContract.target],
      [ecdsaPrivateKeys[0]] // walletA's key
    );

    const approveTx = await cryptoAllowanceContract.hbarApprovePublic(
      walletA.address,
      walletB.address,
      amount,
      Constants.GAS_LIMIT_1_000_000
    );
    await approveTx.wait();

    const allowanceTx = await cryptoAllowanceContract.hbarAllowancePublic(
      walletA.address,
      walletB.address,
      Constants.GAS_LIMIT_1_000_000
    );

    const receipt = await allowanceTx.wait();
    const responseCode = receipt.logs.find(
      (l) => l.fragment.name === 'ResponseCode'
    );
    const logs = receipt.logs.find((l) => l.fragment.name === 'HbarAllowance');

    expect(responseCode.args).to.deep.eq([22n]);
    expect(logs.args[0]).to.eq(walletA.address);
    expect(logs.args[1]).to.eq(walletB.address);
    expect(logs.args[2]).to.eq(amount);
  });

  it('Should NOT allow an approval on behalf of hbar owner WINTHOUT its signature', async () => {
    try {
      const tx = await cryptoAllowanceContract.hbarApprovePublic(
        walletB.address, // random EOA hbar owner
        walletC.address,
        amount,
        Constants.GAS_LIMIT_1_000_000
      );
      await tx.wait();
      expect(false).to.be.true;
    } catch (e) {
      expect(e).to.exist;
      expect(e.code).to.eq(Constants.CALL_EXCEPTION);
    }
  });

  it('Should allow owner to grant an allowance to spender using IHRC632 and spender to transfer allowance to receiver on behalf of owner', async () => {
    // set up IHRC632
    const IHRC632 = new ethers.Interface(
      (await hre.artifacts.readArtifact('IHRC632')).abi
    );

    const walletAIHrc632 = new ethers.Contract(
      walletA.address,
      IHRC632,
      walletA
    );

    // grant an allowance to cryptoAllowanceContract
    const approveTx = await walletAIHrc632.hbarApprove(
      cryptoAllowanceContract.target,
      amount,
      Constants.GAS_LIMIT_1_000_000
    );
    await approveTx.wait();

    // cryptoTransferPublic
    const cryptoTransfers = {
      transfers: [
        {
          accountID: walletA.address,
          amount: amount * -1,
          isApproval: false,
        },
        {
          accountID: walletC.address,
          amount,
          isApproval: false,
        },
      ],
    };
    const tokenTransferList = [];

    const walletABefore = await walletA.provider.getBalance(walletA.address);
    const walletCBefore = await walletC.provider.getBalance(walletC.address);

    const cryptoTransferTx = await cryptoAllowanceContract.cryptoTransferPublic(
      cryptoTransfers,
      tokenTransferList,
      Constants.GAS_LIMIT_1_000_000
    );

    const cryptoTransferReceipt = await cryptoTransferTx.wait();

    const responseCode = cryptoTransferReceipt.logs.find(
      (l) => l.fragment.name === 'ResponseCode'
    ).args[0];

    const walletAAfter = await pollForNewSignerBalanceUsingProvider(
      walletA.provider,
      walletA.address,
      walletABefore
    );

    const walletCAfter = await pollForNewSignerBalanceUsingProvider(
      walletC.provider,
      walletC.address,
      walletCBefore
    );

    expect(responseCode).to.equal(22n);
    expect(walletABefore > walletAAfter).to.equal(true);
    expect(walletCBefore < walletCAfter).to.equal(true);
  });

  it('Should NOT allow a spender to spend hbar on behalf of owner without an allowance grant', async () => {
    const cryptoTransfers = {
      transfers: [
        {
          accountID: walletB.address,
          amount: amount * -1,
          isApproval: false,
        },
        {
          accountID: walletC.address,
          amount,
          isApproval: false,
        },
      ],
    };
    const tokenTransferList = [];

    try {
      const cryptoTransferTx = await cryptoAllowanceContract
        .connect(walletB)
        .cryptoTransferPublic(
          cryptoTransfers,
          tokenTransferList,
          Constants.GAS_LIMIT_1_000_000
        );
      await cryptoTransferTx.wait();
      expect(true).to.eq(false);
    } catch (e) {
      expect(e).to.exist;
      expect(e.code).to.eq(Constants.CALL_EXCEPTION);
    }
  });
});
