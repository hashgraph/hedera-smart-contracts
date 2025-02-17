// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../constants');

describe('@yulequiv Data Allocation Test Suite', () => {
  let dataAllocationContract;
  const P = 32;
  const V = 72;
  const SLOT_0_KEY = 0;
  const SLOT_1_KEY = 1;

  before(async () => {
    const dataAllocationContractFactory = await ethers.getContractFactory(
      Constants.Contract.DataAllocation
    );

    dataAllocationContract = await dataAllocationContractFactory.deploy();
  });

  it('Should execute allocateMemory', async () => {
    const result = await dataAllocationContract.allocateMemory(P, V);

    expect(result).to.eq(V);
  });

  it('Should execute allocateMemory8', async () => {
    const result = await dataAllocationContract.allocateMemory8(P, V);

    expect(result).to.eq(V);
  });

  it('Should execute sload', async () => {
    const EXPECTED_SLOT_0_VALUE = 0; // state variable `a`
    const EXPECTED_SLOT_1_VALUE = 12; // state variable `b`

    const result0 = await dataAllocationContract.sload(SLOT_0_KEY);
    const result1 = await dataAllocationContract.sload(SLOT_1_KEY);

    expect(result0).to.eq(EXPECTED_SLOT_0_VALUE);
    expect(result1).to.eq(EXPECTED_SLOT_1_VALUE);
  });

  it('Should execute sstore', async () => {
    await (await dataAllocationContract.sstore(SLOT_0_KEY, V)).wait();

    const result = await dataAllocationContract.sload(SLOT_0_KEY);

    expect(result).to.eq(V);
  });
});
