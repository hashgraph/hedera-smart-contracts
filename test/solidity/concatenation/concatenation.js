const { expect } = require('chai')
const { ethers } = require('hardhat')
const Constants = require('../../constants')

describe('Concatenation', function () {
    let signers;
    let contract;
    const first = 'first';
    const second = 'second';
    const third = 'third';

    before(async function () {
        signers = await ethers.getSigners()

        const factory = await ethers.getContractFactory(Constants.Contract.Concatenation)
        contract = await factory.deploy()
    })

    it('byte concatenation', async function () {
        let utf8Encode = new TextEncoder();
        const bytesFirst = utf8Encode.encode(first);
        const bytesSecond = utf8Encode.encode(second);
        const bytesThird = utf8Encode.encode(third);
        const res = await contract.byteConcatenation(bytesFirst, bytesSecond, bytesThird)
        
        expect((bytesFirst.byteLength + bytesSecond.byteLength + bytesThird.byteLength)).to.equal(res);
    })

    it('string concatenation', async function () {
        const res = await contract.stringConcatenation(first, second, third);

        expect((first.length + second.length + third.length)).to.equal(res.length);
        expect(first.concat(second, third)).to.equal(res); 
    })

    it('string concatenation Empty', async function () {
        const res = await contract.stringConcatenationEmpty()

        expect(res.length).to.equal(0)
    })

    it('string concatenation Empty', async function () {
        const res = await contract.stringConcatenationEmpty()

        expect(res.length).to.equal(0)
    })
})
