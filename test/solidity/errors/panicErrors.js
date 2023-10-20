const { expect, assert } = require('chai')
const { ethers } = require('hardhat')
const Constants = require('../../constants')

describe('Panic Errors', function () {
  let contract

  before(async function () {
    const factory = await ethers.getContractFactory(Constants.Contract.Panic)
    contract = await factory.deploy()
  })

  it('should verify panic error 0x01', async function () {
    let error;
    try {
      await contract.testPanicError0x01();
    } catch(e) {
      error = e;
    }
    expect(error.errorName).to.eq('Panic');
    expect(error.errorArgs).to.deep.eq([ethers.BigNumber.from(1)])
  })

  it('should verify panic error 0x11', async function () {
    let error;
    try {
      await contract.testPanicError0x11();
    } catch(e) {
      error = e;
    }
    expect(error.errorName).to.eq('Panic');
    expect(error.errorArgs).to.deep.eq([ethers.BigNumber.from(17)])
  })

  it('should verify panic error 0x12', async function () {
    let error;
    try {
      await contract.testPanicError0x12();
    } catch(e) {
      error = e;
    }
    expect(error.errorName).to.eq('Panic');
    expect(error.errorArgs).to.deep.eq([ethers.BigNumber.from(18)])
  })

  it('should verify panic error 0x21', async function () {
    let error;
    try {
      await contract.testPanicError0x21();
    } catch(e) {
      error = e;
    }
    expect(error.errorName).to.eq('Panic');
    expect(error.errorArgs).to.deep.eq([ethers.BigNumber.from(33)])
  })

  it('should verify panic error 0x31', async function () {
    let error;
    try {
      const result = await contract.getSomeArray();
      console.log(result);
      await contract.testPanicError0x31();
    } catch(e) {
      error = e;
    }
    expect(error.errorName).to.eq('Panic');
    expect(error.errorArgs).to.deep.eq([ethers.BigNumber.from(18)])
  })

  it('should verify panic error 0x32', async function () {
    let error;
    try {
      await contract.testPanicError0x32();
    } catch(e) {
      error = e;
    }
    expect(error.errorName).to.eq('Panic');
    expect(error.errorArgs).to.deep.eq([ethers.BigNumber.from(50)])
  })

  it('should verify panic error 0x41', async function () {
    let error;
    try {
      await contract.testPanicError0x41();
    } catch(e) {
      console.log(e)
      error = e;
    }
    expect(error.errorName).to.eq('Panic');
    expect(error.errorArgs).to.deep.eq([ethers.BigNumber.from(65)])
  })

  it('should verify panic error 0x51', async function () {
    let error;
    try {
      await contract.testPanicError0x51();
    } catch(e) {
      error = e;
    }
    expect(error.errorName).to.eq('Panic');
    expect(error.errorArgs).to.deep.eq([ethers.BigNumber.from(81)])
  })
})
