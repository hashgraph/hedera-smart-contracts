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

const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../constants');

describe('@solidityequiv1 Solidity Account Non Existing Test Suite', function () {
  let contract, randomAddress, hasError, fakeContract, contractDup, factory, wallet, provider;
  const NO_IMPLEMENTED_ERROR = 'NotImplementedError';
  const ADDR_DOES_NOT_EXIST = 'nonExtAddr is not defined';

  before(async function () {
    const signers = await ethers.getSigners();
    wallet = signers[0];
    randomAddress = ethers.Wallet.createRandom().address;
    factory = await ethers.getContractFactory(Constants.Contract.NonExisting);
    const factoryDup = await ethers.getContractFactory(
      Constants.Contract.NonExtDup
    );
    fakeContract = factory.attach(randomAddress);
    provider = ethers.getDefaultProvider();

    contractDup = await factoryDup.deploy();
    contract = await factory.deploy(await contractDup.getAddress());
  });

  beforeEach(function () {
    hasError = false;
  });

  it('should confirm `call` on a non existing account', async function () {
    // call to non existing account
    const MINIMAL_GAS_USED = 21432
    const initialBalance = await contract.balanceOf(wallet.address);
    const tx = await fakeContract.callOnNonExistingAccount(randomAddress, {gasLimit: 1000000});
    receipt = await tx.wait();
    const finalBalance = await contract.balanceOf(wallet.address);
    const diff = initialBalance - finalBalance;

    expect(diff > MINIMAL_GAS_USED).to.be.true;
    expect(receipt.status).to.equal(1);
  });

  it('should confirm `call` on a non existing account internal ', async function () {
      const tx = await contract.callOnNonExistingAccount(randomAddress);
      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);
  });

  it('should confirm `delegatecall` on a non existing account', async function () {
    try {
      const tx = await fakeContract.delegatecallOnNonExistingAccount(
        randomAddress
      );
      await tx.wait();
    } catch (err) {
      hasError = true;
      expect(err.code).to.equal(Constants.CONTRACT_REVERT_EXECUTED_CODE);
    }
    expect(hasError).to.equal(true);
  });

  it('should confirm `delegatecall` on a non existing account internal', async function () {
      const tx = await contract.delegatecallOnNonExistingAccount(
        randomAddress
      );
      const rec = await tx.wait();
      expect(rec.status).to.equal(1);
  });

  it('should confirm `staticcall` on a non existing account', async function () {
    try {
      const tx = await fakeContract.staticcallOnNonExistingAccount(
        randomAddress
      );
      await tx.wait();
    } catch (err) {
      hasError = true;
      expect(err.value).to.equal('0x');
    }
    expect(hasError).to.equal(true);
  });

  it('should confirm `staticcall` on a non existing account internal', async function () {
      const tx = await contract.staticcallOnNonExistingAccount(randomAddress);
      expect(tx).to.equal(true);
  });

  it('should confirm creation of a contract on non Existing addr', async function () {
    try {
      contract = await factory.deploy('randomAddress');
    } catch (err) {
      hasError = true;
      expect(err.name).to.equal(NO_IMPLEMENTED_ERROR);
    }
    expect(hasError).to.equal(true);
  });

  it("should confirm function call balance on an address that doesn't exist. ", async function () {
    try {
      await contract.balanceNoneExistingAddr(nonExtAddr);
    } catch (err) {
      hasError = true;
      expect(err.message).to.equal(ADDR_DOES_NOT_EXIST);
    }
    expect(hasError).to.equal(true);
  });
});
