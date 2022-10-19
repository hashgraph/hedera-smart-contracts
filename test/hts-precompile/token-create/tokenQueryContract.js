const {expect} = require("chai");
const {ethers} = require("hardhat");
const utils = require('../utils');

describe("TokenQueryContract tests", function () {
    let tokenCreateContract;
    let tokenQueryContract;
    let tokenTransferContract;
    let tokenManagmentContract;
    let tokenAddress;
    let nftTokenAddress;
    let mintedTokenSerialNumber;

    before(async function () {
        tokenCreateContract = await utils.deployTokenCreateContract();
        tokenQueryContract = await utils.deployTokenQueryContract();
        tokenTransferContract = await utils.deployTokenTransferContract();
        tokenManagmentContract = await utils.deployTokenManagementContract();
        tokenAddress = await utils.createFungibleToken(tokenCreateContract);
        nftTokenAddress = await utils.createNonFungibleToken(tokenCreateContract);
        mintedTokenSerialNumber = await utils.mintNFT(tokenCreateContract, nftTokenAddress);

        await utils.associateToken(tokenCreateContract, tokenAddress, 'TokenCreateContract');
        await utils.grantTokenKyc(tokenCreateContract, tokenAddress);
        await utils.associateToken(tokenCreateContract, nftTokenAddress, 'TokenCreateContract');
        await utils.grantTokenKyc(tokenCreateContract, nftTokenAddress);
    });

    it('should be able to execute getNonFungibleTokenInfo', async function () {
        const tx = await tokenQueryContract.getNonFungibleTokenInfoPublic(nftTokenAddress, mintedTokenSerialNumber, { gasLimit: 1000000 });
        const { responseCode } = (await tx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args;
        const { tokenInfo } = (await tx.wait()).events.filter(e => e.event === 'NonFungibleTokenInfo')[0].args;
        expect(responseCode).to.equal(22);
        expect(tokenInfo).to.exist;
    });

    it('should be able to execute getTokenInfo', async function () {
        const tx = await tokenQueryContract.getTokenInfoPublic(tokenAddress, { gasLimit: 1000000 });
        const { responseCode } = (await tx.wait()).events.filter(e => e.event === 'ResponseCode')[0].args;
        const { tokenInfo } = (await tx.wait()).events.filter(e => e.event === 'TokenInfo')[0].args;
        expect(responseCode).to.equal(22);
        expect(tokenInfo).to.exist;
    });
});
