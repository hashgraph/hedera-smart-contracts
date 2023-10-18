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
  let signers
  let contract

  before(async function () {
    signers = await ethers.getSigners()

    const factory = await ethers.getContractFactory(Constants.Contract.Errors)
    contract = await factory.deploy()
  })

  it('confirm assert works', async function () {
    try {
      const res = await contract.assertCheck(1 == 1)
      expect(res).to.equal(true)

      await contract.assertCheck(1 > 1)
    } catch (err) {
        expect(err).to.exist
    }
  })

  it('confirm require works', async function () {
    try {
        const resReverted = await contract.requireCheck(true)
        expect(resReverted).to.equal(true)
  
        const res = await contract.requireCheck(false)
      } catch (err) {
          expect(err).to.exist
      }
  })

  it('confirm revert works', async function () {
    try {
        await contract.revertCheck()
    } catch (err) {
        expect(err).to.exist
    }
  })

  it('confirm revert with message works', async function () {
    const message = "We unfortunalty need to revert this transaction"
    try {
        await contract.revertWithMessageCheck(message)
    } catch (err) {
        expect(err.reason).to.exist
        expect(err.reason).to.equal(message)
    }
  })

})
