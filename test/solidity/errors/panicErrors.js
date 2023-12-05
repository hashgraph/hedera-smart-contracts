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

describe('@solidityequiv3 Panic Errors', function () {
  let contract

  before(async function () {
    const factory = await ethers.getContractFactory(Constants.Contract.Panic)
    contract = await factory.deploy()
  })

  it('should verify panic error 0x01', async function () {
    let error
    try {
      await contract.verifyPanicError0x01()
    } catch (e) {
      error = e
    }
    expect(error.errorName).to.eq('Panic')
    expect(error.errorArgs).to.deep.eq([ethers.BigNumber.from(1)])
  })

  it('should verify panic error 0x11', async function () {
    let error
    try {
      await contract.verifyPanicError0x11()
    } catch (e) {
      error = e
    }
    expect(error.errorName).to.eq('Panic')
    expect(error.errorArgs).to.deep.eq([ethers.BigNumber.from(17)])
  })

  it('should verify panic error 0x12', async function () {
    let error
    try {
      await contract.verifyPanicError0x12()
    } catch (e) {
      error = e
    }
    expect(error.errorName).to.eq('Panic')
    expect(error.errorArgs).to.deep.eq([ethers.BigNumber.from(18)])
  })

  it('should verify panic error 0x21', async function () {
    let error
    try {
      await contract.verifyPanicError0x21()
    } catch (e) {
      error = e
    }
    expect(error.errorName).to.eq('Panic')
    expect(error.errorArgs).to.deep.eq([ethers.BigNumber.from(33)])
  })

  it('should verify panic error 0x31', async function () {
    let error
    try {
      const result = await contract.verifyPanicError0x31()
      await result.wait()
    } catch (e) {
      error = e
    }
    expect(error.code).to.eq('CALL_EXCEPTION')
    expect(error.reason).to.eq('transaction failed')
  })

  it('should verify panic error 0x32', async function () {
    let error
    try {
      await contract.verifyPanicError0x32()
    } catch (e) {
      error = e
    }
    expect(error.errorName).to.eq('Panic')
    expect(error.errorArgs).to.deep.eq([ethers.BigNumber.from(50)])
  })

  it('should verify panic error 0x41', async function () {
    let error
    try {
      await contract.verifyPanicError0x41()
    } catch (e) {
      error = e
    }
    expect(error.errorName).to.eq('Panic')
    expect(error.errorArgs).to.deep.eq([ethers.BigNumber.from(65)])
  })

  it('should verify panic error 0x51', async function () {
    let error
    try {
      await contract.verifyPanicError0x51()
    } catch (e) {
      error = e
    }
    expect(error.errorName).to.eq('Panic')
    expect(error.errorArgs).to.deep.eq([ethers.BigNumber.from(81)])
  })
})
