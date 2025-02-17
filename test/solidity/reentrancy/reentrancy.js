// SPDX-License-Identifier: Apache-2.0

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
