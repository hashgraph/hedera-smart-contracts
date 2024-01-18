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

describe('@yulequiv TransactionInfo Test Suite', () => {
  let transactionInfoContract, signers;
  const GASLIMIT = 1000000;
  const INITIAL_BALANCE = 30000000000;
  const tinybarToWeibarCoef = 10_000_000_000;

  before(async () => {
    signers = await ethers.getSigners();
    const transactionInfoContractFactory = await ethers.getContractFactory(
      Constants.Contract.TransactionInfo
    );
    transactionInfoContract = await transactionInfoContractFactory.deploy({
      value: INITIAL_BALANCE,
      gasLimit: GASLIMIT,
    });
  });

  it('Should deploy with a call value', async () => {
    const intialBalance = await ethers.provider.getBalance(
      await transactionInfoContract.getAddress()
    );

    expect(intialBalance).to.eq(INITIAL_BALANCE);
  });

  it('Should get the gas left', async () => {
    const result = await transactionInfoContract.getGasLeft();

    expect(result).to.gt(0);
  });

  it('Should get contract address', async () => {
    const expectedContractAddress = await transactionInfoContract.getAddress();
    const result = await transactionInfoContract.getContractAddress();

    expect(result).to.eq(expectedContractAddress);
  });

  it('Should get contract balance', async () => {
    const expectedSignerABalance = Math.round(
      parseInt(
        (await ethers.provider.getBalance(signers[0].address)) /
          BigInt(tinybarToWeibarCoef)
      )
    );

    const result = await transactionInfoContract.getBalance(
      await signers[0].getAddress()
    );

    expect(result).to.eq(expectedSignerABalance);
  });

  it('Should get self balance', async () => {
    const expectedSelfBalance = Math.round(
      INITIAL_BALANCE / tinybarToWeibarCoef
    );
    const result = await transactionInfoContract.getSelfBalance();

    expect(result).to.eq(expectedSelfBalance);
  });

  it('Should get message caller', async () => {
    const expectedMessageCaller = signers[0].address;

    const result = await transactionInfoContract.getMsgCaller();

    expect(result).to.eq(expectedMessageCaller);
  });

  it('Should get message call value', async () => {
    const expectedValue = 10_000_000_000;

    const transaction = await transactionInfoContract.getCallValue({
      value: expectedValue,
    });
    const receipt = await transaction.wait();

    const event = receipt.logs.map(
      (e) => e.fragment.name === 'CallValue' && e
    )[0];

    const [messageValue] = event.args;

    expect(messageValue).to.eq(expectedValue / tinybarToWeibarCoef);
  });

  it('Should get message call data', async () => {
    const index = 2;
    const functionSig = 'getCallDataLoad(uint256)';
    const callData = transactionInfoContract.interface
      .encodeFunctionData(functionSig, [index])
      .replace('0x', '');

    // @notice since transactionInfoContract.getCallDataLoad() returns the msg.calldata from memory offset `index`,
    //         `bytes32CallData` also needs to dynamically truncate itself based on `index`
    const expectedBytes32CallData =
      `0x` + callData.slice(index * 2, 64 + index * 2);

    const result = await transactionInfoContract.getCallDataLoad(index);

    expect(result).to.eq(expectedBytes32CallData);
  });

  it('Should get the size of message call data', async () => {
    const messagecallData = await transactionInfoContract.getCallDataLoad(0);
    const callDataBytesArraay = ethers.getBytes(messagecallData);
    const significantBytesLength = callDataBytesArraay.reduce(
      (length, byte) => {
        if (byte !== 0) {
          return (length += 1);
        } else {
          return length;
        }
      },
      0
    );

    const result = await transactionInfoContract.getCallDataSize();

    expect(result).to.eq(significantBytesLength);
  });

  it('Should copy message call data to memory', async () => {
    const dataPosF = 0;
    const memPosT = 0x20;
    const bytesAmountS = 4; // max amount
    const functionSig = 'callDataCopier(uint256, uint256, uint256)';

    const messageCallData = transactionInfoContract.interface
      .encodeFunctionData(functionSig, [memPosT, dataPosF, bytesAmountS])
      .replace('0x', '');

    const bytes32MessageCallData =
      '0x' + messageCallData.slice(dataPosF * 2, 64 + dataPosF * 2);

    const result = await transactionInfoContract.callDataCopier(
      memPosT,
      dataPosF,
      bytesAmountS
    );

    expect(result).to.eq(bytes32MessageCallData);
  });

  it('Should get current chainID', async () => {
    const chainId = await transactionInfoContract.getChainId();
    const expectedChainId = (await ethers.provider.getNetwork()).chainId;

    expect(chainId).to.eq(expectedChainId);
  });

  it('Should get original sender', async () => {
    const originalSender = await transactionInfoContract.getOrigin();
    const expectedSender = await signers[0].getAddress();

    expect(originalSender).to.eq(expectedSender);
  });

  it('Should get gas price', async () => {
    const gasPrice = await transactionInfoContract.getGasPrice();

    expect(gasPrice).to.eq(71);
  });

  it('Should get coinbase', async () => {
    const coinbase = await transactionInfoContract.getCoinbase();

    expect(ethers.isAddress(coinbase)).to.be.true;
  });

  it('Should get current block timestamp', async () => {
    const blockTimestamp = await transactionInfoContract.getTimestamp();

    const expectedTimeStamp = Math.floor(Date.now() / 1000);

    expect(blockTimestamp).to.lte(expectedTimeStamp);
  });

  it('Should get current block number', async () => {
    const currentBlockNumber =
      await transactionInfoContract.getCurrentBlockNumber();

    expect(currentBlockNumber).to.gt(0);
  });

  it('Should get gas limit', async () => {
    const gasLimit = await transactionInfoContract.getGasLimit({
      gasLimit: GASLIMIT,
    });

    expect(gasLimit).to.eq(GASLIMIT);
  });
});
