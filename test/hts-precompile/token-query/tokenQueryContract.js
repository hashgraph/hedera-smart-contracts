const {expect} = require("chai");
const {ethers} = require("hardhat");
const utils = require('../utils');

describe("TokenQueryContract tests", function () {

    const TX_SUCCESS_CODE = 22;

    let tokenCreateContract;
    let tokenQueryContract;
    let tokenAddress;
    let nftTokenAddress;
    let mintedTokenSerialNumber;
    let signers;

    before(async function () {
        tokenCreateContract = await utils.deployTokenCreateContract();
        tokenQueryContract = await utils.deployTokenQueryContract();

        tokenAddress = await utils.createFungibleToken(tokenCreateContract);
        nftTokenAddress = await utils.createNonFungibleToken(tokenCreateContract);
        mintedTokenSerialNumber = await utils.mintNFT(tokenCreateContract, nftTokenAddress);
    
        await utils.associateToken(tokenCreateContract, tokenAddress, 'TokenCreateContract');
        await utils.grantTokenKyc(tokenCreateContract, tokenAddress);
        await utils.associateToken(tokenCreateContract, nftTokenAddress, 'TokenCreateContract');
        await utils.grantTokenKyc(tokenCreateContract, nftTokenAddress);

        signers = await ethers.getSigners();
      });

    it('should query allowance', async function () {
        const tx = await tokenQueryContract.allowancePublic(tokenAddress, tokenCreateContract.address, signers[1].address);
        const amount =  (await tx.wait()).events.filter(e => e.event === 'AllowanceValue')[0].args.amount.toNumber();
        const { responseCode } = (await tx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args;
        expect(responseCode).to.equal(TX_SUCCESS_CODE);
        expect(amount).to.equal(0);
    });

    it('should query getApproved', async function () {

    });

    it('should query isApprovedForAll', async function () {

    });

    it('should query isFrozen', async function () {

    });

    it('should query isKyc', async function () {

    });

    it('should query getTokenCustomFees', async function () {

    });

    it('should query getTokenDefaultFreezeStatus', async function () {

    });

    it('should query getTokenDefaultKycStatus', async function () {

    });

    it('should query getTokenExpiryInfo', async function () {

    });

    it('should query getFungibleTokenInfo', async function () {

    });

    it('should query getTokenInfo', async function () {

    });

    it('should query getTokenKey', async function () {

    });

    it('should query getNonFungibleTokenInfo', async function () {

    });

    it('should query isToken', async function () {

    });

    it('should query getTokenType', async function () {

    });
});