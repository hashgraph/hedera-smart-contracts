// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../constants');

describe('@OZMulticall Test Suite', function () {
  let contract;

  before(async function () {
    const factoryErrorsExternal = await ethers.getContractFactory(
      Constants.Contract.MulticallTest
    );
    contract = await factoryErrorsExternal.deploy();
  });

  it('should perform a multicall', async function () {
    const foo = await contract.foo.populateTransaction();
    const bar = await contract.bar.populateTransaction();
    const res = await contract.multicall.staticCall([foo.data, bar.data]);

    expect(BigInt(res[0])).to.be.equal(BigInt(123));
    expect(BigInt(res[1])).to.be.equal(BigInt(456));
  });
});
