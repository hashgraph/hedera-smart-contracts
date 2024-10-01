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

const TOP_UP_AMOUNT = ethers.parseEther('1.0');
const TRANSFER_AMOUNT = 1;

describe('@solidityequiv1 Solidity Address Test Suite', function () {
  let signers, contract, wallet, walletAddr, recipientContract, recipientAddr;

  const tinybarToWeibar = (amount) =>
    BigInt(amount) * BigInt(Utils.tinybarToWeibarCoef);
  const weibarTotinybar = (amount) =>
    BigInt(amount) / BigInt(Utils.tinybarToWeibarCoef);

  before(async function () {
    signers = await ethers.getSigners();
    wallet = signers[0];
    walletAddr = await wallet.getAddress();

    //deploy test contract
    const factory = await ethers.getContractFactory(
      Constants.Contract.AddressContract
    );
    contract = await factory.deploy();

    //deploy test contract
    const calledFactory = await ethers.getContractFactory(
      Constants.Contract.Recipient
    );
    recipientContract = await calledFactory.deploy();
    recipientAddr = recipientContract.getAddress();

    //top up the test contract with some funds
    let tx = {
      to: await contract.getAddress(),
      value: TOP_UP_AMOUNT,
    };
    const topUpRes = await wallet.sendTransaction(tx);
    topUpRes.wait();
  });

  it('should verify solidity functionality: <address>.balance', async function () {
    const balance = await ethers.provider.getBalance(wallet.address);
    const res = await contract.getAddressBalance(walletAddr);
    expect(tinybarToWeibar(res)).to.equal(balance);
    expect(tinybarToWeibar(res) > 0).to.be.true;
  });

  it('should verify solidity functionality: <address>.code', async function () {
    const walletAddrCodeRes = await contract.getAddressCode(walletAddr);
    const contractAddrCodeRes = await contract.getAddressCode(
      contract.getAddress()
    );

    expect(walletAddrCodeRes).to.exist;
    expect(walletAddrCodeRes).to.equal('0x');
    expect(contractAddrCodeRes).to.exist;
    expect(contractAddrCodeRes).to.not.equal('0x');
    expect(contractAddrCodeRes.length > 2).to.be.true;
  });

  it('should verify solidity functionality: <address>.codehash', async function () {
    const walletAddrCodeRes = await contract.getAddressCode(walletAddr);
    const contractAddrCodeRes = await contract.getAddressCode(
      contract.getAddress()
    );
    const hashedWalletCode = ethers.keccak256(walletAddrCodeRes);
    const hashedContractCode = ethers.keccak256(contractAddrCodeRes);
    const walletAddrResHash = await contract.getAddressCodeHash(walletAddr);
    const contractAddrResHash = await contract.getAddressCodeHash(
      contract.getAddress()
    );

    expect(hashedWalletCode).to.equal(walletAddrResHash);
    expect(hashedContractCode).to.equal(contractAddrResHash);
  });

  it('should verify solidity functionality: <address payable>.transfer', async function () {
    const recipientBalanceInitial =
      await ethers.provider.getBalance(recipientAddr);

    const tx = await contract.transferTo(recipientAddr, TRANSFER_AMOUNT);
    await tx.wait();

    const recipientBalanceFinal =
      await ethers.provider.getBalance(recipientAddr);
    const diff = recipientBalanceFinal - recipientBalanceInitial;

    expect(weibarTotinybar(diff)).to.equal(TRANSFER_AMOUNT);
    expect(recipientBalanceInitial < recipientBalanceFinal).to.be.true;
  });

  it('should verify solidity functionality: <address payable>.transfer (FAIL, should revert if the payment fails)', async function () {
    try {
      await contract.transferTo(recipientAddr, Number.MAX_SAFE_INTEGER);
      throw new Error();
    } catch (error) {
      expect(error).to.exist;
      expect(error.message.includes('execution reverted')).to.be.true;
    }
  });

  it('should verify calling a NON existing address', async function () {
    const tx = await contract.callNonExistingAddress(recipientAddr);
    const rec = await tx.wait();
    const resArgs = rec.logs[0].args;

    expect(resArgs[0]).to.equal(true);
    expect(resArgs[1]).to.equal('0x');
  });

  it('should verify solidity functionality: <address payable>.send', async function () {
    const recipientBalanceInitial =
      await ethers.provider.getBalance(recipientAddr);

    const tx = await contract.sendTo(recipientAddr, TRANSFER_AMOUNT);
    await tx.wait();

    const recipientBalanceFinal =
      await ethers.provider.getBalance(recipientAddr);
    const diff = recipientBalanceFinal - recipientBalanceInitial;

    expect(weibarTotinybar(diff)).to.equal(TRANSFER_AMOUNT);
    expect(recipientBalanceInitial < recipientBalanceFinal).to.be.true;
  });

  it('should verify solidity functionality: <address payable>.send (FAIL, returnes false if the payment fails)', async function () {
    const trx = await contract.sendTo(recipientAddr, Number.MAX_SAFE_INTEGER);
    const rec = await trx.wait();
    const result = rec.logs[0].data;

    const abi = ethers.AbiCoder.defaultAbiCoder();
    const res = abi.decode(['bool'], result);

    expect(res[0]).to.be.false;
  });

  it('should verify solidity functionality: <address>.call', async function () {
    const recipientBalanceInitial =
      await ethers.provider.getBalance(recipientAddr);

    const tx = await contract.callAddr(recipientAddr, TRANSFER_AMOUNT);
    await tx.wait();

    const recipientBalanceFinal =
      await ethers.provider.getBalance(recipientAddr);
    const diff = recipientBalanceFinal - recipientBalanceInitial;

    expect(weibarTotinybar(diff)).to.equal(TRANSFER_AMOUNT);
    expect(recipientBalanceInitial < recipientBalanceFinal).to.be.true;
  });

  it('should verify solidity functionality: <address>.call (FAIL, returnes false if the payment fails)', async function () {
    const tx = await contract.callAddr(recipientAddr, Number.MAX_SAFE_INTEGER);
    const rec = await tx.wait();
    const result = rec.logs[0].data;

    const abi = ethers.AbiCoder.defaultAbiCoder();
    const callSuccess = abi.decode(['bool'], result);

    expect(callSuccess[0]).to.be.false;
  });

  it('should verify solidity functionality: <address>.call -> with function signature', async function () {
    const resTx = await contract.callAddrWithSig(
      recipientAddr,
      TRANSFER_AMOUNT,
      'getMessageValue()'
    );
    const receipt = await resTx.wait();
    const data = receipt.logs[0].data;
    const value = BigInt(data);

    expect(value).to.equal(TRANSFER_AMOUNT);
  });

  it('should verify solidity functionality: <address>.delegatecall', async function () {
    const MESSAGE_FROM_ADDRESS = 'Hello World from AddressContract!';
    const resTx = await contract.delegate(recipientAddr, 'helloWorldMessage()');
    const receipt = await resTx.wait();
    const message = receipt.logs[0].args[0];

    expect(message).to.equal(MESSAGE_FROM_ADDRESS);
  });

  it('should verify solidity functionality: <address>.staticcall', async function () {
    const MY_NUMBER = 5;
    const resTx = await contract.staticCall(recipientAddr, 'getNumber()');
    const receipt = await resTx.wait();
    const result = receipt.logs[0].args[1];
    const myNumber = BigInt(result);

    expect(myNumber).to.equal(MY_NUMBER);
  });

  it('should verify solidity functionality: <address>.staticcall -> Try to set state', async function () {
    try {
      const resTx = await contract.staticCallSet(
        recipientAddr,
        'setNumber(uint number)',
        10
      );
      await resTx.wait();
    } catch (error) {
      expect(error.code).to.equal('CALL_EXCEPTION');
    }
  });
});
