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

const { expect } = require('chai')
const { ethers } = require('hardhat')
const Constants = require('../../constants')

describe('@solidityequiv3 Solidity Account non Existing', function () {
  let contract, randomAddress, hasError, fakeContract
  const TRANSACTION_FAILED = "transaction failed"

  before(async function () {
    randomAddress = ethers.Wallet.createRandom().address;
    const factory = await ethers.getContractFactory('NonExisting')
    fakeContract = factory.attach(randomAddress);

    contract = await factory.deploy()
  })

  beforeEach(function () {
    hasError = false
  })

  it('should confirm `call` on a non existing account', async function () {
    let receipt, tx
    try {
        tx = await fakeContract.callOnNonExistingAccount(randomAddress)
        receipt = await tx.wait()
    } catch (err) {
        hasError = true
        expect(err.reason).to.equal(TRANSACTION_FAILED)
    }
    expect(hasError).to.equal(true)
  })

  it('should confirm `call` on a non existing account internal ', async function () {
    let receipt, tx
    try {
        tx = await contract.callOnNonExistingAccount(randomAddress)
        receipt = await tx.wait()
    } catch (err) {
        hasError = true
        expect(err.reason).to.equal(TRANSACTION_FAILED)
    }
    expect(hasError).to.equal(true)
  })

  it('should confirm `delegatecall` on a non existing account', async function () {
    try {
        const tx = await fakeContract.delegatecallOnNoneExistingAccount(randomAddress)
        await tx.wait()
    } catch (err) {
        hasError = true
        expect(err.reason).to.equal(TRANSACTION_FAILED)
    }
    expect(hasError).to.equal(true)
  })

  it('should confirm `delegatecall` on a non existing account internal', async function () {
    try {
        const tx = await contract.delegatecallOnNoneExistingAccount(randomAddress)
        await tx.wait()
    } catch (err) {
        hasError = true
        expect(err.reason).to.equal(TRANSACTION_FAILED)
    }
    expect(hasError).to.equal(true)
  })

  it('should confirm `staticcall` on a non existing account', async function () {
    try {
        const tx = await fakeContract.staticcallOnNoneExistingAccount(randomAddress)
        await tx.wait()
    } catch (err) {
        hasError = true
        expect(err.reason).to.equal(TRANSACTION_FAILED)
    }
    expect(hasError).to.equal(true)
  })

  it('should confirm `staticcall` on a non existing account internal', async function () {
    try {
        const tx = await contract.staticcallOnNoneExistingAccount(randomAddress)
        await tx.wait()
    } catch (err) {
        hasError = true
        expect(err.reason).to.equal(TRANSACTION_FAILED)
    }
    expect(hasError).to.equal(true)
  })
})
