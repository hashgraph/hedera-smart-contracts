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

describe('@CryptoAllowance Test Suite', () => {
  let walletA, walletB, walletC, CryptoAllowanceContract;
  const amount = 3_000_000;

  before(async () => {
    [walletA, walletB, walletC, receiver] = await ethers.getSigners();

    const CryptoAllowanceFactory = await ethers.getContractFactory(
      Constants.Contract.CryptoAllowance
    );

    CryptoAllowanceContract = await CryptoAllowanceFactory.deploy();
    await CryptoAllowanceContract.waitForDeployment();
  });

  it('Should execute hbarApprovePublic and return success response code', async () => {
    const tx = await CryptoAllowanceContract.hbarApprovePublic(
      CryptoAllowanceContract.target,
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
    const approveTx = await CryptoAllowanceContract.hbarApprovePublic(
      CryptoAllowanceContract.target,
      walletB.address,
      amount,
      Constants.GAS_LIMIT_1_000_000
    );
    await approveTx.wait();

    const allowanceTx = await CryptoAllowanceContract.hbarAllowancePublic(
      CryptoAllowanceContract.target,
      walletB.address,
      Constants.GAS_LIMIT_1_000_000
    );

    const receipt = await allowanceTx.wait();
    const responseCode = receipt.logs.find(
      (l) => l.fragment.name === 'ResponseCode'
    );
    const logs = receipt.logs.find((l) => l.fragment.name === 'HbarAllowance');

    expect(responseCode.args).to.deep.eq([22n]);
    expect(logs.args[0]).to.eq(CryptoAllowanceContract.target);
    expect(logs.args[1]).to.eq(walletB.address);
    expect(logs.args[2]).to.eq(amount);
  });

  it('Should allow an approval on behalf of hbar owner WITH its signature', async () => {
    // update accountKeys
    const ecdsaPrivateKeys = await Utils.getHardhatSignersPrivateKeys(false);
    await utils.updateAccountKeysViaHapi(
      [CryptoAllowanceContract.target],
      [ecdsaPrivateKeys[0]] // walletA's key
    );

    const approveTx = await CryptoAllowanceContract.hbarApprovePublic(
      walletA.address,
      walletB.address,
      amount,
      Constants.GAS_LIMIT_1_000_000
    );
    await approveTx.wait();

    const allowanceTx = await CryptoAllowanceContract.hbarAllowancePublic(
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
      const tx = await CryptoAllowanceContract.hbarApprovePublic(
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
});
