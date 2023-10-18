const { expect } = require('chai')
const { ethers } = require('hardhat')
const { WEI, GWEI } = require('../../constants')

describe('@solidityequiv3 Crypto Units tests', function () {
  let signers
  let contract

  before(async function () {
    signers = await ethers.getSigners()

    const factory = await ethers.getContractFactory('CryptoUnits')
    contract = await factory.deploy()
  })

  it('confirm 1 wei == 1', async function () {
    const res = await contract.get1Wei()

    expect(res).to.equal(WEI)
  })

  it('confirm 1 gwei == 1e9', async function () {
    const res = await contract.get1GWei()

    expect(res).to.equal(GWEI)
  })

  it('confirm 1 ether == 1e18', async function () {
    const res = await contract.get1Eth()

    expect(res / 1e9).to.equal(GWEI)
  })

})
