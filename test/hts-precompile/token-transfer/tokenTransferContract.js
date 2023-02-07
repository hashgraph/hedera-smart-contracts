const {expect} = require("chai");
const {ethers} = require("hardhat");
const { expectToFail } = require("../utils");
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
    signers = await ethers.getSigners();
    tokenCreateContract = await utils.deployTokenCreateContract();
    tokenQueryContract = await utils.deployTokenQueryContract();
    tokenTransferContract = await utils.deployTokenTransferContract();
    erc20Contract = await utils.deployERC20Contract();
    erc721Contract = await utils.deployERC721Contract();

    tokenAddress = await utils.createFungibleTokenWithSECP256K1AdminKey(tokenCreateContract, signers[0].address, utils.getSignerCompressedPublicKey());
    nftTokenAddress = await utils.createNonFungibleTokenWithSECP256K1AdminKey(tokenCreateContract, signers[0].address, utils.getSignerCompressedPublicKey());
    mintedTokenSerialNumber = await utils.mintNFTToAddress(tokenCreateContract, nftTokenAddress);

    await utils.associateToken(tokenCreateContract, tokenAddress, 'TokenCreateContract');
    await utils.grantTokenKyc(tokenCreateContract, tokenAddress);
    await utils.associateToken(tokenCreateContract, nftTokenAddress, 'TokenCreateContract');
    await utils.grantTokenKyc(tokenCreateContract, nftTokenAddress);
  });

  it("should NOT be able to use transferFrom on fungible tokens without approval", async function () {
    const amount = 1;
    try {
      const txTransfer = await tokenTransferContract.transferFromPublic(tokenAddress, signers[0].address, signers[1].address, amount, {gasLimit: 1_000_000});
      await txTransfer.wait();
      expect.fail();
    } catch(e) {
      expect(e).to.exist;
      expect(e.reason).to.eq('transaction failed');
    }
  });

  it("should NOT be able to use transferFrom on NFT tokens without approval", async function () {    const amount = 1;
    try {
      const txTransfer = await tokenTransferContract.transferFromNFTPublic(nftTokenAddress, signers[0].address, signers[1].address, mintedTokenSerialNumber, {gasLimit: 1_000_000});
      await txTransfer.wait();
      expect.fail();
    } catch(e) {
      expect(e).to.exist;
      expect(e.reason).to.eq('transaction failed');
    }
  });

  it('should be able to execute transferTokens', async function () {
    const amount = 33;
    const signers = await ethers.getSigners();

    let wallet1BalanceBefore = await erc20Contract.balanceOf(tokenAddress, signers[0].address);
    let wallet2BalanceBefore = await erc20Contract.balanceOf(tokenAddress, signers[1].address);
    await tokenTransferContract.transferTokensPublic(tokenAddress, [signers[0].address, signers[1].address], [-amount, amount], {gasLimit: 1_000_000});
    let wallet1BalanceAfter = await erc20Contract.balanceOf(tokenAddress, signers[0].address);
    let wallet2BalanceAfter = await erc20Contract.balanceOf(tokenAddress, signers[1].address);

    expect(wallet1BalanceAfter).to.equal(wallet1BalanceBefore - amount);
    expect(wallet2BalanceAfter).to.equal(wallet2BalanceBefore + amount);
  });

  it('should be able to execute transferNFTs', async function () {
    const signers = await ethers.getSigners();
    const ownerBefore = await erc721Contract.ownerOf(nftTokenAddress, mintedTokenSerialNumber);
    await tokenTransferContract.transferNFTsPublic(nftTokenAddress, [signers[0].address], [signers[1].address], [mintedTokenSerialNumber], {gasLimit: 1_000_000});
    const ownerAfter = await erc721Contract.ownerOf(nftTokenAddress, mintedTokenSerialNumber);

    expect(ownerBefore).to.equal(signers[0].address);
    expect(ownerAfter).to.equal(signers[1].address);
  });

  it('should be able to execute transferToken', async function () {
    const amount = 33;
    const signers = await ethers.getSigners();

    let wallet1BalanceBefore = parseInt(await erc20Contract.balanceOf(tokenAddress, signers[0].address));
    let wallet2BalanceBefore = parseInt(await erc20Contract.balanceOf(tokenAddress, signers[1].address));
    await tokenTransferContract.transferTokenPublic(tokenAddress, signers[0].address, signers[1].address, amount, {gasLimit: 1_000_000});
    let wallet1BalanceAfter = await erc20Contract.balanceOf(tokenAddress, signers[0].address);
    let wallet2BalanceAfter = await erc20Contract.balanceOf(tokenAddress, signers[1].address);

    expect(wallet1BalanceAfter).to.equal(wallet1BalanceBefore - amount);
    expect(wallet2BalanceAfter).to.equal(wallet2BalanceBefore + amount);
  });

  it('should be able to execute transferNFT', async function () {
    const signers = await ethers.getSigners();
    const ownerBefore = await erc721Contract.ownerOf(nftTokenAddress, mintedTokenSerialNumber);
    const tokenTransferContractNewOwner = tokenTransferContract.connect(signers[1]);
    await tokenTransferContractNewOwner.transferNFTPublic(nftTokenAddress, signers[1].address, signers[0].address, mintedTokenSerialNumber, {gasLimit: 1_000_000});
    const ownerAfter = await erc721Contract.ownerOf(nftTokenAddress, mintedTokenSerialNumber);

    expect(ownerBefore).to.equal(signers[1].address);
    expect(ownerAfter).to.equal(signers[0].address);
  });

  it('should be able to execute approve and allowance', async function () {
    const amount = 4;
    const allowanceBeforeTx = await tokenQueryContract.allowancePublic(tokenAddress, signers[0].address, signers[1].address);
    const allowanceBefore = (await allowanceBeforeTx.wait()).events.filter(e => e.event === 'AllowanceValue')[0].args[0];

    const txApprove = await tokenTransferContract.delegateApprovePublic(tokenAddress, signers[1].address, amount, {gasLimit: 1_000_000});
    await txApprove.wait();

    const allowanceAfterTx = await tokenQueryContract.allowancePublic(tokenAddress, signers[0].address, signers[1].address);
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
    const nftSerialNumber = await utils.mintNFT(tokenCreateContract, nftTokenAddress);
    await tokenTransferContract.transferNFTsPublic(nftTokenAddress, [tokenCreateContract.address], [signers[0].address], [nftSerialNumber], {gasLimit: 1_000_000});

    const approveNFTTx = await tokenTransferContract.delegateApproveNFTPublic(nftTokenAddress, signers[1].address, nftSerialNumber, {gasLimit: 1_000_000});
    const receiptApproveNFT = await approveNFTTx.wait();
    const responseCoderApproveNFT = receiptApproveNFT.events.filter(e => e.event === 'ResponseCode')[0].args[0];
    expect(responseCoderApproveNFT).to.equal(TX_SUCCESS_CODE);

    const getApprovedTx = await tokenQueryContract.getApprovedPublic(nftTokenAddress, nftSerialNumber, {gasLimit: 1_000_000});
    const getApprovedReceipt = await getApprovedTx.wait();
    const responseCodeGetApproved = getApprovedReceipt.events.filter(e => e.event === 'ResponseCode')[0].args[0];
    const approvedGetApproved = getApprovedReceipt.events.filter(e => e.event === 'ApprovedAddress')[0].args[0];

    expect(responseCodeGetApproved).to.equal(TX_SUCCESS_CODE);
    expect(approvedGetApproved).to.equal(signers[1].address);
  });

  it("should be able to execute setApprovalForAll and isApprovedForAll", async function () {
    const isApprovedForAllBeforeTx = await tokenQueryContract.isApprovedForAllPublic(nftTokenAddress, signers[0].address, signers[1].address);
    const isApprovedForAllBeforeReceipt = await isApprovedForAllBeforeTx.wait();
    const isApprovedForAllBefore = isApprovedForAllBeforeReceipt.events.filter(e => e.event === 'Approved')[0].args[0];

    const tx = await tokenTransferContract.delegateSetApprovalForAllPublic(nftTokenAddress, signers[1].address, true, {gasLimit: 1_000_000});
    await tx.wait();

    const isApprovedForAllAfterTx = await tokenQueryContract.isApprovedForAllPublic(nftTokenAddress, signers[0].address, signers[1].address);
    const isApprovedForAllAfterReceipt = await isApprovedForAllAfterTx.wait();
    const isApprovedForAllAfter = isApprovedForAllAfterReceipt.events.filter(e => e.event === 'Approved')[0].args[0];

    expect(isApprovedForAllBefore).to.equal(false);
    expect(isApprovedForAllAfter).to.equal(true);
  });

  it('should be able to execute transferFrom', async function () {
    const amount = 16;
    const txApprove = await tokenTransferContract.delegateApprovePublic(tokenAddress, signers[1].address, amount, {gasLimit: 1_000_000});
    await txApprove.wait();

    const allowanceBeforeTx = await tokenQueryContract.allowancePublic(tokenAddress, signers[0].address, signers[1].address);
    const allowanceBefore = (await allowanceBeforeTx.wait()).events.filter(e => e.event === 'AllowanceValue')[0].args[0];

    const tokenTransferContractOwner = await tokenTransferContract.connect(signers[1]);
    const txTransferFrom = await tokenTransferContractOwner.delegateTransferFrom(tokenAddress, signers[0].address, tokenCreateContract.address, amount, {gasLimit: 1_000_000});
    await txTransferFrom.wait();

    const allowanceAfterTx = await tokenQueryContract.allowancePublic(tokenAddress, signers[0].address, signers[1].address);
    const allowanceAfter = (await allowanceAfterTx.wait()).events.filter(e => e.event === 'AllowanceValue')[0].args[0];

    expect(allowanceBefore - amount).to.equal(allowanceAfter);
  });

  it('should be able to execute transferFromNFT', async function () {
    const nftSerialNumber = await utils.mintNFT(tokenCreateContract, nftTokenAddress);
    await tokenTransferContract.transferNFTsPublic(nftTokenAddress, [tokenCreateContract.address], [signers[0].address], [nftSerialNumber], {gasLimit: 1_000_000});
    const txApproveNFTTx = await tokenTransferContract.delegateApproveNFTPublic(nftTokenAddress, signers[1].address, nftSerialNumber, {gasLimit: 1_000_000});
    await txApproveNFTTx.wait();

    const ownerBefore = await erc721Contract.ownerOf(nftTokenAddress, nftSerialNumber);
    const tokenTransferContractOwner = await tokenTransferContract.connect(signers[1]);
    const txTransferFrom = await tokenTransferContractOwner.delegateTransferFromNFT(nftTokenAddress, signers[0].address, tokenCreateContract.address, nftSerialNumber, {gasLimit: 1_000_000});
    await txTransferFrom.wait();
    const ownerAfter = await erc721Contract.ownerOf(nftTokenAddress, nftSerialNumber);

    expect(ownerBefore).to.equal(signers[0].address);
    expect(ownerAfter).to.equal(tokenCreateContract.address);
  });

  it('should be able to execute cryptoTransfer for hbar transfer only', async function () {
    const cryptoTransfers = {
      transfers: [
        {
          accountID: signers[0].address,
          amount: -10_000
        },
        {
          accountID: signers[1].address,
          amount: 10_000
        }
      ]
    };
    const tokenTransferList = [];

    const signers0Before = await signers[0].provider.getBalance(signers[0].address);
    const signers1Before = await signers[0].provider.getBalance(signers[1].address);
    const cryptoTransferTx = await tokenTransferContract.cryptoTransferPublic(cryptoTransfers, tokenTransferList, {gasLimit: 1_000_000});
    const cryptoTransferReceipt = await cryptoTransferTx.wait();
    const responseCode = cryptoTransferReceipt.events.filter(e => e.event === 'ResponseCode')[0].args[0];

    const signers0After = await signers[0].provider.getBalance(signers[0].address);
    const signers1After = await signers[0].provider.getBalance(signers[1].address);

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(signers0Before > signers0After).to.equal(true);
    expect(signers1After > signers1Before).to.equal(true);
  });

  it('should be able to execute cryptoTransfer for tokens transfer only', async function () {
    const amount = 1;
    // await tokenTransferContract.transferTokenPublic(tokenAddress, tokenCreateContract.address, signers[1].address, amount, {gasLimit: 1_000_000});
    const cryptoTransfers = {
      transfers: []
    };

    let tokenTransferList = [{
      token: tokenAddress,
      transfers: [
        {
          accountID: signers[0].address,
          amount: amount,
        },
        {
          accountID: signers[1].address,
          amount: -amount,
        },
      ],
      nftTransfers: [],
    }];

    const signers0Before = parseInt(await erc20Contract.balanceOf(tokenAddress, signers[0].address));
    const signers1Before = parseInt(await erc20Contract.balanceOf(tokenAddress, signers[1].address));

    const tokenTransferContractOwner = tokenTransferContract.connect(signers[1]);
    const cryptoTransferTx = await tokenTransferContractOwner.delegateCryptoTransferPublic(cryptoTransfers, tokenTransferList, {gasLimit: 1_000_000});
    const cryptoTransferReceipt = await cryptoTransferTx.wait();
    const responseCode = cryptoTransferReceipt.events.filter(e => e.event === 'ResponseCode')[0].args[0];

    const signers0After = await erc20Contract.balanceOf(tokenAddress, signers[0].address);
    const signers1After = await erc20Contract.balanceOf(tokenAddress, signers[1].address);

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(signers0Before + amount).to.equal(signers0After);
    expect(signers1Before - amount).to.equal(signers1After);
  });

  it('should be able to execute cryptoTransfer for nft only', async function () {
    const mintedTokenSerialNumber = await utils.mintNFT(tokenCreateContract, nftTokenAddress);
    await tokenTransferContract.transferNFTsPublic(nftTokenAddress, [tokenCreateContract.address], [signers[0].address], [mintedTokenSerialNumber], {gasLimit: 1_000_000});

    const cryptoTransfers = {
      transfers: []
    };

    let tokenTransferList = [{
      token: nftTokenAddress,
      transfers: [],
      nftTransfers: [{
        senderAccountID: signers[0].address,
        receiverAccountID: signers[1].address,
        serialNumber: mintedTokenSerialNumber
      }],
    }];

    const ownerBefore = await erc721Contract.ownerOf(nftTokenAddress, mintedTokenSerialNumber);
    const cryptoTransferTx = await tokenTransferContract.cryptoTransferPublic(cryptoTransfers, tokenTransferList, {gasLimit: 1_000_000});
    const cryptoTransferReceipt = await cryptoTransferTx.wait();
    const responseCode = cryptoTransferReceipt.events.filter(e => e.event === 'ResponseCode')[0].args[0];

    const ownerAfter = await erc721Contract.ownerOf(nftTokenAddress, mintedTokenSerialNumber);

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(ownerBefore).to.equal(signers[0].address);
    expect(ownerAfter).to.equal(signers[1].address);
  });

  it('should be able to execute cryptoTransfer with both 3 txs', async function () {
    const amount = 1;
    await tokenTransferContract.transferTokenPublic(tokenAddress, tokenCreateContract.address, signers[0].address, amount, {gasLimit: 1_000_000});

    const mintedTokenSerialNumber = await utils.mintNFT(tokenCreateContract, nftTokenAddress);
    await tokenTransferContract.transferNFTsPublic(nftTokenAddress, [tokenCreateContract.address], [signers[0].address], [mintedTokenSerialNumber], {gasLimit: 1_000_000});

    const signers0BeforeHbarBalance = await signers[0].provider.getBalance(signers[0].address);
    const signers1BeforeHbarBalance = await signers[0].provider.getBalance(signers[1].address);
    const signers0BeforeTokenBalance = parseInt(await erc20Contract.balanceOf(tokenAddress, signers[0].address));
    const signers1BeforeTokenBalance = parseInt(await erc20Contract.balanceOf(tokenAddress, signers[1].address));
    const nftOwnerBefore = await erc721Contract.ownerOf(nftTokenAddress, mintedTokenSerialNumber);

    const cryptoTransfers = {
      transfers: [
        {
          accountID: signers[0].address,
          amount: -10_000
        },
        {
          accountID: signers[1].address,
          amount: 10_000
        }
      ]
    };

    let tokenTransferList = [{
      token: tokenAddress,
      transfers: [
        {
          accountID: signers[1].address,
          amount: amount,
        },
        {
          accountID: signers[0].address,
          amount: -amount,
        },
      ],
      nftTransfers: [],
    }, {
      token: nftTokenAddress,
      transfers: [],
      nftTransfers: [{
        senderAccountID: signers[0].address,
        receiverAccountID: signers[1].address,
        serialNumber: mintedTokenSerialNumber
      }],
    }];

    const cryptoTransferTx = await tokenTransferContract.cryptoTransferPublic(cryptoTransfers, tokenTransferList, {gasLimit: 1_000_000});
    const cryptoTransferReceipt = await cryptoTransferTx.wait();
    const responseCode = cryptoTransferReceipt.events.filter(e => e.event === 'ResponseCode')[0].args[0];

    const signers0AfterHbarBalance = await signers[0].provider.getBalance(signers[0].address);
    const signers1AfterHbarBalance = await signers[0].provider.getBalance(signers[1].address);
    const signers0AfterTokenBalance = await erc20Contract.balanceOf(tokenAddress, signers[0].address);
    const signers1AfterTokenBalance = await erc20Contract.balanceOf(tokenAddress, signers[1].address);
    const nftOwnerAfter = await erc721Contract.ownerOf(nftTokenAddress, mintedTokenSerialNumber);

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(signers0BeforeHbarBalance > signers0AfterHbarBalance).to.equal(true);
    expect(signers1AfterHbarBalance > signers1BeforeHbarBalance).to.equal(true);
    expect(signers0BeforeTokenBalance - amount).to.equal(signers0AfterTokenBalance);
    expect(signers1BeforeTokenBalance + amount).to.equal(signers1AfterTokenBalance);
    expect(nftOwnerBefore).to.equal(signers[0].address);
    expect(nftOwnerAfter).to.equal(signers[1].address);
  });

});
