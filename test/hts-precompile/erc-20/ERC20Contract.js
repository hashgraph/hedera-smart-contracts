const {expect} = require("chai");
const {ethers} = require("hardhat");
const utils = require('../utils');

describe("ERC20Contract Test Suite", function () {
  let tokenCreateContract;
  let tokenTransferContract;
  let tokenAddress;
  let erc20Contract;
  let signers;
  const TOTAL_SUPPLY = 1000;

  before(async function () {
    signers = await ethers.getSigners();
    tokenCreateContract = await utils.deployTokenCreateContract();
    tokenTransferContract = await utils.deployTokenTransferContract();
    erc20Contract = await utils.deployERC20Contract();
    tokenAddress = await utils.createFungibleToken(tokenCreateContract, signers[0].address);
    await utils.associateToken(tokenCreateContract, tokenAddress, 'TokenCreateContract');
    await utils.grantTokenKyc(tokenCreateContract, tokenAddress);
  });

  it("should be able to get token name", async function () {
    const name = await erc20Contract.name(tokenAddress);
    expect(name).to.equal('tokenName');
  });

  it("should be able to get token symbol", async function () {
    const symbol = await erc20Contract.symbol(tokenAddress);
    expect(symbol).to.equal('tokenSymbol');
  });

  it("should be able to get token decimals", async function () {
    const decimals = await erc20Contract.decimals(tokenAddress);
    expect(decimals).to.equal(8);
  });

  it("should be able to get token totalSupply", async function () {
    const totalSupply = await erc20Contract.totalSupply(tokenAddress);
    expect(totalSupply).to.equal(TOTAL_SUPPLY);
  });

  it("should be able to get token balance of any account", async function () {
    const contractOwnerBalance = await erc20Contract.balanceOf(tokenAddress, tokenCreateContract.address);
    const wallet1Balance = await erc20Contract.balanceOf(tokenAddress, signers[0].address);
    const wallet2Balance = await erc20Contract.balanceOf(tokenAddress, signers[1].address);

    expect(contractOwnerBalance).to.exist;
    expect(contractOwnerBalance.toNumber()).to.eq(0);
    expect(wallet1Balance).to.exist;
    expect(wallet1Balance.toNumber()).to.eq(TOTAL_SUPPLY);
    expect(wallet2Balance).to.exist;
    expect(wallet2Balance.toNumber()).to.eq(0);
  });

  it("should NOT be able to use transfer", async function () {
    const signers = await ethers.getSigners();
    const amount = 200;

    const contractOwnerBalanceBefore = await erc20Contract.balanceOf(tokenAddress, tokenCreateContract.address);
    const wallet1BalanceBefore = await erc20Contract.balanceOf(tokenAddress, signers[0].address);
    const wallet2BalanceBefore = await erc20Contract.balanceOf(tokenAddress, signers[1].address);

    try {
      const tx = await erc20Contract.connect(signers[0]).transfer(tokenAddress, signers[1].address, amount, {gasLimit: 1_000_000});
      await tx.wait();
    }
    catch(e) {
      expect(e).to.exist;
      expect(e.reason).to.eq('transaction failed');
    }

    const contractOwnerBalanceAfter = await erc20Contract.balanceOf(tokenAddress, tokenCreateContract.address);
    const wallet1BalanceAfter = await erc20Contract.balanceOf(tokenAddress, signers[0].address);
    const wallet2BalanceAfter = await erc20Contract.balanceOf(tokenAddress, signers[1].address);

    expect(contractOwnerBalanceBefore.toNumber()).to.eq(contractOwnerBalanceAfter.toNumber());
    expect(wallet1BalanceBefore.toNumber()).to.eq(wallet1BalanceAfter.toNumber());
    expect(wallet2BalanceBefore.toNumber()).to.eq(wallet2BalanceAfter.toNumber());
  });

  it("should NOT be able to use delegateTransfer", async function () {
    const signers = await ethers.getSigners();
    const amount = 200;

    const wallet1BalanceBefore = await erc20Contract.balanceOf(tokenAddress, signers[0].address);
    const wallet2BalanceBefore = await erc20Contract.balanceOf(tokenAddress, signers[1].address);

    try {
      const tx = await erc20Contract.connect(signers[0]).delegateTransfer(tokenAddress, signers[1].address, amount, {gasLimit: 1_000_000});
      await tx.wait();
    } catch (e) {
      expect(e).to.exist;
      expect(e.reason).to.eq('transaction failed');
    }

    const wallet1BalanceAfter = await erc20Contract.balanceOf(tokenAddress, signers[0].address);
    const wallet2BalanceAfter = await erc20Contract.balanceOf(tokenAddress, signers[1].address);

    expect(wallet1BalanceBefore.toNumber()).to.eq(wallet1BalanceAfter.toNumber());
    expect(wallet2BalanceBefore.toNumber()).to.eq(wallet2BalanceAfter.toNumber());
  });

  it("should NOT be able to use approve", async function () {
    const signers = await ethers.getSigners();
    const approvedAmount = 200;

    const allowanceBefore = await erc20Contract.allowance(tokenAddress, signers[0].address, signers[1].address);
    expect(allowanceBefore.toNumber()).to.eq(0);

    try {
      const tx = await erc20Contract.connect(signers[0]).approve(tokenAddress, signers[1].address, approvedAmount, {gasLimit: 1_000_000});
      await tx.wait();
    }
    catch(e) {
      expect(e).to.exist;
      expect(e.reason).to.eq('transaction failed');
    }

    const allowanceAfter = await erc20Contract.allowance(tokenAddress, signers[0].address, signers[1].address);
    expect(allowanceAfter.toNumber()).to.eq(0);

  });

  it("should NOT be able to use delegateApprove and allowance", async function () {
    const signers = await ethers.getSigners();
    const approvedAmount = 200;

    const allowanceBefore = await erc20Contract.allowance(tokenAddress, signers[0].address, signers[1].address);
    expect(allowanceBefore.toNumber()).to.eq(0);

    try {
      const tx = await erc20Contract.connect(signers[0]).delegateApprove(tokenAddress, signers[1].address, approvedAmount, {gasLimit: 1_000_000});
      await tx.wait();
    }
    catch(e) {
      expect(e).to.exist;
      expect(e.reason).to.eq('transaction failed');
    }

    const allowanceAfter = await erc20Contract.allowance(tokenAddress, signers[0].address, signers[1].address);
    expect(allowanceAfter.toNumber()).to.eq(allowanceBefore);
  });

  it("should NOT be able to use delegateTransferFrom", async function () {
    const signers = await ethers.getSigners();
    const amount = 50;

    const wallet1BalanceBefore = await erc20Contract.balanceOf(tokenAddress, signers[0].address);
    const wallet2BalanceBefore = await erc20Contract.balanceOf(tokenAddress, signers[1].address);
    const allowanceBefore = await erc20Contract.allowance(tokenAddress, signers[0].address, signers[1].address);

    try {
      const tx = await erc20Contract.connect(signers[1]).delegateTransferFrom(tokenAddress, signers[0].address, signers[1].address, amount, {gasLimit: 1_000_000});
      const rec = await tx.wait();
    }
    catch(e) {
      expect(e).to.exist;
      expect(e.reason).to.eq('transaction failed');
    }
    
    const wallet1BalanceAfter = await erc20Contract.balanceOf(tokenAddress, signers[0].address);
    const wallet2BalanceAfter = await erc20Contract.balanceOf(tokenAddress, signers[1].address);
    const allowanceAfter = await erc20Contract.allowance(tokenAddress, signers[0].address, signers[1].address);

    expect(allowanceAfter.toNumber()).to.eq(allowanceBefore);
    expect(wallet1BalanceBefore.toNumber()).to.eq(wallet1BalanceAfter.toNumber());
    expect(wallet2BalanceBefore.toNumber()).to.eq(wallet2BalanceAfter.toNumber());
  });
});
