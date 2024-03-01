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
const PaymentChannelHelper = require('./helper');

describe('@solidityequiv2 PaymentChannel Test Suite', () => {
  const GASLIMIT = 1000000;
  const DURATION = 3; // 3 seconds
  const OWED_AMOUNT = 100000000;
  const INITIAL_FUND = ethers.parseEther('3');
  let signers,
    senderAddress,
    recipientAddress,
    paymentSignature,
    paymentChannelContract;

  before(async () => {
    signers = await ethers.getSigners();
    senderAddress = await signers[0].getAddress();
    recipientAddress = await signers[1].getAddress();

    const paymentChannelContractFactory = await ethers.getContractFactory(
      Constants.Contract.PaymentChannel
    );

    paymentChannelContract = await paymentChannelContractFactory.deploy(
      recipientAddress,
      DURATION,
      {
        gasLimit: GASLIMIT,
        value: INITIAL_FUND,
      }
    );

    paymentSignature = await PaymentChannelHelper.signPayment(
      signers[0],
      await paymentChannelContract.getAddress(),
      OWED_AMOUNT
    );
  });

  it('Should deployed with correct deployed arguments - open payment channel', async () => {
    const contractBalance = await ethers.provider.getBalance(
      await paymentChannelContract.getAddress()
    );

    expect(contractBalance).to.eq(INITIAL_FUND);
    expect(await paymentChannelContract.expiration()).to.not.eq(0);
    expect(await paymentChannelContract.sender()).to.eq(senderAddress);
    expect(await paymentChannelContract.recipient()).to.eq(recipientAddress);
  });

  it('Should close the payment channel when recipient execute close method', async () => {
    const transaction = await paymentChannelContract
      .connect(signers[1])
      .close(OWED_AMOUNT, paymentSignature);

    const receipt = await transaction.wait();

    const [contractBalBefore, senderBalBefore, recipientBalBefore] =
      receipt.logs[0].args;

    const [contractBaleAfter, senderBalAfter, recipientBalAfter] =
      receipt.logs[1].args;

    // @notice after closing the channel, all the contract balance will be faily distributed to the parties => contractBaleAfter should be 0
    //
    // @notice since the OWED_AMOUNT = 100000000, after closing the channel the recipient should receive 100000000 crypto units (i.e. OWED_AMOUNT)
    //
    // @notice since the OWED_AMOUNT = 100000000 and the INITIAL_FUND (i.e. contractBaleAfter) = 300000000 =>
    //          the left over, 300000000 - 100000000 = 200000000, will be transfered back to the sender (the channel funder)
    expect(contractBaleAfter).to.eq(0);
    expect(recipientBalAfter - recipientBalBefore).to.eq(OWED_AMOUNT);
    expect(senderBalAfter - senderBalBefore).to.eq(
      contractBalBefore - BigInt(OWED_AMOUNT)
    );
  });

  it('Shoud extend the expiration of the payment channel when caller is the sender', async () => {
    const currentExp = await paymentChannelContract.expiration();
    const newExp = Number(currentExp) + DURATION;

    // call .extend() by signers[0] (i.e. the sender)
    await (await paymentChannelContract.extend(newExp)).wait();

    const updatedExp = await paymentChannelContract.expiration();

    expect(updatedExp).to.eq(newExp);
    expect(updatedExp).to.not.eq(currentExp);
  });

  it('Should not extend the expiration of the payment channel when caller is NOT the sender', async () => {
    const currentExp = await paymentChannelContract.expiration();
    const newExp = Number(currentExp) + DURATION;

    // call .extend() by signers[1] (i.e. the recipient)
    expect(paymentChannelContract.connect(signers[1]).extend(newExp)).to.be
      .rejected;

    const updatedExp = await paymentChannelContract.expiration();

    // @notice as the caller is signers[1] who is not the sender => the .extend function will revert
    expect(updatedExp).to.eq(currentExp);
    expect(updatedExp).to.not.eq(newExp);
  });

  it('Should release back the fund balance stored in the contract to sender when the timeout is reached', async () => {
    const currentExp = await paymentChannelContract.expiration();
    let currentTimeStamp = (await ethers.provider.getBlock()).timestamp;

    while (currentTimeStamp < currentExp) {
      await new Promise((r) => setTimeout(r, 2000));
      currentTimeStamp = (await ethers.provider.getBlock()).timestamp;
    }

    await paymentChannelContract.claimTimeout();
    const contractBalance = await ethers.provider.getBalance(
      await paymentChannelContract.getAddress()
    );

    expect(contractBalance).to.eq(0);
  });
});
