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

describe('@solidityequiv3 Reentrancy Guard Test Suite', function () {
  const tenHBAR = ethers.parseEther('10.0');
  async function deployContractsAndSendHbars() {
    const factorySender = await ethers.getContractFactory(
      Constants.Contract.ReentrancyGuardTestSender
    );
    contractSender = await factorySender.deploy({ value: tenHBAR });
    const factoryReceiver = await ethers.getContractFactory(
      Constants.Contract.ReentrancyGuardTestReceiver
    );
    contractReceiver = await factoryReceiver.deploy(
      await contractSender.getAddress()
    );
  }

  it('should verify it reenters without guard', async function () {
    await deployContractsAndSendHbars();

    await (await contractReceiver.attack(Constants.GAS_LIMIT_1_000_000)).wait();
    const counter = await contractSender.counter();
    const receiverBalance = await ethers.provider.getBalance(
      await contractReceiver.getAddress()
    );
    const senderBalance = await ethers.provider.getBalance(
      await contractSender.getAddress()
    );

    expect(counter).to.eq(10);
    expect(senderBalance).to.eq(0);
    expect(receiverBalance).to.eq(tenHBAR);
  });

  it('should verify it cannot reenter with guard', async function () {
    await deployContractsAndSendHbars();

    await (await contractReceiver.setNonReentrant(true)).wait();
    await (await contractReceiver.attackNonReentrant()).wait();
    const counter = await contractSender.counter();

    const receiverBalance = await ethers.provider.getBalance(
      await contractReceiver.getAddress()
    );
    const senderBalance = await ethers.provider.getBalance(
      await contractSender.getAddress()
    );

    expect(counter).to.eq(1);
    expect(receiverBalance).to.eq(0);
    expect(senderBalance).to.eq(tenHBAR);
  });
});
