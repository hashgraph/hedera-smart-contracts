const {expect} = require("chai");
const {ethers} = require("hardhat");
const utils = require('../utils');

describe("TokenCreateContract tests", function () {
  let tokenCreateContract;
  let tokenTransferContract;
  let tokenManagmentContract;
  let erc20Contract;
  let erc721Contract;
  let tokenAddress;
  let nftTokenAddress;
  let mintedTokenSerialNumber;

  before(async function () {
    tokenCreateContract = await utils.deployTokenCreateContract();
    tokenTransferContract = await utils.deployTokenTransferContract();
    tokenManagmentContract = await utils.deployTokenManagementContract();
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

  it('should be able to execute burnToken', async function () {
    const amount = 111;
    const totalSupplyBefore = await erc20Contract.totalSupply(tokenAddress);
    const balanceBefore = await erc20Contract.balanceOf(tokenAddress, tokenCreateContract.address);
    await tokenManagmentContract.burnTokenPublic(tokenAddress, amount, []);
    const balanceAfter = await erc20Contract.balanceOf(tokenAddress, tokenCreateContract.address);
    const totalSupplyAfter = await erc20Contract.totalSupply(tokenAddress);

    expect(totalSupplyAfter).to.equal(totalSupplyBefore - amount);
    expect(balanceAfter).to.equal(balanceBefore - amount);
  });

  it('should be able to execute dissociateTokens and associateTokens', async function () {
    const signers = await ethers.getSigners();
    const tokenCreateContractWallet2 = tokenCreateContract.connect(signers[1]);
    const tokenManagmentContractWallet2 = tokenManagmentContract.connect(signers[1]);

    const txDisassociate = await tokenManagmentContractWallet2.dissociateTokensPublic(signers[1].address, [tokenAddress], {gasLimit: 1_000_000});
    const receiptDisassociate = await txDisassociate.wait();
    expect(receiptDisassociate.events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.equal(22);

    const txAssociate = await tokenCreateContractWallet2.associateTokensPublic(signers[1].address, [tokenAddress], {gasLimit: 1_000_000});
    const receiptAssociate = await txAssociate.wait();
    expect(receiptAssociate.events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.equal(22);
  });

  it('should be able to execute dissociateToken and associateToken', async function () {
    const signers = await ethers.getSigners();
    const tokenCreateContractWallet2 = tokenCreateContract.connect(signers[1]);
    const tokenManagmentContractWallet2 = tokenManagmentContract.connect(signers[1]);

    const txDisassociate = await tokenManagmentContractWallet2.dissociateTokenPublic(signers[1].address, tokenAddress, {gasLimit: 1_000_000});
    const receiptDisassociate = await txDisassociate.wait();
    expect(receiptDisassociate.events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.equal(22);

    const txAssociate = await tokenCreateContractWallet2.associateTokenPublic(signers[1].address, tokenAddress, {gasLimit: 1_000_000});
    const receiptAssociate = await txAssociate.wait();
    expect(receiptAssociate.events.filter(e => e.event === 'ResponseCode')[0].args.responseCode).to.equal(22);
  });
});
