// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const hre = require('hardhat');
const Utils = require("../system-contracts/hedera-token-service/utils");
const { Hbar, TransferTransaction, PrivateKey } = require('@hashgraph/sdk');
const { ethers } = hre;

const ONE_HBAR = 1n * 100_000_000n;
const WEIBAR_COEF = 10_000_000_000n;
const ONE_HBAR_AS_WEIBAR = ONE_HBAR * WEIBAR_COEF;

describe.only('WHBAR', function() {
  let signers;
  let contract;

  before(async function() {
    signers = await ethers.getSigners();
  });

  it('should deploy the WHBAR contract', async function() {
    const contractFactory = await ethers.getContractFactory('WHBAR');
    contract = await contractFactory.deploy();
    console.log(`WHBAR address: ${contract.target}`);

    await contract.waitForDeployment();
    expect(contract).to.not.be.undefined;
  });

  it('should get name', async function() {
    expect(await contract.name()).to.equal('Wrapped HBAR');
  });

  it('should get symbol', async function() {
    expect(await contract.symbol()).to.equal('WHBAR');
  });

  it('should get decimals', async function() {
    expect(await contract.decimals()).to.equal(8);
  });

  it('should not update total supply after CryptoTransfer tx', async function() {
    // initial values for contract's total supply and balance
    const totalSupplyBefore = await contract.totalSupply();
    const balanceBefore = await signers[0].provider.getBalance(contract.target);

    // build a client for fetching signer's id and contract's id dynamically
    const client = await Utils.createSDKClient();
    const signerId = await Utils.getAccountId(signers[0].address, client);
    const contractId = await Utils.getAccountId(contract.target, client);
    client.setOperator(signerId, PrivateKey.fromStringECDSA((await Utils.getHardhatSignersPrivateKeys(false))[0]));

    // send 1 hbar to the contract via CryptoTransfer
    const tx = new TransferTransaction()
        .addHbarTransfer(signerId, Hbar.fromTinybars(Number(ONE_HBAR)).negated())
        .addHbarTransfer(contractId, Hbar.fromTinybars(Number(ONE_HBAR)));
    const txResponse = await tx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    if (receipt.status._code !== 22) {
      throw new Error(`Funding tx with id ${txResponse.transactionId.toString()} failed.`);
    }

    // wait for the mirror node data population
    await new Promise(r => setTimeout(r, 3000));

    // get updated contract's total supply and balance
    const totalSupplyAfter = await contract.totalSupply();
    const balanceAfter = await signers[0].provider.getBalance(contract.target);

    // checks
    expect(totalSupplyBefore).to.equal(totalSupplyAfter);
    expect(balanceBefore + ONE_HBAR_AS_WEIBAR).to.equal(balanceAfter);
  });

  it('should deposit 1 hbar and check totalSupply', async function() {

    const hbarBalanceBefore = await ethers.provider.getBalance(signers[0].address);
    const whbarBalanceBefore = await contract.balanceOf(signers[0].address);
    const totalSupplyBefore = await contract.totalSupply();

    const txDeposit = await contract.deposit({
      value: ONE_HBAR_AS_WEIBAR
    });
    await txDeposit.wait();

    const hbarBalanceAfter = await ethers.provider.getBalance(signers[0].address);
    const whbarBalanceAfter = await contract.balanceOf(signers[0].address);
    const totalSupplyAfter = await contract.totalSupply();

    expect(hbarBalanceBefore - hbarBalanceAfter).to.be.greaterThanOrEqual(ONE_HBAR_AS_WEIBAR);
    expect(whbarBalanceAfter - whbarBalanceBefore).to.equal(ONE_HBAR);
    expect(totalSupplyBefore + ONE_HBAR).to.equal(totalSupplyAfter);
  });

  it('should withdraw 1 hbar and check totalSupply', async function() {
    const txDeposit = await contract.deposit({
      value: ONE_HBAR_AS_WEIBAR
    });
    await txDeposit.wait();

    const hbarBalanceBefore = await ethers.provider.getBalance(signers[0].address);
    const whbarBalanceBefore = await contract.balanceOf(signers[0].address);
    const totalSupplyBefore = await contract.totalSupply();

    const txWithdraw = await contract.withdraw(ONE_HBAR);
    await txWithdraw.wait();

    const hbarBalanceAfter = await ethers.provider.getBalance(signers[0].address);
    const whbarBalanceAfter = await contract.balanceOf(signers[0].address);
    const totalSupplyAfter = await contract.totalSupply();

    expect(hbarBalanceBefore - hbarBalanceAfter).to.be.lessThanOrEqual(ONE_HBAR_AS_WEIBAR);
    expect(whbarBalanceBefore - ONE_HBAR).to.equal(whbarBalanceAfter);
    expect(totalSupplyBefore - ONE_HBAR).to.equal(totalSupplyAfter);
  });

  it('should be able to transfer', async function() {
    const receiver = (ethers.Wallet.createRandom()).address;
    const receiverBalanceBefore = await contract.balanceOf(receiver);

    const txDeposit = await contract.deposit({
      value: ONE_HBAR_AS_WEIBAR
    });
    await txDeposit.wait();

    const txTransfer = await contract.transfer(receiver, ONE_HBAR);
    await txTransfer.wait();

    const receiverBalanceAfter = await contract.balanceOf(receiver);
    expect(receiverBalanceBefore).to.equal(0);
    expect(receiverBalanceAfter).to.equal(ONE_HBAR);
  });

  it('should be able to transferFrom', async function() {
    const amount = 1;

    // create a random receiver
    const receiverAddress = (ethers.Wallet.createRandom()).address;

    // create a new random signer
    const newSigner = ethers.Wallet.createRandom().connect(signers[0].provider);

    // add some balance for gas covering
    await (await signers[0].sendTransaction({
      to: newSigner.address,
      value: ONE_HBAR_AS_WEIBAR
    })).wait();

    // deposit 1 hbar with signer[0]
    await (await contract.deposit({
      value: ONE_HBAR_AS_WEIBAR
    })).wait();

    // approve the newSigner from signer[0]
    await (await contract.approve(newSigner.address, amount)).wait();

    // save the balances before
    const allowanceBefore = await contract.allowance(signers[0].address, newSigner.address);
    const receiverBalanceBefore = await contract.balanceOf(receiverAddress);

    // execute transferFrom with newSigner using signers[0] approval
    const contractWithNewSigner = await contract.connect(newSigner);
    await (await contractWithNewSigner.transferFrom(signers[0].address, receiverAddress, amount)).wait();

    // save the balances after
    const allowanceAfter = await contract.allowance(signers[0].address, newSigner.address);
    const receiverBalanceAfter = await contract.balanceOf(receiverAddress);

    expect(allowanceBefore).to.equal(amount);
    expect(allowanceAfter).to.equal(0);
    expect(receiverBalanceBefore).to.equal(0);
    expect(receiverBalanceAfter).to.equal(amount);
  });

  it('should be able to approve', async function() {
    const receiverAddress = (ethers.Wallet.createRandom()).address;
    const amount = 5644;

    const txApprove = await contract.approve(receiverAddress, amount);
    await txApprove.wait();

    expect(await contract.allowance(signers[0].address, receiverAddress)).to.equal(amount);
  });

  it('should be able to deposit via contract`s fallback method', async function () {
    const whbarSigner0Before = await contract.balanceOf(signers[0].address);

    const txFallback = await signers[0].sendTransaction({
      to: contract.target,
      data: '0x5644aa', // non-existing contract's function, will call fallback()
      value: ONE_HBAR_AS_WEIBAR
    });
    await txFallback.wait();

    const whbarSigner0After = await contract.balanceOf(signers[0].address);
    expect(whbarSigner0After - whbarSigner0Before).to.equal(ONE_HBAR);
  });

  it('should be able to deposit via contract`s receive method', async function () {
    const whbarSigner0Before = await contract.balanceOf(signers[0].address);

    const txReceive = await signers[0].sendTransaction({
      to: contract.target,
      value: ONE_HBAR_AS_WEIBAR // missing data but passing value, will call receive()
    });
    await txReceive.wait();

    const whbarSigner0After = await contract.balanceOf(signers[0].address);
    expect(whbarSigner0After - whbarSigner0Before).to.equal(ONE_HBAR);
  });

  it('should throw InsufficientFunds error on withdraw', async function() {
    await expect(contract.withdraw(BigInt(100) * ONE_HBAR))
        .to.be.revertedWithCustomError(contract, `InsufficientFunds`);
  });

  it('should throw InsufficientAllowance error on withdraw', async function () {
    const amount = 1;
    const receiverAddress = (ethers.Wallet.createRandom()).address;
    const newSigner = ethers.Wallet.createRandom().connect(signers[0].provider);

    // add some balance for gas covering
    await (await signers[0].sendTransaction({
      to: newSigner.address,
      value: ONE_HBAR_AS_WEIBAR
    })).wait();

    // deposit 1 hbar with signer[0]
    await (await contract.deposit({
      value: ONE_HBAR_AS_WEIBAR
    })).wait();

    const contractWithNewSigner = await contract.connect(newSigner);
    await expect(contractWithNewSigner.transferFrom(signers[0].address, receiverAddress, amount))
        .to.be.revertedWithCustomError(contractWithNewSigner, `InsufficientAllowance`);
  });

  it('should throw SendFailed error on withdrawal from a contract with no receive/fallback method', async() => {
    const contractWithoutReceiveFactory = await ethers.getContractFactory('Target');
    const contractWithoutReceive = await contractWithoutReceiveFactory.deploy();
    await contractWithoutReceive.waitForDeployment();

    const receiver = contractWithoutReceive.target;
    const receiverBalanceBefore = await contract.balanceOf(receiver);

    const txDeposit = await contract.deposit({
      value: ONE_HBAR_AS_WEIBAR
    });
    await txDeposit.wait();

    const txTransfer = await contract.transfer(contractWithoutReceive, ONE_HBAR);
    await txTransfer.wait();

    const receiverBalanceAfter = await contract.balanceOf(receiver);
    expect(receiverBalanceBefore).to.equal(0);
    expect(receiverBalanceAfter).to.equal(ONE_HBAR);

    const tryToWithdrawTx = await contractWithoutReceive.tryToWithdraw(contract.target, ONE_HBAR);
    const tryToWithdrawReceipt = await tryToWithdrawTx.wait();

    expect(tryToWithdrawReceipt.logs).to.not.be.empty;
    expect(tryToWithdrawReceipt.logs[0].fragment.name).to.equal('WithdrawResponse');
    // revert with SendFailed()
    expect(tryToWithdrawReceipt.logs[0].args[0]).to.be.false;
    // first 4 bytes of the SendError selector - keccak256("SendFailed()") = 0x81063e51806c3994c498b39c9d9f4124c2e61b7cd154bc84f959aea44d44ce4f
    expect(tryToWithdrawReceipt.logs[0].args[1]).to.equal('0x81063e51');
  });

  it('should not be able to transfer WHBAR to the actual WHBAR contract', async () => {
    const txDeposit = await contract.deposit({
      value: ONE_HBAR_AS_WEIBAR
    });
    await txDeposit.wait();

    await expect(contract.transfer(contract.target, ONE_HBAR))
        .to.be.revertedWithCustomError(contract, `SendFailed`);
  });

  it('should not be able to transferFrom WHBAR to the actual WHBAR contract', async () => {
    const amount = 1;

    // create a new random signer
    const newSigner = ethers.Wallet.createRandom().connect(signers[0].provider);

    // add some balance for gas covering
    await (await signers[0].sendTransaction({
      to: newSigner.address,
      value: ONE_HBAR_AS_WEIBAR
    })).wait();

    // deposit 1 hbar with signer[0]
    await (await contract.deposit({
      value: ONE_HBAR_AS_WEIBAR
    })).wait();

    // approve the newSigner from signer[0]
    await (await contract.approve(newSigner.address, amount)).wait();

    // execute transferFrom with newSigner using signers[0] approval
    const contractWithNewSigner = await contract.connect(newSigner);
    await expect(contractWithNewSigner.transferFrom(signers[0].address, contractWithNewSigner.target, amount))
        .to.be.revertedWithCustomError(contractWithNewSigner, `SendFailed`);
  });
});
