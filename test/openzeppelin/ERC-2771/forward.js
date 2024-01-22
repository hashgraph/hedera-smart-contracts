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
const { getDomain } = require('../helpers/eip712');

const FORWARDER_NAME = 'ForwardRequest';
const ERC2771_FORWARDER_MISMATCHED_VALUE = 'ERC2771ForwarderMismatchedValue';

function forwardRequestType() {
  return [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'gas', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint48' },
    { name: 'data', type: 'bytes' },
  ];
}

describe('@OZERC-2771 Fоrward Test Suite', function () {
  let signers,
    wallet2,
    forwarderAddress,
    trx,
    contractForwarder,
    contractRegestry,
    domain,
    types,
    transactionObject;
  const TEST_MESSAGE = 'test message';
  const deadlineFuture = BigInt(
    new Date(new Date().setFullYear(new Date().getFullYear() + 1)).getTime()
  );
  const STARTING_GAS_LIMIT = 15000000;
  const FUND_AMOUNT = '10000000000000000000';

  before(async function () {
    signers = await ethers.getSigners();
    wallet2 = signers[1];
    wallet = signers[0];

    const factoryForwarder = await ethers.getContractFactory(
      Constants.Contract.ERC2771ForwardTest
    );
    contractForwarder = await factoryForwarder.deploy(FORWARDER_NAME, {
      gasLimit: BigInt(STARTING_GAS_LIMIT),
    });
    forwarderAddress = await contractForwarder.getAddress();

    const transaction = await contractForwarder.fund({
      value: FUND_AMOUNT,
    });

    const res = await transaction.wait();

    const factoryContext = await ethers.getContractFactory(
      Constants.Contract.ERC2771ContextTest
    );

    contractRegestry = await factoryContext.deploy(forwarderAddress, {
      gasLimit: BigInt(STARTING_GAS_LIMIT),
    });

    domain = await getDomain(contractForwarder);
    types = {
      ForwardRequest: forwardRequestType(),
    };
  });

  beforeEach(async function () {
    transactionObject = await contractRegestry
      .connect(wallet2)
      .changeMessageTestRequest.populateTransaction(TEST_MESSAGE);

    const forwardRequest = {
      ...transactionObject,
      from: wallet2.address,
      gas: 1_000_000,
      deadline: deadlineFuture,
      nonce: await contractForwarder.nonces(wallet2.address),
      value: 0,
    };

    delete forwardRequest.gasLimit;

    const signature = await wallet2.signTypedData(
      {
        ...domain,
      },
      types,
      forwardRequest
    );

    trx = {
      ...forwardRequest,
      signature,
    };
  });

  it('should execute forward request', async function () {
    const prevMessage = await contractRegestry.message();
    expect(prevMessage).to.equal('');

    const trxCall = await contractForwarder.execute(trx, {
      value: 0,
    });
    const rec = await trxCall.wait();
    const eventExecuted = rec.logs[1];
    const message = await contractRegestry.message();

    expect(eventExecuted.fragment.name).to.equal('ExecutedForwardRequest');
    expect(message).to.equal(TEST_MESSAGE);
  });

  it('should execute forward request with [ERC2771ForwarderMismatchedValue] error', async function () {
    expect(
      contractForwarder.execute.staticCall(trx)
    ).to.eventually.be.rejected.and.have.property(
      'errorName',
      ERC2771_FORWARDER_MISMATCHED_VALUE
    );
  });

  it('should verify the request sender by external API function', async function () {
    const verified = await contractForwarder.verify(trx);
    expect(verified).to.be.true;
  });

  it('should validate the request sender in more detail', async function () {
    const verifiedStatic = await contractForwarder.validateTest.staticCall(trx);
    const verifiedTrx = await contractForwarder.validateTest(trx);
    const rec = await verifiedTrx.wait();
    const verifiedTrxResult = rec.logs[0].args;

    expect(verifiedStatic[0]).to.be.true;
    expect(verifiedStatic[1]).to.be.true;
    expect(verifiedStatic[2]).to.be.true;

    expect(verifiedTrxResult[0]).to.be.true;
    expect(verifiedTrxResult[1]).to.be.true;
    expect(verifiedTrxResult[2]).to.be.true;
  });

  it('should invalidate the request sender when called with tampered values [from]', async function () {
    const tamperedTrx = {
      ...trx,
      from: ethers.Wallet.createRandom().address,
    };
    const verifiedStatic = await contractForwarder.validateTest.staticCall(
      tamperedTrx
    );
    const verifiedTrx = await contractForwarder.validateTest(tamperedTrx);
    const rec = await verifiedTrx.wait();
    const verifiedTrxResult = rec.logs[0].args;

    expect(verifiedStatic[0]).to.be.true;
    expect(verifiedStatic[1]).to.be.true;
    expect(verifiedStatic[2]).to.be.false;

    expect(verifiedTrxResult[0]).to.be.true;
    expect(verifiedTrxResult[1]).to.be.true;
    expect(verifiedTrxResult[2]).to.be.false;
  });

  it('should invalidate the request sender when called with tampered values [deadline]', async function () {
    const tamperedTrx = {
      ...trx,
      deadline: 0,
    };
    const verifiedStatic = await contractForwarder.validateTest.staticCall(
      tamperedTrx
    );
    const verifiedTrx = await contractForwarder.validateTest(tamperedTrx);
    const rec = await verifiedTrx.wait();
    const verifiedTrxResult = rec.logs[0].args;

    expect(verifiedStatic[0]).to.be.true;
    expect(verifiedStatic[1]).to.be.false;
    expect(verifiedStatic[2]).to.be.false;

    expect(verifiedTrxResult[0]).to.be.true;
    expect(verifiedTrxResult[1]).to.be.false;
    expect(verifiedTrxResult[2]).to.be.false;
  });
});
