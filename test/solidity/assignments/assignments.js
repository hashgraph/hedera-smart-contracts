const { expect } = require('chai')
const { ethers } = require('hardhat')
const Constants = require('../../constants')

describe('Test assignments', function () {
  let signers;

  before(async function () {
    signers = await ethers.getSigners()

    const factoryDestructuring = await ethers.getContractFactory(Constants.Contract.DestructuringReturns)
    contractDesctructuring = await factoryDestructuring.deploy()

    const factoryReferenceTypes = await ethers.getContractFactory(Constants.Contract.AssignmentReferenceTypes)
    contractReferenceTypes = await factoryReferenceTypes.deploy()
  })

  it('should verify destructuring works', async function () {
    const result = await contractDesctructuring.testDestructuredReturnParams();
    expect(result).to.deep.equal([ethers.BigNumber.from(7), true, ethers.BigNumber.from(2)])
  })

  it('should verify assignment of reference types', async function () {
    await contractReferenceTypes.testAssignmentOfReferenceTypes();
    const result = await contractReferenceTypes.getSomeArray();
    expect(result).to.deep.equal([ethers.BigNumber.from(1), ethers.BigNumber.from(2), ethers.BigNumber.from(3),
                                  ethers.BigNumber.from(10), ethers.BigNumber.from(5)])
  })
})
