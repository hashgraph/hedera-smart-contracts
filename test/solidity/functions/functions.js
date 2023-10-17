const { expect } = require('chai')
const { ethers } = require('hardhat')
const Constants = require('../../constants')
const Utils = require('../../hts-precompile/utils')

const weibarTotinybar = (amount) => amount.div(Utils.tinybarToWeibarCoef)

describe('Solidity Functions', function () {
  let signers, contract, contractAddr, contractChild, 
        contractChildAddr, contractParent, contractParentAddr, wallet

  before(async function () {
    signers = await ethers.getSigners()
    wallet = signers[0]

    const factory = await ethers.getContractFactory(Constants.Contract.Functions)
    contract = await factory.deploy()
    await contract.deployed()
    contractAddr = contract.address

    const factoryChild = await ethers.getContractFactory(Constants.Contract.FunctionsChild)
    contractChild = await factoryChild.deploy()
    await contractChild.deployed()
    contractChildAddr = contractChild.address

    const factoryParent = await ethers.getContractFactory(Constants.Contract.FunctionsParent)
    contractParent = await factoryParent.deploy(contractAddr)
    await contractParent.deployed()
    contractParentAddr = contractParent.address
  })

  it('should confirm "internal" functionality', async function () {
    const message = await contractChild.getMessageString()
    expect(message).to.equal('Hello World')

    try {
        await contract.getMessage()
    } catch (error) {
        expect(error.message).to.equal('contract.getMessage is not a function')
    }
  })

  it('should confirm "external" functionality', async function () {
    const gas = await contractParent.testExternal()
    const gasSecond = await contract.checkGasleft()
    const fromExternalCall = await contract.checkGasleftFromExternalCall()
    expect(fromExternalCall).to.exist
    expect(gas).to.exist
    expect(gasSecond).to.exist
  })

  it('should confirm "payable" functionality', async function () {
    const txDeposit = await contract.deposit({value: ethers.utils.parseEther("1.0")})
    txDeposit.wait();
    const balance = await contract.getBalance()
    expect(balance).to.exist
    expect(balance).to.equal(weibarTotinybar(ethers.utils.parseEther("1.0")))
    try {
        await contract.notPayable({value: ethers.utils.parseEther("1.0")})
    } catch (error) {
        expect(error.code).to.eq('UNSUPPORTED_OPERATION')
    }
  })

  it('should confirm "method({param1: value1, param2: value2...}): name properties" functionality', async function () {
    const res = await contract.manyInputsProxyCall()
    expect(res).to.exist
  })

  it('should confirm "function func(uint k, uint)": omitted parameter name', async function () {
    const res = await contract.sumThemUp(12 , 12)
    expect(res).to.equal(12)
  })
})
