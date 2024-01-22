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

describe('@OZERC2771 Context Test Suite', function () {
  let signers, wallet2, wallet;
  let contract, msgDataTestFuncSig;

  before(async function () {
    signers = await ethers.getSigners();
    wallet2 = signers[1];
    wallet = signers[0];

    const factory = await ethers.getContractFactory(
      Constants.Contract.ERC2771ContextTest
    );
    contract = await factory.deploy(wallet2.address);

    const iface = new ethers.Interface(['function msgDataTest()']);
    msgDataTestFuncSig = iface.getFunction('msgDataTest').selector;
  });

  it('should have the correct trusted forwarder', async function () {
    const res2 = await contract.isTrustedForwarder(wallet2.address);
    const res = await contract.isTrustedForwarder(wallet.address);

    expect(res2).to.be.true;
    expect(res).to.be.false;
  });

  it('should return Pure message sender when incorrect request is sent to _msgSender', async function () {
    const res = await contract.msgSenderTest.staticCall();

    expect(res).to.be.equal(wallet.address);
  });

  it('should return Pure message data when incorrect request is sent to _msgData', async function () {
    const res = await contract.msgDataTest.staticCall();

    expect(res).to.be.equal(msgDataTestFuncSig);
  });

  it('should extract message sender from the request', async function () {
    const trx = await contract
      .connect(wallet2)
      .msgSenderTest.populateTransaction();
    trx.data = trx.data + wallet2.address.substring(2);

    const signedTrx = await wallet2.sendTransaction(trx);
    await signedTrx.wait();

    const msgData = await contract.sender();
    expect(msgData).to.be.equal(wallet2.address);
  });

  it('should extract message data from the request', async function () {
    const trx = await contract
      .connect(wallet2)
      .msgDataTest.populateTransaction();
    const initialData = trx.data;
    trx.data = initialData + wallet2.address.substring(2);

    const signedTrx = await wallet2.sendTransaction(trx);
    await signedTrx.wait();

    const msgData = await contract.msgData();
    expect(msgData).to.be.equal(initialData);
  });

  it('should return an event for [changeMessageTestRequest]', async function () {
    const signedTrx = await contract.changeMessageTestRequest('test', {
      value: 100,
    });
    const rec = await signedTrx.wait();
    const eventName = rec.logs[0].fragment.name;

    expect(eventName).to.be.equal('MessageChanged');
  });
});
