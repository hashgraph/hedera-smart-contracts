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

const weibarTotinybar = (amount) => amount / BigInt(Utils.tinybarToWeibarCoef);

describe('@solidityequiv2 Solidity Functions Test Suite', function () {
  let contract, contractAddr, contractChild, contractParent;

  before(async function () {
    const factory = await ethers.getContractFactory(
      Constants.Contract.Functions
    );
    contract = await factory.deploy();
    contractAddr = await contract.getAddress();

    const factoryChild = await ethers.getContractFactory(
      Constants.Contract.FunctionsChild
    );
    contractChild = await factoryChild.deploy();

    const factoryParent = await ethers.getContractFactory(
      Constants.Contract.FunctionsParent
    );
    contractParent = await factoryParent.deploy(contractAddr);
  });

  it('should confirm "internal" functionality', async function () {
    const message = await contractChild.getMessageString();
    expect(message).to.equal('Hello World');

    try {
      await contract.getMessage();
    } catch (error) {
      expect(error.message).to.equal('contract.getMessage is not a function');
    }
  });

  it('should confirm "external" functionality', async function () {
    const gas = await contractParent.testExternal();
    const gasSecond = await contract.checkGasleft();
    const fromExternalCall = await contract.checkGasleftFromExternalCall();
    expect(fromExternalCall).to.exist;
    expect(gas).to.exist;
    expect(gasSecond).to.exist;
  });

  it('should confirm "payable" functionality', async function () {
    const txDeposit = await contract.deposit({
      value: ethers.parseEther('1.0'),
    });
    txDeposit.wait();
    const balance = await contract.getBalance();
    expect(balance).to.exist;
    expect(balance).to.equal(weibarTotinybar(ethers.parseEther('1.0')));
    try {
      await contract.notPayable({ value: ethers.parseEther('1.0') });
    } catch (error) {
      expect(error.code).to.eq(-32008);
    }
  });

  it('should confirm "method({param1: value1, param2: value2...}): name properties" functionality', async function () {
    const res = await contract.manyInputsProxyCall();
    expect(res).to.exist;
  });

  it('should confirm "function func(uint k, uint)": omitted parameter name', async function () {
    const res = await contract.sumThemUp(12, 12);
    expect(res).to.equal(12);
  });
});
