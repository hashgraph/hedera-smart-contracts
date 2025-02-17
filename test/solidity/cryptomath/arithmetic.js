// SPDX-License-Identifier: Apache-2.0
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
