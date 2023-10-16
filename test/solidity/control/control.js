const { expect } = require('chai')
const { ethers } = require('hardhat')
const Constants = require('../../constants')

describe('Control Structures', function () {
    let contract;

    before(async function () {
        const factory = await ethers.getContractFactory(Constants.Contract.ControlStructures)
        contract = await factory.deploy()
    })

    it('should verify is is working correctly', async function () {
        const res = await contract.testIfElse(false)
        expect(res).to.equal(false)
    })

    it('should verify else is working correctly', async function () {
        const res = await contract.testIfElse(true)
        expect(res).to.equal(true)
    })

    it('should verify while is working correctly', async function () {
        const res = await contract.testWhile(5)
        expect(res).to.equal(5) 
    })

    it('should verify do is working correctly', async function () {
        const res = await contract.testDoWhile(5)
        expect(res).to.equal(5) 
    })

    it('should verify break is working correctly', async function () {
        const res = await contract.testBreak(5, 3)
        expect(res).to.equal(3) 
    })

    it('should verify continue is working correctly', async function () {
        const res = await contract.testContinue(5, 3)
        expect(res).to.equal(4) 
    })

    it('should verify for is working correctly', async function () {
        const res = await contract.testFor(5)
        expect(res).to.equal(4) 
    })

    it('should verify catch is working correctly', async function () {
        const res = await contract.testTryCatch(0)
        expect(res).to.equal(false) 
    })

    it('should verify try is working correctly', async function () {
        const res = await contract.testTryCatch(1)
        expect(res).to.equal(true) 
    })
})
