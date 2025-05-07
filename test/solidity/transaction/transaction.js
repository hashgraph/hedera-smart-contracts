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
const Utils = require('../../system-contracts/hedera-token-service/utils');

describe('@solidityequiv3 Transaction Test Suite', function () {
  let contractTr, wallet, mfContract, senderWalletAddr;

  before(async function () {
    const factoryTrasnactionContract = await ethers.getContractFactory(
      Constants.Contract.Transaction
    );
    const factoryMfContract = await ethers.getContractFactory(
      Constants.Contract.MessageFrameAddresses
    );

    mfContract = await factoryMfContract.deploy();
    contractTr = await factoryTrasnactionContract.deploy(
      await mfContract.getAddress()
    );

    const signers = await ethers.getSigners();
    wallet = signers[0];
    senderWalletAddr = await wallet.getAddress();
  });

  it('gasleft() returns (uint256): remaining gas', async function () {
    const STARTING_GAS = 30000n;
    const gasLeft = await contractTr.checkGasleft({ gasLimit: STARTING_GAS });

    expect(gasLeft > 0n).to.be.true;
    expect(gasLeft < STARTING_GAS).to.be.true;
  });

  it('msg.data (bytes calldata): complete calldata', async function () {
    const myString = 'Hello, world!';
    const txRes = await contractTr.getMessageData(12, myString);
    const returnedData = txRes.data;

    const ABI = [
      'function getMessageData(uint integer, string memory inputMessage)',
    ];
    const interface = new ethers.Interface(ABI);
    const encodedFunction = interface.encodeFunctionData('getMessageData', [
      12,
      myString,
    ]);

    expect(returnedData).to.exist;
    expect(returnedData).to.be.equal(encodedFunction);
  });

  it('msg.sender (address): sender of the message (current call)', async function () {
    const sender = await contractTr.getMessageSender();

    expect(sender).to.exist;
    expect(sender).to.be.equal(senderWalletAddr);
  });

  it('msg.sig (bytes4): first four bytes of the calldata (i.e. function identifier)', async function () {
    const msgSig = await contractTr.getMessageSignature();

    const ABI = ['function getMessageSignature()'];
    const interface = new ethers.Interface(ABI);
    const encodedFunctionSig = interface.encodeFunctionData(
      'getMessageSignature'
    );

    expect(msgSig).to.exist;
    expect(msgSig).to.be.equal(encodedFunctionSig);
  });

  it('msg.value (uint): number of wei sent with the message', async function () {
    const valueToSend = ethers.parseEther(String(1));
    const txRes = await contractTr.getMessageValue({ value: valueToSend });
    const receipt = await txRes.wait();
    const amount = receipt.logs[0].args[0];
    ethers.formatEther(amount);

    // to compare with the value sent, we need to convert to tinybar
    expect(amount * BigInt(Utils.tinybarToWeibarCoef)).to.equal(valueToSend);
  });

  it('tx.gasprice (uint): gas price of the transaction', async function () {
    const gasPrice = await contractTr.getGasPrice();

    expect(gasPrice > 0n).to.be.true;
  });

  it('tx.origin (address): sender of the transaction (full call chain)', async function () {
    const originAddr = await contractTr.getTxOriginFromSecondary();
    const msgSender = await contractTr.getMsgSenderFromSecondary();

    expect(originAddr).to.exist;
    expect(msgSender).to.exist;
    expect(originAddr).to.be.equal(senderWalletAddr);
    expect(msgSender).to.be.equal(await contractTr.getAddress());
  });
});
