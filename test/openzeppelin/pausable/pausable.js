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

describe('@OZPausable Pausable Tests', function () {
  let signers, wallet
  let contract
  const CALL_EXCEPTION = 'CALL_EXCEPTION'

  before(async function () {
    signers = await ethers.getSigners()
    wallet = signers[0]

    const factory = await ethers.getContractFactory('PausableTest')
    contract = await factory.deploy()
    await contract.deployed()
  })

  it('should BE able to call function "setPausedMessage" with "whenNotPaused" modifier when unpaused', async function () {
    const tx = await contract.setPausedMessage('Hello World')
    await tx.wait()
    const message = await contract.message()

    expect(message).to.equal('Hello World')
  })

  it('should NOT be able to call function "setPausedMessage" with "whenNotPaused" modifier when paused', async function () {
    await contract.pause()
    const tx = await contract.setPausedMessage('Hello World')

    expect(tx.wait()).to.eventually.be.rejected.and.have.property(
      'code',
      CALL_EXCEPTION
    )
  })

  it('should BE able to call function "getPausedMessage" with "whenNotPaused" modifier when unpaused', async function () {
    expect(await contract.getPausedMessage()).to.be.equal('Hello World')
  })

  it('should NOT be able to call function "getPausedMessage" with "whenNotPaused" modifier when paused', async function () {
    await contract.unpause()

    expect(
      contract.getPausedMessage()
    ).to.eventually.be.rejected.and.have.property('code', CALL_EXCEPTION)
  })

  it('should fire event when Paused', async function () {
    const tx = await contract.pause()
    const rec = await tx.wait()
    const event = rec.events[0]
    const account = event.args.account

    expect(event.event).to.be.equal('Paused')
    expect(account).to.be.equal(wallet.address)
  })

  it('should fire event when Unpaused', async function () {
    const tx = await contract.unpause()
    const rec = await tx.wait()
    const event = rec.events[0]
    const account = event.args.account

    expect(event.event).to.be.equal('Unpaused')
    expect(account).to.be.equal(wallet.address)
  })

  it('should Not be able to pause when paused', async function () {
    const tx = await contract.pause()
    await tx.wait()
    const tx2 = await contract.pause()

    expect(tx2.wait()).to.eventually.be.rejected.and.have.property(
      'code',
      CALL_EXCEPTION
    )
  })

  it('should Not be able to Unpause when Unpaused', async function () {
    const tx = await contract.unpause()
    await tx.wait()
    const tx2 = await contract.unpause()

    expect(tx2.wait()).to.eventually.be.rejected.and.have.property(
      'code',
      CALL_EXCEPTION
    )
  })
})
