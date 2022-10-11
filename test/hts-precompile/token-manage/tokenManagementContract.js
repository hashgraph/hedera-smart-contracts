const {expect} = require("chai");
const {ethers} = require("hardhat");
const utils = require('../utils');

describe("TokenManagementContract tests", function () {
  let tokenManagementContract;
  let erc20Contract;
  let erc721Contract;
  let tokenAddress;
  let nftTokenAddress;
  let mintedTokenSerialNumber;

  before(async function () {
    tokenManagementContract = await utils.deployTokenManagementContract();
    erc20Contract = await utils.deployERC20Contract();
    erc721Contract = await utils.deployERC721Contract();
    tokenAddress = await utils.createFungibleToken(tokenManagementContract);
    nftTokenAddress = await utils.createNonFungibleToken(tokenManagementContract);
    mintedTokenSerialNumber = await utils.mintNFT(tokenManagementContract, nftTokenAddress);

    await utils.associateToken(tokenManagementContract, tokenAddress);
    await utils.grantTokenKyc(tokenManagementContract, tokenAddress);
    await utils.associateToken(tokenManagementContract, nftTokenAddress);
    await utils.grantTokenKyc(tokenManagementContract, nftTokenAddress);
  });

  it('should be able to execute transferTokens', async function () {
    const amount = 33;
    const signers = await ethers.getSigners();

    let contractOwnerBalanceBefore = await erc20Contract.balanceOf(tokenAddress, tokenManagementContract.address);
    let wallet1BalanceBefore = await erc20Contract.balanceOf(tokenAddress, signers[0].address);
    await tokenManagementContract.transferTokensPublic(tokenAddress, [tokenManagementContract.address, signers[0].address], [-amount, amount], {gasLimit: 1_000_000});
    let contractOwnerBalanceAfter = await erc20Contract.balanceOf(tokenAddress, tokenManagementContract.address);
    let wallet1BalanceAfter = await erc20Contract.balanceOf(tokenAddress, signers[0].address);

    expect(contractOwnerBalanceAfter).to.equal(contractOwnerBalanceBefore - amount);
    expect(wallet1BalanceAfter).to.equal(wallet1BalanceBefore + amount);
  });

  it('should be able to execute transferNFTs', async function () {
    const signers = await ethers.getSigners();
    const ownerBefore = await erc721Contract.ownerOf(nftTokenAddress, mintedTokenSerialNumber);
    await tokenManagementContract.transferNFTPublic(nftTokenAddress, tokenManagementContract.address, signers[0].address, mintedTokenSerialNumber, {gasLimit: 1_000_000});
    const ownerAfter = await erc721Contract.ownerOf(nftTokenAddress, mintedTokenSerialNumber);

    expect(ownerBefore).to.equal(tokenManagementContract.address);
    expect(ownerAfter).to.equal(signers[0].address);
  });

  it('should be able to execute burnToken', async function () {
    const amount = 111;
    const totalSupplyBefore = await erc20Contract.totalSupply(tokenAddress);
    const balanceBefore = await erc20Contract.balanceOf(tokenAddress, tokenManagementContract.address);
    await tokenManagementContract.burnTokenPublic(tokenAddress, amount, []);
    const balanceAfter = await erc20Contract.balanceOf(tokenAddress, tokenManagementContract.address);
    const totalSupplyAfter = await erc20Contract.totalSupply(tokenAddress);

    expect(totalSupplyAfter).to.equal(totalSupplyBefore - amount);
    expect(balanceAfter).to.equal(balanceBefore - amount);
  });

  it('should be able to execute dissociateTokens and associateTokens', async function () {
    const signers = await ethers.getSigners();
    const tokenManagementContractWallet2 = tokenManagementContract.connect(signers[1]);

    const txDisassociate = await tokenManagementContractWallet2.dissociateTokensPublic(signers[1].address, [tokenAddress], {gasLimit: 1_000_000});
    const receiptDisassociate = await txDisassociate.wait();
    expect(receiptDisassociate.events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.equal(22);

    const txAssociate = await tokenManagementContractWallet2.associateTokensPublic(signers[1].address, [tokenAddress], {gasLimit: 1_000_000});
    const receiptAssociate = await txAssociate.wait();
    expect(receiptAssociate.events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.equal(22);
  });

  it('should be able to execute dissociateToken and associateToken', async function () {
    const signers = await ethers.getSigners();
    const tokenManagementContractWallet2 = tokenManagementContract.connect(signers[1]);

    const txDisassociate = await tokenManagementContractWallet2.dissociateTokenPublic(signers[1].address, tokenAddress, {gasLimit: 1_000_000});
    const receiptDisassociate = await txDisassociate.wait();
    expect(receiptDisassociate.events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.equal(22);

    const txAssociate = await tokenManagementContractWallet2.associateTokenPublic(signers[1].address, tokenAddress, {gasLimit: 1_000_000});
    const receiptAssociate = await txAssociate.wait();
    expect(receiptAssociate.events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.equal(22);
  });
});
