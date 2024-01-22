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

describe('@solidityequiv1 Arithmetic Test Suite', function () {
  let contract;

  before(async function () {
    const factory = await ethers.getContractFactory(
      Constants.Contract.Arithmetic
    );
    contract = await factory.deploy();
  });

  it('it should confirm solidity functionality: Arithmetic, checked overflow - confirm revert add', async function () {
    let hasError = false;
    try {
      const res = await contract.add();
      await res.wait();
    } catch (error) {
      hasError = true;
      expect(error).to.exist;
      const name = await contract.checkName();
      expect(name).to.equal('Arithmetic');
    }
    expect(hasError).to.be.true;
  });

  it('it should confirm solidity functionality: Arithmetic, checked overflow - confirm revert add2', async function () {
    let hasError = false;
    try {
      const res = await contract.add2();
      await res.wait();
    } catch (error) {
      hasError = true;
      expect(error).to.exist;
      const name = await contract.checkName();
      expect(name).to.equal('Arithmetic');
    }
    expect(hasError).to.be.true;
  });

  it('it should confirm solidity functionality: Arithmetic, checked overflow - confirm revert mul', async function () {
    let hasError = false;
    try {
      const res = await contract.mul();
      await res.wait();
    } catch (error) {
      hasError = true;
      expect(error).to.exist;
      const name = await contract.checkName();
      expect(name).to.equal('Arithmetic');
    }
    expect(hasError).to.be.true;
  });

  it('it should confirm solidity functionality: Arithmetic, checked underflow - confirm revert sub', async function () {
    let hasError = false;
    try {
      const res = await contract.sub();
      await res.wait();
    } catch (error) {
      hasError = true;
      expect(error).to.exist;
      const name = await contract.checkName();
      expect(name).to.equal('Arithmetic');
    }
    expect(hasError).to.be.true;
  });

  it('it should confirm solidity functionality: Arithmetic, checked underflow - confirm revert dec', async function () {
    let hasError = false;
    try {
      const res = await contract.dec();
      await res.wait();
    } catch (error) {
      hasError = true;
      expect(error).to.exist;
      const name = await contract.checkName();
      expect(name).to.equal('Arithmetic');
    }
    expect(hasError).to.be.true;
  });

  it('it should confirm solidity functionality: Arithmetic, checked underflow - confirm revert negativeHasMoreValues', async function () {
    let hasError = false;
    try {
      const res = await contract.negativeHasMoreValues();
      await res.wait();
    } catch (error) {
      hasError = true;
      expect(error).to.exist;
      const name = await contract.checkName();
      expect(name).to.equal('Arithmetic');
    }
    expect(hasError).to.be.true;
  });

  it('it should confirm solidity functionality: Arithmetic, unchecked overflow - confirm wrap uncheckedAdd', async function () {
    const res = await contract.uncheckedAdd();
    expect(res).to.be.true;
  });

  it('it should confirm solidity functionality: Arithmetic, unchecked underflow - confirm wrap uncheckedSub', async function () {
    const res = await contract.uncheckedSub();
    expect(res).to.be.true;
  });
});
