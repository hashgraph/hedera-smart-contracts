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

describe('@OZPausable Test Suite', function () {
  let signers, wallet;
  let contract;
  const CALL_EXCEPTION = 'CALL_EXCEPTION';

  before(async function () {
    signers = await ethers.getSigners();
    wallet = signers[0];

    const factory = await ethers.getContractFactory(
      Constants.Contract.PausableTest
    );
    contract = await factory.deploy();
    await contract.waitForDeployment();
  });

  it('should BE able to call function "setPausedMessage" with "whenNotPaused" modifier when unpaused', async function () {
    const tx = await contract.setPausedMessage('Hello World');
    await tx.wait();
    const message = await contract.message();

    expect(message).to.equal('Hello World');
  });

  it('should NOT be able to call function "setPausedMessage" with "whenNotPaused" modifier when paused', async function () {
    const tx = await contract.pause();
    await tx.wait()

    expect(
      contract.setPausedMessage('some other message')
    ).to.eventually.be.rejected.and.have.property('code', CALL_EXCEPTION);
  });

  it('should BE able to call function "getPausedMessage" with "whenNotPaused" modifier when unpaused', async function () {
    expect(await contract.getPausedMessage()).to.be.equal('Hello World');
  });

  it('should NOT be able to call function "getPausedMessage" with "whenNotPaused" modifier when paused', async function () {
    const tx = await contract.unpause();
    await tx.wait();

    expect(
      contract.getPausedMessage()
    ).to.eventually.be.rejected.and.have.property('code', CALL_EXCEPTION);
  });

  it('should fire event when Paused', async function () {
    const tx = await contract.pause(Constants.GAS_LIMIT_1_000_000);
    const rec = await tx.wait();
    const event = rec.logs[0];
    const account = event.args.account;

    expect(event.fragment.name).to.be.equal('Paused');
    expect(account).to.be.equal(wallet.address);
  });

  it('should fire event when Unpaused', async function () {
    const tx = await contract.unpause(Constants.GAS_LIMIT_1_000_000);
    const rec = await tx.wait();
    const event = rec.logs[0];
    const account = event.args.account;

    expect(event.fragment.name).to.be.equal('Unpaused');
    expect(account).to.be.equal(wallet.address);
  });

  it('should Not be able to pause when paused', async function () {
    const tx = await contract.pause(Constants.GAS_LIMIT_1_000_000);
    await tx.wait();

    expect(contract.pause()).to.eventually.be.rejected.and.have.property(
      'code',
      CALL_EXCEPTION
    );
  });

  it('should Not be able to Unpause when Unpaused', async function () {
    const tx = await contract.unpause();
    await tx.wait();

    expect(contract.unpause()).to.eventually.be.rejected.and.have.property(
      'code',
      CALL_EXCEPTION
    );
  });
});
