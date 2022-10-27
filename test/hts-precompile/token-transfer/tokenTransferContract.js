const {expect} = require("chai");
const {ethers} = require("hardhat");
const utils = require('../utils');

describe("TokenTransferContract tests", function () {

  const TX_SUCCESS_CODE = 22;

  let tokenCreateContract;
  let tokenTransferContract;
  let tokenQueryContract;
  let erc20Contract;
  let erc721Contract;
  let tokenAddress;
  let nftTokenAddress;
  let mintedTokenSerialNumber;
  let signers;

  before(async function () {
    tokenCreateContract = await utils.deployTokenCreateContract();
    tokenQueryContract = await utils.deployTokenQueryContract();
    tokenTransferContract = await utils.deployTokenTransferContract();
    erc20Contract = await utils.deployERC20Contract();
    erc721Contract = await utils.deployERC721Contract();

    tokenAddress = await utils.createFungibleToken(tokenCreateContract);
    nftTokenAddress = await utils.createNonFungibleToken(tokenCreateContract);
    mintedTokenSerialNumber = await utils.mintNFT(tokenCreateContract, nftTokenAddress);

    await utils.associateToken(tokenCreateContract, tokenAddress, 'TokenCreateContract');
    await utils.grantTokenKyc(tokenCreateContract, tokenAddress);
    await utils.associateToken(tokenCreateContract, nftTokenAddress, 'TokenCreateContract');
    await utils.grantTokenKyc(tokenCreateContract, nftTokenAddress);

    await utils.associateToken(tokenTransferContract, tokenAddress, 'TokenTransferContract');
    await utils.grantTokenKyc(tokenTransferContract, tokenAddress);
    await utils.associateToken(tokenTransferContract, nftTokenAddress, 'TokenTransferContract');
    await utils.grantTokenKyc(tokenTransferContract, nftTokenAddress);

    signers = await ethers.getSigners();
  });

  it('should be able to execute transferTokens', async function () {
    const amount = 33;
    const signers = await ethers.getSigners();

    let contractOwnerBalanceBefore = await erc20Contract.balanceOf(tokenAddress, tokenCreateContract.address);
    let wallet1BalanceBefore = await erc20Contract.balanceOf(tokenAddress, signers[0].address);
    await tokenTransferContract.transferTokensPublic(tokenAddress, [tokenCreateContract.address, signers[0].address], [-amount, amount], {gasLimit: 1_000_000});
    let contractOwnerBalanceAfter = await erc20Contract.balanceOf(tokenAddress, tokenCreateContract.address);
    let wallet1BalanceAfter = await erc20Contract.balanceOf(tokenAddress, signers[0].address);

    expect(contractOwnerBalanceAfter).to.equal(contractOwnerBalanceBefore - amount);
    expect(wallet1BalanceAfter).to.equal(wallet1BalanceBefore + amount);
  });

  it('should be able to execute transferNFTs', async function () {
    const signers = await ethers.getSigners();
    const ownerBefore = await erc721Contract.ownerOf(nftTokenAddress, mintedTokenSerialNumber);
    await tokenTransferContract.transferNFTsPublic(nftTokenAddress, [tokenCreateContract.address], [signers[0].address], [mintedTokenSerialNumber], {gasLimit: 1_000_000});
    const ownerAfter = await erc721Contract.ownerOf(nftTokenAddress, mintedTokenSerialNumber);

    expect(ownerBefore).to.equal(tokenCreateContract.address);
    expect(ownerAfter).to.equal(signers[0].address);
  });

  it('should be able to execute transferToken', async function () {
    const amount = 33;
    const signers = await ethers.getSigners();

    let contractOwnerBalanceBefore = parseInt(await erc20Contract.balanceOf(tokenAddress, tokenCreateContract.address));
    let wallet1BalanceBefore = parseInt(await erc20Contract.balanceOf(tokenAddress, signers[0].address));
    await tokenTransferContract.transferTokenPublic(tokenAddress, tokenCreateContract.address, signers[0].address, amount, {gasLimit: 1_000_000});
    let contractOwnerBalanceAfter = await erc20Contract.balanceOf(tokenAddress, tokenCreateContract.address);
    let wallet1BalanceAfter = await erc20Contract.balanceOf(tokenAddress, signers[0].address);

    expect(contractOwnerBalanceAfter).to.equal(contractOwnerBalanceBefore - amount);
    expect(wallet1BalanceAfter).to.equal(wallet1BalanceBefore + amount);
  });

  it('should be able to execute transferNFT', async function () {
    const signers = await ethers.getSigners();
    const ownerBefore = await erc721Contract.ownerOf(nftTokenAddress, mintedTokenSerialNumber);
    const tokenTransferContractNewOwner = tokenTransferContract.connect(signers[0]);
    await tokenTransferContractNewOwner.transferNFTPublic(nftTokenAddress, signers[0].address, tokenCreateContract.address, mintedTokenSerialNumber, {gasLimit: 1_000_000});
    const ownerAfter = await erc721Contract.ownerOf(nftTokenAddress, mintedTokenSerialNumber);

    expect(ownerBefore).to.equal(signers[0].address);
    expect(ownerAfter).to.equal(tokenCreateContract.address);
  });

  it('should be able to execute approve and allowance', async function () {
    const amount = 4;
    const allowanceBeforeTx = await tokenQueryContract.allowancePublic(tokenAddress, tokenCreateContract.address, signers[1].address);
    const allowanceBefore = (await allowanceBeforeTx.wait()).events.filter(e => e.event === 'AllowanceValue')[0].args[0];

    const txApprove = await tokenCreateContract.approvePublic(tokenAddress, signers[1].address, amount, {gasLimit: 1_000_000});
    await txApprove.wait();

    const allowanceAfterTx = await tokenQueryContract.allowancePublic(tokenAddress, tokenCreateContract.address, signers[1].address);
    const allowanceAfter = (await allowanceAfterTx.wait()).events.filter(e => e.event === 'AllowanceValue')[0].args[0];

    expect(allowanceBefore + amount).to.equal(allowanceAfter);
    expect(allowanceAfter).to.equal(amount);
  });

  it("should be able to execute getApproved", async function () {
    const approvedTx = await tokenQueryContract.getApprovedPublic(nftTokenAddress, mintedTokenSerialNumber, {gasLimit: 1_000_000});
    const receipt = await approvedTx.wait();
    const responseCode = receipt.events.filter(e => e.event === 'ResponseCode')[0].args[0];
    const approved = receipt.events.filter(e => e.event === 'ApprovedAddress')[0].args[0];

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(approved).to.equal('0x0000000000000000000000000000000000000000');
  });

  it('should be able to execute approveNFT', async function () {
    const approveNFTTx = await tokenCreateContract.approveNFTPublic(nftTokenAddress, signers[1].address, mintedTokenSerialNumber, {gasLimit: 1_000_000});
    const receiptApproveNFT = await approveNFTTx.wait();
    const responseCoderApproveNFT = receiptApproveNFT.events.filter(e => e.event === 'ResponseCode')[0].args[0];
    expect(responseCoderApproveNFT).to.equal(TX_SUCCESS_CODE);

    const getApprovedTx = await tokenQueryContract.getApprovedPublic(nftTokenAddress, mintedTokenSerialNumber, {gasLimit: 1_000_000});
    const getApprovedReceipt = await getApprovedTx.wait();
    const responseCodeGetApproved = getApprovedReceipt.events.filter(e => e.event === 'ResponseCode')[0].args[0];
    const approvedGetApproved = getApprovedReceipt.events.filter(e => e.event === 'ApprovedAddress')[0].args[0];

    expect(responseCodeGetApproved).to.equal(TX_SUCCESS_CODE);
    expect(approvedGetApproved).to.equal(signers[1].address);
  });

  it("should be able to execute setApprovalForAll and isApprovedForAll", async function () {
    const isApprovedForAllBeforeTx = await tokenQueryContract.isApprovedForAllPublic(nftTokenAddress, tokenCreateContract.address, signers[0].address);
    const isApprovedForAllBeforeReceipt = await isApprovedForAllBeforeTx.wait();
    const isApprovedForAllBefore = isApprovedForAllBeforeReceipt.events.filter(e => e.event === 'Approved')[0].args[0];

    const tx = await tokenCreateContract.setApprovalForAllPublic(nftTokenAddress, signers[0].address, true, {gasLimit: 1_000_000});
    await tx.wait();

    const isApprovedForAllAfterTx = await tokenQueryContract.isApprovedForAllPublic(nftTokenAddress, tokenCreateContract.address, signers[0].address);
    const isApprovedForAllAfterReceipt = await isApprovedForAllAfterTx.wait();
    const isApprovedForAllAfter = isApprovedForAllAfterReceipt.events.filter(e => e.event === 'Approved')[0].args[0];

    expect(isApprovedForAllBefore).to.equal(false);
    expect(isApprovedForAllAfter).to.equal(true);
  });

  it('should be able to execute transferFrom', async function () {
    const amount = 16;
    const txApprove = await tokenCreateContract.approvePublic(tokenAddress, tokenTransferContract.address, amount, {gasLimit: 1_000_000});
    await txApprove.wait();

    const allowanceBeforeTx = await tokenQueryContract.allowancePublic(tokenAddress, tokenCreateContract.address, tokenTransferContract.address);
    const allowanceBefore = (await allowanceBeforeTx.wait()).events.filter(e => e.event === 'AllowanceValue')[0].args[0];

    const txTransferFrom = await tokenTransferContract.transferFromPublic(tokenAddress, tokenCreateContract.address, signers[1].address, amount, {gasLimit: 1_000_000});
    const receiptTransferFrom = await txTransferFrom.wait();
    const responseCode = receiptTransferFrom.events.filter(e => e.event === 'ResponseCode')[0].args[0];

    const allowanceAfterTx = await tokenQueryContract.allowancePublic(tokenAddress, tokenCreateContract.address, tokenTransferContract.address);
    const allowanceAfter = (await allowanceAfterTx.wait()).events.filter(e => e.event === 'AllowanceValue')[0].args[0];

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(allowanceBefore - amount).to.equal(allowanceAfter);
  });

  it('should be able to execute transferFromNFT', async function () {
    const nftSerialNumber = await utils.mintNFT(tokenCreateContract, nftTokenAddress);
    const txApproveNFTTx = await tokenCreateContract.approveNFTPublic(nftTokenAddress, tokenTransferContract.address, nftSerialNumber, {gasLimit: 1_000_000});
    await txApproveNFTTx.wait();

    const ownerBefore = await erc721Contract.ownerOf(nftTokenAddress, nftSerialNumber);
    const txTransferFrom = await tokenTransferContract.transferFromNFTPublic(nftTokenAddress, tokenCreateContract.address, signers[1].address, nftSerialNumber, {gasLimit: 1_000_000});
    const receiptTransferFrom = await txTransferFrom.wait();
    const responseCode = receiptTransferFrom.events.filter(e => e.event === 'ResponseCode')[0].args[0];
    const ownerAfter = await erc721Contract.ownerOf(nftTokenAddress, nftSerialNumber);

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(ownerBefore).to.equal(tokenCreateContract.address);
    expect(ownerAfter).to.equal(signers[1].address);
  });

  // TODO: make it work
  xit('should be able to execute cryptoTransfer', async function () {
    await tokenTransferContract.transferTokenPublic(tokenAddress, tokenCreateContract.address, signers[0].address, 15, {gasLimit: 1_000_000});

    let contractOwnerBalanceBefore = await erc20Contract.balanceOf(tokenAddress, signers[0].address);
    let wallet1BalanceBefore = await erc20Contract.balanceOf(tokenAddress, signers[1].address);

    console.log('before');
    console.log('contractOwnerBalanceBefore: ' + contractOwnerBalanceBefore);
    console.log('wallet1BalanceBefore: ' + wallet1BalanceBefore);

    let cryptoTransfers = {
      transfers: [
        {
          accountID: signers[0].address,
          amount: -10_000_000_000
        },
        {
          accountID: signers[1].address,
          amount: 10_000_000_000
        }
      ]
    };

    let tokenTransferList = [{
      token: tokenAddress,
      transfers: [
        {
          accountID: signers[1].address,
          amount: 2,
        },
        {
          accountID: signers[0].address,
          amount: -2,
        },
      ],
      nftTransfers: [],
    }];

    const cryptoTransferTx = await tokenTransferContract.cryptoTransferPublic(cryptoTransfers, tokenTransferList, {gasLimit: 5_000_000});
    const cryptoTransferReceipt = await cryptoTransferTx.wait();
    console.log(cryptoTransferReceipt.events);

    let contractOwnerBalanceAfter = await erc20Contract.balanceOf(tokenAddress, signers[0].address);
    let wallet1BalanceAfter = await erc20Contract.balanceOf(tokenAddress, signers[1].address);

    console.log('after');
    console.log('contractOwnerBalanceAfter: ' + contractOwnerBalanceAfter);
    console.log('wallet1BalanceAfter: ' + wallet1BalanceAfter);
  });
});
