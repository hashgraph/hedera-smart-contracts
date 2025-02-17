// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../constants');

describe('@solidityequiv1 Assignments Test Suite', function () {
  before(async function () {
    const factoryDestructuring = await ethers.getContractFactory(
      Constants.Contract.DestructuringReturns
    );
    contractDesctructuring = await factoryDestructuring.deploy();

    const factoryReferenceTypes = await ethers.getContractFactory(
      Constants.Contract.AssignmentReferenceTypes
    );
    contractReferenceTypes = await factoryReferenceTypes.deploy();
  });

  it('should verify destructuring works', async function () {
    const result = await contractDesctructuring.testDestructuredReturnParams();
    expect(result).to.deep.equal([BigInt(7), true, BigInt(2)]);
  });

  it('should verify assignment of reference types', async function () {
    // here we are testing that if a parameter is assigned to memory a copy will be created
    // and the original object wont be changed
    // while if it is in storage and only referenced we expect it to change
    await (await contractReferenceTypes.testAssignmentOfReferenceTypes()).wait();
    const result = await contractReferenceTypes.getSomeArray();
    expect(result).to.deep.equal([
      BigInt(1),
      BigInt(2),
      BigInt(3),
      BigInt(10),
      BigInt(5),
    ]);
  });
});
