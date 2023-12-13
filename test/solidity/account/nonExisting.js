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

describe('@solidityequiv1 Solidity Account Non Existing Tests', function () {
  let contract, randomAddress, hasError, fakeContract, contractDup, factory;
  const TRANSACTION_FAILED = 'transaction failed';
  const UNSUPPORTED_OPERATION = 'UNSUPPORTED_OPERATION';
  const ADDR_DOES_NOT_EXIST = 'nonExtAddr is not defined';

  before(async function () {
    randomAddress = ethers.Wallet.createRandom().address;
    factory = await ethers.getContractFactory(Constants.Contract.NonExisting);
    const factoryDup = await ethers.getContractFactory(
      Constants.Contract.NonExtDup
    );
    fakeContract = factory.attach(randomAddress);

    contractDup = await factoryDup.deploy();
    await contractDup.deployed();
    contract = await factory.deploy(contractDup.address);
    await contract.deployed();
  });

  beforeEach(function () {
    hasError = false;
  });

  it('should confirm `call` on a non existing account', async function () {
    let receipt, tx;
    try {
      tx = await fakeContract.callOnNonExistingAccount(randomAddress);
      receipt = await tx.wait();
    } catch (err) {
      hasError = true;
      expect(err.reason).to.equal(TRANSACTION_FAILED);
    }
    expect(hasError).to.equal(true);
  });

  it('should confirm `call` on a non existing account internal ', async function () {
    let receipt, tx;
    try {
      tx = await contract.callOnNonExistingAccount(randomAddress);
      receipt = await tx.wait();
    } catch (err) {
      hasError = true;
      expect(err.reason).to.equal(TRANSACTION_FAILED);
    }
    expect(hasError).to.equal(true);
  });

  it('should confirm `delegatecall` on a non existing account', async function () {
    try {
      const tx = await fakeContract.delegatecallOnNoneExistingAccount(
        randomAddress
      );
      await tx.wait();
    } catch (err) {
      hasError = true;
      expect(err.reason).to.equal(TRANSACTION_FAILED);
    }
    expect(hasError).to.equal(true);
  });

  it('should confirm `delegatecall` on a non existing account internal', async function () {
    try {
      const tx = await contract.delegatecallOnNoneExistingAccount(
        randomAddress
      );
      await tx.wait();
    } catch (err) {
      hasError = true;
      expect(err.reason).to.equal(TRANSACTION_FAILED);
    }
    expect(hasError).to.equal(true);
  });

  it('should confirm `staticcall` on a non existing account', async function () {
    try {
      const tx = await fakeContract.staticcallOnNoneExistingAccount(
        randomAddress
      );
      await tx.wait();
    } catch (err) {
      hasError = true;
      expect(err.reason).to.equal(TRANSACTION_FAILED);
    }
    expect(hasError).to.equal(true);
  });

  it('should confirm `staticcall` on a non existing account internal', async function () {
    try {
      const tx = await contract.staticcallOnNoneExistingAccount(randomAddress);
      await tx.wait();
    } catch (err) {
      hasError = true;
      expect(err.reason).to.equal(TRANSACTION_FAILED);
    }
    expect(hasError).to.equal(true);
  });

  it('should confirm creation of a contract on non Existing addr', async function () {
    try {
      contract = await factory.deploy('randomAddress');
    } catch (err) {
      hasError = true;
      expect(err.code).to.equal(UNSUPPORTED_OPERATION);
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
