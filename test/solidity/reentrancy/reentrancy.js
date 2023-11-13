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

describe('@solidityequiv3 Reentrancy Guard', function () {
  const tenHBAR = ethers.utils.parseEther("10.0");
  async function deployContractsAndSendHbars() {
    const [owner] = await ethers.getSigners();
    const factorySender = await ethers.getContractFactory(
        Constants.Contract.ReentrancyGuardTestSender
    )
    contractSender = await factorySender.deploy({value: tenHBAR})
    const factoryReceiver = await ethers.getContractFactory(
        Constants.Contract.ReentrancyGuardTestReceiver
      )
    contractReceiver = await factoryReceiver.deploy(contractSender.address)
  }

  it('should verify it reenters without guard', async function () {
    await deployContractsAndSendHbars();

    const res = await contractReceiver.attack()
    const counter = await contractSender.counter()
    await res.wait()
    const receiverBalance = await ethers.provider.getBalance(contractReceiver.address)
    const senderBalance = await ethers.provider.getBalance(contractSender.address)

    expect(counter).to.eq(10)
    expect(senderBalance).to.eq(0)
    expect(receiverBalance).to.eq(tenHBAR)
  })

  it('should verify it cannot reenter with guard', async function () {
    await deployContractsAndSendHbars();

    await contractReceiver.setNonReentrant(true);
    const res = await contractReceiver.attackNonReentrant()
    const counter = await contractSender.counter()
    await res.wait()

    const receiverBalance = await ethers.provider.getBalance(contractReceiver.address)
    const senderBalance = await ethers.provider.getBalance(contractSender.address)

    expect(counter).to.eq(1)
    expect(receiverBalance).to.eq(0)
    expect(senderBalance).to.eq(tenHBAR)
  })
})
