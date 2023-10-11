const { expect } = require('chai')
const { ethers } = require('hardhat')
const { SECOND, MINUTE, HOUR, DAY, WEEK } = require('../../constants')

describe('Time Units tests', function () {
  let signers
  let contract

  before(async function () {
    signers = await ethers.getSigners()

    const factory = await ethers.getContractFactory('TimeUnits')
    contract = await factory.deploy()
  })

  it('confirm 1 == 1 seconds', async function () {
    const res = await contract.get1Second()

    expect(res).to.equal(SECOND)
  })

  it('confirm 1 minutes == 60 seconds', async function () {
    const res = await contract.get1Minute()

    expect(res).to.equal(MINUTE)
  })

  it('confirm 1 hours == 60 minutes', async function () {
    const res = await contract.get1Hour()

    expect(res).to.equal(HOUR)
  })

  it('confirm 1 days == 24 hours', async function () {
    const res = await contract.get1Day()

    expect(res).to.equal(DAY)
  })

  it('confirm 1 weeks == 7 days', async function () {
    const res = await contract.get1Week()

    expect(res).to.equal(WEEK)
  })

})
