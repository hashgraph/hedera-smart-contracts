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

describe('@solidityequiv2 Modifiers Test Suite', function () {
  let accounts, contractB, derivedContract, modifiersContract, owner;

  const tinybarToWeibar = (amount) =>
    amount * BigInt(Utils.tinybarToWeibarCoef);
  const weibarTotinybar = (amount) =>
    amount / BigInt(Utils.tinybarToWeibarCoef);

  beforeEach(async function () {
    const Modifiers = await ethers.getContractFactory(
      Constants.Contract.Modifiers
    );
    modifiersContract = await Modifiers.deploy(42);

    const Derived = await ethers.getContractFactory(
      Constants.Contract.DerivedContract
    );
    derivedContract = await Derived.deploy(55);

    const ContractA = await ethers.getContractFactory('A');
    contractA = await ContractA.deploy();

    const ContractB = await ethers.getContractFactory('B');
    contractB = await ContractB.deploy(79);

    [owner] = await ethers.getSigners();
    accounts = await ethers.getSigners();
  });

  it("Should not modify the contract's state after calling a pure function", async function () {
    const initialState = await ethers.provider.getCode(
      await modifiersContract.getAddress()
    );

    const result = await modifiersContract.addPure(7, 5);
    expect(result).to.equal(12);

    const finalState = await ethers.provider.getCode(
      await modifiersContract.getAddress()
    );
    expect(initialState).to.equal(finalState);
  });

  it("Should not modify the contract's state when calling a view function", async function () {
    const initialState = await ethers.provider.getStorage(
      await modifiersContract.getAddress(),
      0
    );

    const result = await modifiersContract.getData();
    expect(result).to.equal(42);

    const finalState = await ethers.provider.getStorage(
      await modifiersContract.getAddress(),
      0
    );
    expect(initialState).to.equal(finalState);
  });

  it("Should accept payments and increase the contract's balance", async function () {
    const initialBalance = await modifiersContract.getBalance();

    const paymentAmount = weibarTotinybar(ethers.parseEther('100'));
    await owner.sendTransaction({
      to: await modifiersContract.getAddress(),
      value: paymentAmount,
      data: modifiersContract.interface.encodeFunctionData('makePayment'),
    });

    const finalBalance = await modifiersContract.getBalance();
    expect(tinybarToWeibar(finalBalance + initialBalance)).to.equal(
      paymentAmount
    );
  });

  it('Should have the correct MAX_SUPPLY value', async function () {
    const maxSupply = await modifiersContract.MAX_SUPPLY();
    expect(maxSupply).to.equal(1000000);
  });

  it('Should set deploymentTimestamp to the block timestamp of deployment', async function () {
    const block = await ethers.provider.getBlock(
      modifiersContract.deploymentTransaction().blockHash
    );

    const deploymentTimestamp = await modifiersContract.deploymentTimestamp();
    expect(deploymentTimestamp).to.equal(block.timestamp);
  });

  it('Should emit indexed from and to values in the RegularEvent', async function () {
    const toAddress = accounts[1].address;
    const tx = await modifiersContract.triggerRegularEvent(
      toAddress,
      100,
      'test transfer'
    );
    const receipt = await tx.wait();

    expect(receipt.logs?.length).to.equal(1);
    const event = receipt.logs[0];

    // Check the event's topics. The first topic is the event's signature.
    // The next topics are the indexed parameters in the order they appear in the event.
    expect(event.topics[1].toLowerCase()).to.equal(
      ethers.zeroPadValue(accounts[0].address, 32).toLowerCase()
    ); // from address
    expect(event.topics[2].toLowerCase()).to.equal(
      ethers.zeroPadValue(toAddress, 32).toLowerCase()
    ); // to address
  });

  it('Should emit the AnonymousEvent with correct values', async function () {
    const tx = await modifiersContract.triggerAnonymousEvent(257);
    const receipt = await tx.wait();

    expect(receipt.logs?.length).to.equal(1);

    const anonymousEvent = receipt.logs[0];
    expect(anonymousEvent.fragment).to.undefined;

    // Since it's anonymous, we access the topics directly to get the indexed values.
    const senderAddress = '0x' + anonymousEvent.topics[0].slice(-40);
    expect(senderAddress.toLowerCase()).to.equal(
      accounts[0].address.toLowerCase()
    );
    const abi = ethers.AbiCoder.defaultAbiCoder();
    const value = abi.decode(['uint256'], anonymousEvent.data);
    expect(value[0]).to.equal(257);
  });

  it('Should return the message in the from the derived contract that overrides the virtual function', async function () {
    expect(await derivedContract.getData()).to.equal(55);
    expect(await derivedContract.show()).to.equal(
      'This is the derived contract'
    );
  });

  it('Should return the message in the from ContractB that overrides the show function', async function () {
    expect(await contractB.getData()).to.equal(79);
    expect(await contractB.show()).to.equal(
      'This is the overriding contract B'
    );
  });
});
