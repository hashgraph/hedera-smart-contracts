// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../constants');

describe('@solidityequiv2 Crypto Inheritance Tests', function () {
  let signers, contractMain, contractBase, wallet;
  const TOP_UP_AMOUNT = ethers.parseEther('0.000001');

  before(async function () {
    signers = await ethers.getSigners();
    wallet = signers[0];

    const factoryMain = await ethers.getContractFactory(
      Constants.Contract.Main
    );
    contractMain = await factoryMain.deploy();

    const factoryBase = await ethers.getContractFactory(
      Constants.Contract.Base
    );
    contractBase = await factoryBase.deploy();

    //top up the test contract with some funds
    const tx = {
      to: await contractMain.getAddress(),
      value: TOP_UP_AMOUNT,
    };
    const topUpRes = await wallet.sendTransaction(tx);
    await topUpRes.wait();
  });

  it("should confirm solidity functionality: this (current contract's type)", async function () {
    const mainThis = await contractMain.returnThis();

    expect(mainThis).to.equal(await contractMain.getAddress());
  });

  it('should confirm solidity functionality: super', async function () {
    const res = await contractMain.classIdentifier();

    expect(res).to.equal('Main');
  });
});
