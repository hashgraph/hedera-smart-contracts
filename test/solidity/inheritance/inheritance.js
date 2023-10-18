const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Crypto Inheritance tests', function () {
  let signers, contractMain, contractBase, wallet
  const TOP_UP_AMOUNT = ethers.utils.parseEther('0.000001');

  before(async function () {
    signers = await ethers.getSigners()
    wallet = signers[0];

    const factoryMain = await ethers.getContractFactory('Main')
    contractMain = await factoryMain.deploy()
    await contractMain.deployed()

    const factoryBase = await ethers.getContractFactory('Base')
    contractBase = await factoryBase.deploy()
    await contractBase.deployed()

    //top up the test contract with some funds
    const tx = {
        to: contractMain.address,
        value: TOP_UP_AMOUNT
    }
    const topUpRes = await wallet.sendTransaction(tx)
    await topUpRes.wait();
  })

  it('should confirm solidity functionality: this (current contract\'s type)', async function () {
    const mainThis = await contractMain.returnThis()

    expect(mainThis).to.equal(contractMain.address)
  })

  it('should confirm solidity functionality: super', async function () {
    const res = await contractMain.classIdentifier()

    expect(res).to.equal("Main")
  })

  it('should confirm solidity functionality: selfdestruct(address payable recipient)', async function () {
    const balanceBaseInitial = await contractBase.getBalance()
    expect(balanceBaseInitial).to.be.equal(0)

    const tx = await contractMain.destroyContract(contractBase.address)
    await tx.wait()
    const balanceBaseFinal = await contractBase.getBalance()

    expect(balanceBaseFinal.gt(balanceBaseInitial)).to.be.true
  })

})
