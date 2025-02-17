// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../constants');

describe('@solidityequiv3 Scoping Test Suite', () => {
  let contract;

  before(async () => {
    const factory = await ethers.getContractFactory(Constants.Contract.Scoping);
    contract = await factory.deploy();
  });

  it('should verify the solidity functionality: "scoping"', async () => {
    await contract.minimalScoping();
    const resReassign = await contract.reassign();

    expect(resReassign).to.equal(2);
  });
});
