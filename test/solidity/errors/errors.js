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

describe('@solidityequiv2 Solidity Errors', function () {
  let contract, hasError

  before(async function () {
    const factoryErrorsExternal = await ethers.getContractFactory(Constants.Contract.ErrorsExternal)
    contractExternal = await factoryErrorsExternal.deploy()

    const factory = await ethers.getContractFactory(Constants.Contract.Errors)
    contract = await factory.deploy(contractExternal.address)
  })

  beforeEach(async function () {
    hasError = false
  })

  it('should confirm assert works', async function () {
    try {
      const res = await contract.assertCheck(1 == 1)
      expect(res).to.equal(true)

      await contract.assertCheck(1 > 1)
    } catch (err) {
        hasError = true
        expect(err).to.exist
    }
    expect(hasError).to.equal(true)
  })

  it('should confirm require works', async function () {
    try {
        const resReverted = await contract.requireCheck(true)
        expect(resReverted).to.equal(true)
  
        await contract.requireCheck(false)
      } catch (err) {
          hasError = true
          expect(err).to.exist
      }
      expect(hasError).to.equal(true)
  })

  it('should confirm revert works', async function () {
    try {
        await contract.revertCheck()
    } catch (err) {
        hasError = true
        expect(err).to.exist
    }
    expect(hasError).to.equal(true)
  })

  it('should confirm revert with message works', async function () {
    const message = "We unfortunalty need to revert this transaction"
    try {
        await contract.revertWithMessageCheck(message)
    } catch (err) {
        hasError = true
        expect(err.reason).to.exist
        expect(err.reason).to.equal(message)
    }
    expect(hasError).to.equal(true)
  })

  it('should confirm revert with custom error works', async function () {
    try {
      await contract.revertWithCustomError()
    } catch (err) {
        hasError = true
        expect(err.code).to.equal('CALL_EXCEPTION')
        expect(err.errorName).to.equal('InsufficientBalance')
        expect(err.errorArgs.available).to.equal(ethers.BigNumber.from(1))
        expect(err.errorArgs.required).to.equal(ethers.BigNumber.from(100))
    }
    expect(hasError).to.equal(true)
  })

  it('should confirm try/catch with simple revert', async function () {
      const tx = await contract.tryCatchWithSimpleRevert()
      const receipt = await tx.wait()
      expect(receipt).to.exist
      expect(receipt.events[0].args.code).to.equal(0)
      expect(receipt.events[0].args.message).to.equal('revertSimple')
  })

  it('should confirm try/catch revert with error message', async function () {
    const message = "We unfortunalty need to revert this transaction"
    const tx = await contract.tryCatchWithErrorMessageRevert(message)
    const receipt = await tx.wait()
    expect(receipt).to.exist
    expect(receipt.events[0].args.code).to.equal(0)
    expect(receipt.events[0].args.message).to.equal(message)
  })

  it('should confirm try/catch revert with panic', async function () {
    const tx = await contract.tryCatchWithPanic()
    const receipt = await tx.wait()
    expect(receipt).to.exist
    expect(receipt.events[0].args.code).to.equal(18)
    expect(receipt.events[0].args.message).to.equal('panic')
  })

})
