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

describe('@yulequiv Contract Caller Test Suite', async () => {
  let contractCaller, targetContract, getCountEncodedSig, setCountEncodedSig;
  const COUNT_A = 3;
  const GAS = 1_000_000;
  const INITIAL_COUNT = 9;

  beforeEach(async () => {
    // deploy contracts
    const contractCallerFactory = await ethers.getContractFactory(
      Constants.Contract.ContractCaller
    );
    const targetContractFactory = await ethers.getContractFactory(
      Constants.Contract.TargetContract
    );
    contractCaller = await contractCallerFactory.deploy();
    targetContract = await targetContractFactory.deploy(INITIAL_COUNT);

    // prepare encoded function signatures
    getCountEncodedSig =
      targetContract.interface.encodeFunctionData('getCount()');

    setCountEncodedSig = targetContract.interface.encodeFunctionData(
      'setCount(uint256)',
      [COUNT_A]
    );
  });

  it('Should execute call(g, a, v, in, insize, out, outsize)', async () => {
    // prepare transactions
    const callSetCountTx = await contractCaller.call(
      GAS,
      await targetContract.getAddress(),
      setCountEncodedSig
    );
    const callGetCountTx = await contractCaller.call(
      GAS,
      await targetContract.getAddress(),
      getCountEncodedSig
    );

    // wait for the receipts
    const callSetCountReceipt = await callSetCountTx.wait();
    const callGetCountReceipt = await callGetCountTx.wait();

    // extract events
    const [callSetCountResult] = callSetCountReceipt.logs.map(
      (e) => e.fragment.name === 'CallResult' && e
    )[0].args;
    const [callGetCountResult] = callGetCountReceipt.logs.map(
      (e) => e.fragment.name === 'CallResult' && e
    )[0].args;
    const [callGetCountReturnedData] = callGetCountReceipt.logs.map(
      (e) => e.fragment.name === 'CallReturnedData' && e
    )[1].args;

    // assertion
    expect(callSetCountResult).to.be.true;
    expect(callGetCountResult).to.be.true;
    expect(callGetCountReturnedData).to.eq(COUNT_A);
  });

  it('Should execute staticcall(g, a, in, insize, out, outsize)', async () => {
    // prepare transactions
    const callGetCountTx = await contractCaller.staticcall(
      GAS,
      await targetContract.getAddress(),
      getCountEncodedSig
    );

    // wait for the receipts
    const callGetCountReceipt = await callGetCountTx.wait();

    // extract events
    const [callGetCountResult] = callGetCountReceipt.logs.map(
      (e) => e.fragment.name === 'CallResult' && e
    )[0].args;
    const [callGetCountReturnedData] = callGetCountReceipt.logs.map(
      (e) => e.fragment.name === 'CallReturnedData' && e
    )[1].args;

    // assertion
    expect(callGetCountResult).to.be.true;
    expect(callGetCountReturnedData).to.eq(INITIAL_COUNT);
  });

  it('Should execute callcode(g, a, v, in, insize, out, outsize)', async () => {
    // prepare transactions
    const callSetCountTx = await contractCaller.callCode(
      GAS,
      await targetContract.getAddress(),
      setCountEncodedSig
    );

    // wait for the receipts
    const callSetCountReceipt = await callSetCountTx.wait();

    // extract events
    const [callSetCountResult] = callSetCountReceipt.logs.map(
      (e) => e.fragment.name === 'CallResult' && e
    )[0].args;

    // get storage count within ContractCaller contract
    const storageCount = await contractCaller.count();

    // @notice since callcode use the code from `targetContract` to update `ContractCaller` contract
    //          => `storageCount` is expected to equal `COUNT_A`
    expect(storageCount).to.eq(COUNT_A);
    expect(callSetCountResult).to.be.true;
  });

  it('Should execute delegatecall(g, a, in, insize, out, outsize)', async () => {
    // prepare transactions
    const callSetCountTx = await contractCaller.delegateCall(
      GAS,
      await targetContract.getAddress(),
      setCountEncodedSig
    );

    // wait for the receipts
    const callSetCountReceipt = await callSetCountTx.wait();

    // extract events
    const [callSetCountResult] = callSetCountReceipt.logs.map(
      (e) => e.fragment.name === 'CallResult' && e
    )[0].args;

    // get storage count within ContractCaller contract
    const storageCount = await contractCaller.count();

    // @notice since callcode use the code from `targetContract` to update `ContractCaller` contract
    //          => `storageCount` is expected to equal `COUNT_A`
    expect(storageCount).to.eq(COUNT_A);
    expect(callSetCountResult).to.be.true;
  });
});
