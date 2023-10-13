const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Crypto Inheritance tests', function () {
  let signers, contractMain, contractMainAddr, contractBase, contractBaseAddr, wallet
  const TOP_UP_AMOUNT = ethers.utils.parseEther('0.000001');

  before(async function () {
    signers = await ethers.getSigners()
    wallet = signers[0];

    const factoryMain = await ethers.getContractFactory('Main')
    contractMain = await factoryMain.deploy()
    await contractMain.deployed()
    contractMainAddr = contractMain.address

    const factoryBase = await ethers.getContractFactory('Base')
    contractBase = await factoryBase.deploy()
    await contractBase.deployed()
    contractBaseAddr = contractBase.address

    //top up the test contract with some funds
    const tx = {
        to: contractMainAddr,
        value: TOP_UP_AMOUNT
    }
    const topUpRes = await wallet.sendTransaction(tx)
    await topUpRes.wait();
  })

  it("this (current contract's type)", async function () {
    const mainThis = await contractMain.returnThis()

    expect(mainThis).to.equal(contractMainAddr)
  })

  it('super', async function () {
    const res = await contractMain.classIdentifier()

    expect(res).to.equal("Main")
  })

  it('selfdestruct(address payable recipient)', async function () {
    const balanceBaseInitial = await contractBase.getBalance()
    expect(balanceBaseInitial).to.be.equal(0)

    const tx = await contractMain.destroyContract(contractBaseAddr)
    tx.wait()
    const balanceBaseFinal = await contractBase.getBalance()

    expect(balanceBaseFinal.gt(balanceBaseInitial)).to.be.true
  })

})
