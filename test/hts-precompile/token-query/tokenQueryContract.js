const {expect} = require("chai");
const {ethers} = require("hardhat");
const utils = require('../utils');

describe.only("TokenQueryContract tests", function () {

    const TX_SUCCESS_CODE = 22;

    let tokenCreateContract;
    let tokenQueryContract;
    let tokenAddress;
    let tokenWithCustomFeesAddress;
    let nftTokenAddress;
    let mintedTokenSerialNumber;
    let signers;

    before(async function () {
        tokenCreateContract = await utils.deployTokenCreateContract();
        tokenQueryContract = await utils.deployTokenQueryContract();

        // tokenAddress = await utils.createFungibleToken(tokenCreateContract);
        // tokenWithCustomFeesAddress = await utils.createFungibleTokenWithCustomFees(tokenCreateContract, tokenAddress);
        nftTokenAddress = await utils.createNonFungibleToken(tokenCreateContract);
        mintedTokenSerialNumber = await utils.mintNFT(tokenCreateContract, nftTokenAddress);
        
        // await utils.associateToken(tokenCreateContract, tokenAddress, 'TokenCreateContract');
        // await utils.grantTokenKyc(tokenCreateContract, tokenAddress);
        await utils.associateToken(tokenCreateContract, nftTokenAddress, 'TokenCreateContract');
        await utils.grantTokenKyc(tokenCreateContract, nftTokenAddress);

        signers = await ethers.getSigners();
      });

    xit('should query allowance', async function () {
        const tx = await tokenQueryContract.allowancePublic(tokenAddress, tokenCreateContract.address, signers[1].address);
        const amount =  (await tx.wait()).events.filter(e => e.event === 'AllowanceValue')[0].args.amount.toNumber();
        const { responseCode } = (await tx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args;

        expect(responseCode).to.equal(TX_SUCCESS_CODE);
        expect(amount).to.equal(0);
    });

    xit('should query getApproved', async function () {
        const tx = await tokenQueryContract.getApprovedPublic(nftTokenAddress, mintedTokenSerialNumber);
        const { approved } =  (await tx.wait()).events.filter(e => e.event === 'ApprovedAddress')[0].args;
        const { responseCode } = (await tx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args;

        expect(responseCode).to.equal(TX_SUCCESS_CODE);
        expect(approved).to.equal('0x0000000000000000000000000000000000000000');
    });

    xit('should query isApprovedForAll', async function () {
        const tx = await tokenQueryContract.isApprovedForAllPublic(nftTokenAddress, tokenCreateContract.address, signers[1].address);
        const approved =  (await tx.wait()).events.filter(e => e.event === 'Approved')[0].args.approved;
        const { responseCode } = (await tx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args;

        expect(responseCode).to.equal(TX_SUCCESS_CODE);
        expect(approved).to.equal(false);
    });

    xit('should query isFrozen', async function () {
        const tx = await tokenQueryContract.isFrozenPublic(tokenAddress, tokenCreateContract.address);
        const isFrozen = (await tx.wait()).events.filter(e => e.event === 'Frozen')[0].args.frozen;
        const { responseCode } = (await tx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args;

        expect(responseCode).to.equal(TX_SUCCESS_CODE);
        expect(isFrozen).to.equal(false);
    });

    xit('should query isKyc', async function () {
        const tx = await tokenQueryContract.isKycPublic(tokenAddress, tokenCreateContract.address);
        const isFrozen = (await tx.wait()).events.filter(e => e.event === 'KycGranted')[0].args.kycGranted;
        const { responseCode } = (await tx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args;

        expect(responseCode).to.equal(TX_SUCCESS_CODE);
        expect(isFrozen).to.equal(true);
    });

    xit('should query getTokenCustomFees', async function () {
        const tx = await tokenQueryContract.getTokenCustomFeesPublic(tokenWithCustomFeesAddress);
        const { fixedFees, fractionalFees } = (await tx.wait()).events.filter(e => e.event === 'TokenCustomFees')[0].args;
        const { responseCode } = (await tx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args;

        expect(responseCode).to.equal(TX_SUCCESS_CODE);

        expect(fixedFees[0].amount).to.equal(1);
        expect(fixedFees[0].tokenId).to.equal(tokenAddress);
        expect(fixedFees[0].useHbarsForPayment).to.equal(false);
        expect(fixedFees[0].useCurrentTokenForPayment).to.equal(false);
    
        expect(fractionalFees[0].numerator).to.equal(4);
        expect(fractionalFees[0].denominator).to.equal(5);
        expect(fractionalFees[0].minimumAmount).to.equal(10);
        expect(fractionalFees[0].maximumAmount).to.equal(30);
        expect(fractionalFees[0].netOfTransfers).to.equal(false);
    });

    xit('should query getTokenDefaultFreezeStatus', async function () {
        const tx = await tokenQueryContract.getTokenDefaultFreezeStatusPublic(tokenAddress);
        const defaultFreezeStatus = (await tx.wait()).events.filter(e => e.event === 'TokenDefaultFreezeStatus')[0].args.defaultFreezeStatus;
        const { responseCode } = (await tx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args;

        expect(responseCode).to.equal(TX_SUCCESS_CODE);
        expect(defaultFreezeStatus).to.equal(false);
    });

    xit('should query getTokenDefaultKycStatus', async function () {
        const tx = await tokenQueryContract.getTokenDefaultKycStatusPublic(tokenAddress);
        const defaultKycStatus = (await tx.wait()).events.filter(e => e.event === 'TokenDefaultKycStatus')[0].args.defaultKycStatus;
        const { responseCode } = (await tx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args;

        expect(responseCode).to.equal(TX_SUCCESS_CODE);
        expect(defaultKycStatus).to.equal(false);
    });

    xit('should query getTokenExpiryInfo', async function () {
        const tx = await tokenQueryContract.getTokenExpiryInfoPublic(tokenAddress);
        const expiryInfo = (await tx.wait()).events.filter(e => e.event === 'TokenExpiryInfo')[0].args.expiryInfo;
        const { responseCode } = (await tx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args;

        expect(responseCode).to.equal(TX_SUCCESS_CODE);
        expect(expiryInfo).not.null;
    });

    xit('should query getFungibleTokenInfo', async function () {
        const tx = await tokenQueryContract.getFungibleTokenInfoPublic(tokenAddress);
        const tokenInfo = (await tx.wait()).events.filter(e => e.event === 'FungibleTokenInfo')[0].args.tokenInfo;
        const { responseCode } = (await tx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args;

        expect(responseCode).to.equal(TX_SUCCESS_CODE);
        expect(tokenInfo).not.null;
    });

    xit('should query getTokenInfo', async function () {
        const tx = await tokenQueryContract.getTokenInfoPublic(tokenAddress);
        const tokenInfo = (await tx.wait()).events.filter(e => e.event === 'TokenInfo')[0].args.tokenInfo;
        const { responseCode } = (await tx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args;

        expect(responseCode).to.equal(TX_SUCCESS_CODE);
        expect(tokenInfo).not.null;
    });

    xit('should query getTokenKey', async function () {
        const tx = await tokenQueryContract.getTokenKeyPublic(tokenAddress, 2);
        const key = (await tx.wait()).events.filter(e => e.event === 'TokenKey')[0].args.key;
        const { responseCode } = (await tx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args;

        expect(responseCode).to.equal(TX_SUCCESS_CODE);
        expect(key).to.exist;
    });

    it('should query getNonFungibleTokenInfo', async function () {
        const tx = await tokenQueryContract.getNonFungibleTokenInfoPublic(nftTokenAddress, mintedTokenSerialNumber);
        const tokenInfo = (await tx.wait()).events.filter(e => e.event === 'TokenInfo')[0].args.tokenInfo;
        const { responseCode } = (await tx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args;

        expect(responseCode).to.equal(TX_SUCCESS_CODE);
        expect(tokenInfo).not.null;
    });

    it('should query isToken', async function () {

    });

    it('should query getTokenType', async function () {

    });
});