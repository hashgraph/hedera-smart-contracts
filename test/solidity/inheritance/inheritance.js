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

describe('Crypto Inheritance tests', function () {
  let signers, contractMain, contractBase, wallet
  const TOP_UP_AMOUNT = ethers.utils.parseEther('0.000001');

  before(async function () {
    signers = await ethers.getSigners()
    wallet = signers[0];

    const factoryMain = await ethers.getContractFactory('Main')
    contractMain = await factoryMain.deploy()
    await contractMain.deployed()

    const factoryBase = await ethers.getContractFactory('Base')
    contractBase = await factoryBase.deploy()
    await contractBase.deployed()

    //top up the test contract with some funds
    const tx = {
        to: contractMain.address,
        value: TOP_UP_AMOUNT
    }
    const topUpRes = await wallet.sendTransaction(tx)
    await topUpRes.wait();
  })

  it('should confirm solidity functionality: this (current contract\'s type)', async function () {
    const mainThis = await contractMain.returnThis()

    expect(mainThis).to.equal(contractMain.address)
  })

  it('should confirm solidity functionality: super', async function () {
    const res = await contractMain.classIdentifier()

    expect(res).to.equal("Main")
  })

  it('should confirm solidity functionality: selfdestruct(address payable recipient)', async function () {
    const balanceBaseInitial = await contractBase.getBalance()
    expect(balanceBaseInitial).to.be.equal(0)

    const tx = await contractMain.destroyContract(contractBase.address)
    await tx.wait()
    const balanceBaseFinal = await contractBase.getBalance()

    expect(balanceBaseFinal.gt(balanceBaseInitial)).to.be.true
  })

})
