const { expect, assert } = require('chai')
const { ethers } = require('hardhat')
const Constants = require('../../constants')

describe('@solidityequiv2 Solidity Errors', function () {
  let signers
  let contract

  before(async function () {
    signers = await ethers.getSigners()

    const factory = await ethers.getContractFactory(Constants.Contract.Errors)
    contract = await factory.deploy()
  })

  it('confirm assert works', async function () {
    try {
      const res = await contract.assertCheck(1 == 1)
      expect(res).to.equal(true)

      await contract.assertCheck(1 > 1)
    } catch (err) {
        expect(err).to.exist
    }
  })

  it('confirm require works', async function () {
    try {
        const resReverted = await contract.requireCheck(true)
        expect(resReverted).to.equal(true)
  
        const res = await contract.requireCheck(false)
      } catch (err) {
          expect(err).to.exist
      }
  })

  it('confirm revert works', async function () {
    try {
        await contract.revertCheck()
    } catch (err) {
        expect(err).to.exist
    }
  })

  it('confirm revert with message works', async function () {
    const message = "We unfortunalty need to revert this transaction"
    try {
        await contract.revertWithMessageCheck(message)
    } catch (err) {
        expect(err.reason).to.exist
        expect(err.reason).to.equal(message)
    }
  })

})
