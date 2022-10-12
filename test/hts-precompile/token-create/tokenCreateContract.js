const {expect} = require("chai");
const {ethers} = require("hardhat");
const utils = require('../utils');

describe("TokenCreateContract tests", function () {
  let tokenCreateContract;
  let erc20Contract;
  let erc721Contract;
  let tokenAddress;
  let nftTokenAddress;
  let mintedTokenSerialNumber;

  before(async function () {
    tokenCreateContract = await utils.deployTokenCreateContract();
    erc20Contract = await utils.deployERC20Contract();
    erc721Contract = await utils.deployERC721Contract();
    tokenAddress = await utils.createFungibleToken(tokenCreateContract);
    nftTokenAddress = await utils.createNonFungibleToken(tokenCreateContract);
    mintedTokenSerialNumber = await utils.mintNFT(tokenCreateContract, nftTokenAddress);

    await utils.associateToken(tokenCreateContract, tokenAddress, 'TokenCreateContract');
    await utils.grantTokenKyc(tokenCreateContract, tokenAddress);
    await utils.associateToken(tokenCreateContract, nftTokenAddress, 'TokenCreateContract');
    await utils.grantTokenKyc(tokenCreateContract, nftTokenAddress);
  });

  it('should be able to execute transferTokens', async function () {
    const amount = 33;
    const signers = await ethers.getSigners();

    let contractOwnerBalanceBefore = await erc20Contract.balanceOf(tokenAddress, tokenCreateContract.address);
    let wallet1BalanceBefore = await erc20Contract.balanceOf(tokenAddress, signers[0].address);
    await tokenCreateContract.transferTokensPublic(tokenAddress, [tokenCreateContract.address, signers[0].address], [-amount, amount], {gasLimit: 1_000_000});
    let contractOwnerBalanceAfter = await erc20Contract.balanceOf(tokenAddress, tokenCreateContract.address);
    let wallet1BalanceAfter = await erc20Contract.balanceOf(tokenAddress, signers[0].address);

    expect(contractOwnerBalanceAfter).to.equal(contractOwnerBalanceBefore - amount);
    expect(wallet1BalanceAfter).to.equal(wallet1BalanceBefore + amount);
  });

  it('should be able to execute transferNFTs', async function () {
    const signers = await ethers.getSigners();
    const ownerBefore = await erc721Contract.ownerOf(nftTokenAddress, mintedTokenSerialNumber);
    await tokenCreateContract.transferNFTPublic(nftTokenAddress, tokenCreateContract.address, signers[0].address, mintedTokenSerialNumber, {gasLimit: 1_000_000});
    const ownerAfter = await erc721Contract.ownerOf(nftTokenAddress, mintedTokenSerialNumber);

    expect(ownerBefore).to.equal(tokenCreateContract.address);
    expect(ownerAfter).to.equal(signers[0].address);
  });

  it('should be able to execute burnToken', async function () {
    const amount = 111;
    const totalSupplyBefore = await erc20Contract.totalSupply(tokenAddress);
    const balanceBefore = await erc20Contract.balanceOf(tokenAddress, tokenCreateContract.address);
    await tokenCreateContract.burnTokenPublic(tokenAddress, amount, []);
    const balanceAfter = await erc20Contract.balanceOf(tokenAddress, tokenCreateContract.address);
    const totalSupplyAfter = await erc20Contract.totalSupply(tokenAddress);

    expect(totalSupplyAfter).to.equal(totalSupplyBefore - amount);
    expect(balanceAfter).to.equal(balanceBefore - amount);
  });

  it('should be able to execute dissociateTokens and associateTokens', async function () {
    const signers = await ethers.getSigners();
    const tokenCreateContractWallet2 = tokenCreateContract.connect(signers[1]);

    const txDisassociate = await tokenCreateContractWallet2.dissociateTokensPublic(signers[1].address, [tokenAddress], {gasLimit: 1_000_000});
    const receiptDisassociate = await txDisassociate.wait();
    expect(receiptDisassociate.events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.equal(22);

    const txAssociate = await tokenCreateContractWallet2.associateTokensPublic(signers[1].address, [tokenAddress], {gasLimit: 1_000_000});
    const receiptAssociate = await txAssociate.wait();
    expect(receiptAssociate.events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.equal(22);
  });

  it('should be able to execute dissociateToken and associateToken', async function () {
    const signers = await ethers.getSigners();
    const tokenCreateContractWallet2 = tokenCreateContract.connect(signers[1]);

    const txDisassociate = await tokenCreateContractWallet2.dissociateTokenPublic(signers[1].address, tokenAddress, {gasLimit: 1_000_000});
    const receiptDisassociate = await txDisassociate.wait();
    expect(receiptDisassociate.events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.equal(22);

    const txAssociate = await tokenCreateContractWallet2.associateTokenPublic(signers[1].address, tokenAddress, {gasLimit: 1_000_000});
    const receiptAssociate = await txAssociate.wait();
    expect(receiptAssociate.events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.equal(22);
  });
});
