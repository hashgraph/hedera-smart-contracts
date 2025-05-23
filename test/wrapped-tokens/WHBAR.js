// SPDX-License-Identifier: Apache-2.0

const chai = require('chai');
const { expect } = require('chai');
const hre = require('hardhat');
const Utils = require('../system-contracts/hedera-token-service/utils');
const chaiAsPromised = require('chai-as-promised');
const { Hbar, TransferTransaction, PrivateKey } = require('@hashgraph/sdk');
const { ethers } = hre;
chai.use(chaiAsPromised);

/**
 * How to run solidity coverage?
 * - change the defaultNetwork in hardhat.config.js to hardhat - defaultNetwork: 'hardhat'
 * - change the ONE_HBAR constant to the proper one
 *     - for solidity-coverage use 1_000_000_000_000_000_000n
 *     - for tests again local node use 100_000_000n
 * - run `npx hardhat coverage --sources wrapped-tokens/WHBAR.sol --testfiles test/wrapped-tokens/WHBAR.js`
 */

// Core constants
const ONE_HBAR = 1n * 100_000_000n;
const WEIBAR_COEF = 10_000_000_000n;
const ONE_HBAR_AS_WEIBAR = ONE_HBAR * WEIBAR_COEF;
const ONE_HBAR_TRUNCATED = '100000000';

// Test constants
const TINY_AMOUNT = 1n;
const TWO_HBAR = ONE_HBAR * 2n;
const THREE_HBAR = ONE_HBAR * 3n;
const FIVE_HBAR = ONE_HBAR * 5n;
const HUNDRED_HBAR = ONE_HBAR * 100n;
const SAMPLE_APPROVE_AMOUNT = 5644n;
const SAMPLE_FALLBACK_DATA = '0x5644aa';
const OVERFLOW_VALUE =
  '0x10000000000000000000000000000000000000000000000000000000000000000';

describe('WHBAR', function () {
  let signers;
  let contract;

  before(async function () {
    signers = await ethers.getSigners();
  });

  it('WHBAR-000 should deploy the WHBAR contract', async function () {
    const contractFactory = await ethers.getContractFactory('WHBAR');
    contract = await contractFactory.deploy();

    await contract.waitForDeployment();
    expect(contract).to.not.be.undefined;
  });

  it('WHBAR-001 should get name', async function () {
    expect(await contract.name()).to.equal('Wrapped HBAR');
  });

  it('WHBAR-002 should get symbol', async function () {
    expect(await contract.symbol()).to.equal('WHBAR');
  });

  it('WHBAR-003 should get decimals', async function () {
    expect(await contract.decimals()).to.equal(8);
  });

  it('WHBAR-004 should not update total supply after CryptoTransfer tx', async function () {
    // initial values for contract's total supply and balance
    const totalSupplyBefore = await contract.totalSupply();
    const balanceBefore = await signers[0].provider.getBalance(contract.target);

    // build a client for fetching signer's id and contract's id dynamically
    const client = await Utils.createSDKClient();
    const signerId = await Utils.getAccountId(signers[0].address, client);
    const contractId = await Utils.getAccountId(contract.target, client);
    client.setOperator(
      signerId,
      PrivateKey.fromStringECDSA(
        (await Utils.getHardhatSignersPrivateKeys(false))[0]
      )
    );

    // send 1 hbar to the contract via CryptoTransfer
    const tx = new TransferTransaction()
      .addHbarTransfer(signerId, Hbar.fromTinybars(Number(ONE_HBAR)).negated())
      .addHbarTransfer(contractId, Hbar.fromTinybars(Number(ONE_HBAR)));
    const txResponse = await tx.execute(client);
    const receipt = await txResponse.getReceipt(client);
    if (receipt.status._code !== 22) {
      throw new Error(
        `Funding tx with id ${txResponse.transactionId.toString()} failed.`
      );
    }

    // wait for the mirror node data population
    await new Promise((r) => setTimeout(r, 3000));

    // get updated contract's total supply and balance
    const totalSupplyAfter = await contract.totalSupply();
    const balanceAfter = await signers[0].provider.getBalance(contract.target);

    // checks
    expect(totalSupplyBefore).to.equal(totalSupplyAfter);
    expect(balanceBefore + ONE_HBAR_AS_WEIBAR).to.equal(balanceAfter);
  });

  it('WHBAR-005 should deposit 1 hbar and check totalSupply', async function () {
    const hbarBalanceBefore = await ethers.provider.getBalance(
      signers[0].address
    );
    const whbarBalanceBefore = await contract.balanceOf(signers[0].address);
    const totalSupplyBefore = await contract.totalSupply();

    const txDeposit = await contract.deposit({
      value: ONE_HBAR_AS_WEIBAR,
    });
    const receiptDeposit = await txDeposit.wait();

    // Verify Deposit event was emitted with correct parameters
    const depositEvents = receiptDeposit.logs.filter(
      (log) => log.fragment && log.fragment.name === 'Deposit'
    );
    expect(depositEvents.length).to.equal(1);
    expect(depositEvents[0].args[0]).to.equal(signers[0].address); // dst
    expect(depositEvents[0].args[1]).to.equal(ONE_HBAR_TRUNCATED); // wad

    const hbarBalanceAfter = await ethers.provider.getBalance(
      signers[0].address
    );
    const whbarBalanceAfter = await contract.balanceOf(signers[0].address);
    const totalSupplyAfter = await contract.totalSupply();

    expect(hbarBalanceBefore - hbarBalanceAfter).to.be.greaterThanOrEqual(
      ONE_HBAR_AS_WEIBAR
    );
    expect(whbarBalanceAfter - whbarBalanceBefore).to.equal(ONE_HBAR);
    expect(totalSupplyBefore + ONE_HBAR).to.equal(totalSupplyAfter);
  });

  it('WHBAR-006 should withdraw 1 hbar and check totalSupply', async function () {
    const txDeposit = await contract.deposit({
      value: ONE_HBAR_AS_WEIBAR,
    });
    await txDeposit.wait();

    const hbarBalanceBefore = await ethers.provider.getBalance(
      signers[0].address
    );
    const whbarBalanceBefore = await contract.balanceOf(signers[0].address);
    const totalSupplyBefore = await contract.totalSupply();

    const txWithdraw = await contract.withdraw(ONE_HBAR);
    const receiptWithdraw = await txWithdraw.wait();

    // Verify Withdrawal event was emitted with correct parameters
    const withdrawalEvents = receiptWithdraw.logs.filter(
      (log) => log.fragment && log.fragment.name === 'Withdrawal'
    );
    expect(withdrawalEvents.length).to.equal(1);
    expect(withdrawalEvents[0].args[0]).to.equal(signers[0].address); // src
    expect(withdrawalEvents[0].args[1]).to.equal(ONE_HBAR); // wad

    const hbarBalanceAfter = await ethers.provider.getBalance(
      signers[0].address
    );
    const whbarBalanceAfter = await contract.balanceOf(signers[0].address);
    const totalSupplyAfter = await contract.totalSupply();

    expect(hbarBalanceBefore - hbarBalanceAfter).to.be.lessThanOrEqual(
      ONE_HBAR_AS_WEIBAR
    );
    expect(whbarBalanceBefore - ONE_HBAR).to.equal(whbarBalanceAfter);
    expect(totalSupplyBefore - ONE_HBAR).to.equal(totalSupplyAfter);
  });

  it('WHBAR-007 should be able to transfer', async function () {
    const receiver = ethers.Wallet.createRandom().address;
    const receiverBalanceBefore = await contract.balanceOf(receiver);

    const txDeposit = await contract.deposit({
      value: ONE_HBAR_AS_WEIBAR,
    });
    await txDeposit.wait();

    const txTransfer = await contract.transfer(receiver, ONE_HBAR);
    const receiptTransfer = await txTransfer.wait();

    // Verify Transfer event was emitted with correct parameters
    const transferEvents = receiptTransfer.logs.filter(
      (log) => log.fragment && log.fragment.name === 'Transfer'
    );
    expect(transferEvents.length).to.equal(1);
    expect(transferEvents[0].args[0]).to.equal(signers[0].address); // src
    expect(transferEvents[0].args[1]).to.equal(receiver); // dst
    expect(transferEvents[0].args[2]).to.equal(ONE_HBAR); // wad

    const receiverBalanceAfter = await contract.balanceOf(receiver);
    expect(receiverBalanceBefore).to.equal(0);
    expect(receiverBalanceAfter).to.equal(ONE_HBAR);
  });

  it('WHBAR-008 should be able to transferFrom', async function () {
    const amount = 1;

    // create a random receiver
    const receiverAddress = ethers.Wallet.createRandom().address;

    // create a new random signer
    const newSigner = ethers.Wallet.createRandom().connect(signers[0].provider);

    // add some balance for gas covering
    await (
      await signers[0].sendTransaction({
        to: newSigner.address,
        value: ONE_HBAR_AS_WEIBAR,
      })
    ).wait();

    // deposit 1 hbar with signer[0]
    await (
      await contract.deposit({
        value: ONE_HBAR_AS_WEIBAR,
      })
    ).wait();

    // approve the newSigner from signer[0]
    const txApprove = await contract.approve(newSigner.address, amount);
    const receiptApprove = await txApprove.wait();

    // Verify Approval event was emitted with correct parameters
    const approvalEvents = receiptApprove.logs.filter(
      (log) => log.fragment && log.fragment.name === 'Approval'
    );
    expect(approvalEvents.length).to.equal(1);
    expect(approvalEvents[0].args[0]).to.equal(signers[0].address); // src
    expect(approvalEvents[0].args[1]).to.equal(newSigner.address); // guy
    expect(approvalEvents[0].args[2]).to.equal(amount); // wad

    // save the balances before
    const allowanceBefore = await contract.allowance(
      signers[0].address,
      newSigner.address
    );
    const receiverBalanceBefore = await contract.balanceOf(receiverAddress);

    // execute transferFrom with newSigner using signers[0] approval
    const contractWithNewSigner = await contract.connect(newSigner);
    const txTransferFrom = await contractWithNewSigner.transferFrom(
      signers[0].address,
      receiverAddress,
      amount
    );
    const receiptTransferFrom = await txTransferFrom.wait();

    // Verify Transfer event was emitted with correct parameters
    const transferEvents = receiptTransferFrom.logs.filter(
      (log) => log.fragment && log.fragment.name === 'Transfer'
    );
    expect(transferEvents.length).to.equal(1);
    expect(transferEvents[0].args[0]).to.equal(signers[0].address); // src
    expect(transferEvents[0].args[1]).to.equal(receiverAddress); // dst
    expect(transferEvents[0].args[2]).to.equal(amount); // wad

    // save the balances after
    const allowanceAfter = await contract.allowance(
      signers[0].address,
      newSigner.address
    );
    const receiverBalanceAfter = await contract.balanceOf(receiverAddress);

    expect(allowanceBefore).to.equal(amount);
    expect(allowanceAfter).to.equal(0);
    expect(receiverBalanceBefore).to.equal(0);
    expect(receiverBalanceAfter).to.equal(amount);
  });

  it('WHBAR-009 should be able to approve', async function () {
    const receiverAddress = ethers.Wallet.createRandom().address;
    const amount = SAMPLE_APPROVE_AMOUNT;

    const txApprove = await contract.approve(receiverAddress, amount);
    const receiptApprove = await txApprove.wait();

    // Verify Approval event was emitted with correct parameters
    const approvalEvents = receiptApprove.logs.filter(
      (log) => log.fragment && log.fragment.name === 'Approval'
    );
    expect(approvalEvents.length).to.equal(1);
    expect(approvalEvents[0].args[0]).to.equal(signers[0].address); // src
    expect(approvalEvents[0].args[1]).to.equal(receiverAddress); // guy
    expect(approvalEvents[0].args[2]).to.equal(amount); // wad

    expect(
      await contract.allowance(signers[0].address, receiverAddress)
    ).to.equal(amount);
  });

  it('WHBAR-010 should be able to deposit via contract`s fallback method', async function () {
    const whbarSigner0Before = await contract.balanceOf(signers[0].address);

    const txFallback = await signers[0].sendTransaction({
      to: contract.target,
      data: SAMPLE_FALLBACK_DATA,
      value: ONE_HBAR_AS_WEIBAR,
    });
    const receiptFallback = await txFallback.wait();

    // Get the Deposit event signature
    const depositEventSignature = 'Deposit(address,uint256)';
    const depositTopic = ethers.id(depositEventSignature);

    // Filter logs by the event signature
    const depositEvents = receiptFallback.logs.filter(
      (log) => log.topics[0] === depositTopic
    );

    expect(depositEvents.length).to.equal(1);

    // Decode the event data
    const decodedData = contract.interface.parseLog({
      topics: depositEvents[0].topics,
      data: depositEvents[0].data,
    });

    expect(decodedData.args[0]).to.equal(signers[0].address); // dst
    expect(decodedData.args[1]).to.equal(ONE_HBAR_TRUNCATED); // wad

    const whbarSigner0After = await contract.balanceOf(signers[0].address);
    expect(whbarSigner0After - whbarSigner0Before).to.equal(ONE_HBAR);
  });

  it('WHBAR-011 should be able to deposit via contract`s receive method', async function () {
    const whbarSigner0Before = await contract.balanceOf(signers[0].address);

    const txReceive = await signers[0].sendTransaction({
      to: contract.target,
      value: ONE_HBAR_AS_WEIBAR,
    });
    const receiptReceive = await txReceive.wait();

    // Get the Deposit event signature
    const depositEventSignature = 'Deposit(address,uint256)';
    const depositTopic = ethers.id(depositEventSignature);

    // Filter logs by the event signature
    const depositEvents = receiptReceive.logs.filter(
      (log) => log.topics[0] === depositTopic
    );

    expect(depositEvents.length).to.equal(1);

    // Decode the event data
    const decodedData = contract.interface.parseLog({
      topics: depositEvents[0].topics,
      data: depositEvents[0].data,
    });

    expect(decodedData.args[0]).to.equal(signers[0].address); // dst
    expect(decodedData.args[1]).to.equal(ONE_HBAR_TRUNCATED); // wad

    const whbarSigner0After = await contract.balanceOf(signers[0].address);
    expect(whbarSigner0After - whbarSigner0Before).to.equal(ONE_HBAR);
  });

  it('WHBAR-012 should throw InsufficientFunds error on withdraw', async function () {
    await expect(contract.withdraw(HUNDRED_HBAR)).to.be.revertedWithCustomError(
      contract,
      `InsufficientFunds`
    );
  });

  it('WHBAR-013 should throw InsufficientFunds error on transferFrom', async function () {
    const receiverAddress = ethers.Wallet.createRandom().address;

    await expect(
      contract.transferFrom(signers[1].address, receiverAddress, HUNDRED_HBAR)
    ).to.be.revertedWithCustomError(contract, `InsufficientFunds`);
  });

  it('WHBAR-014 should throw InsufficientAllowance error on withdraw', async function () {
    const amount = 1;
    const receiverAddress = ethers.Wallet.createRandom().address;
    const newSigner = ethers.Wallet.createRandom().connect(signers[0].provider);

    // add some balance for gas covering
    await (
      await signers[0].sendTransaction({
        to: newSigner.address,
        value: ONE_HBAR_AS_WEIBAR,
      })
    ).wait();

    // deposit 1 hbar with signer[0]
    await (
      await contract.deposit({
        value: ONE_HBAR_AS_WEIBAR,
      })
    ).wait();

    const contractWithNewSigner = await contract.connect(newSigner);
    await expect(
      contractWithNewSigner.transferFrom(
        signers[0].address,
        receiverAddress,
        amount
      )
    ).to.be.revertedWithCustomError(
      contractWithNewSigner,
      `InsufficientAllowance`
    );
  });

  it('WHBAR-015 should throw SendFailed error on withdrawal from a contract with no receive/fallback method', async () => {
    const contractWithoutReceiveFactory =
      await ethers.getContractFactory('Target');
    const contractWithoutReceive = await contractWithoutReceiveFactory.deploy();
    await contractWithoutReceive.waitForDeployment();

    const receiver = contractWithoutReceive.target;
    const receiverBalanceBefore = await contract.balanceOf(receiver);

    const txDeposit = await contract.deposit({
      value: ONE_HBAR_AS_WEIBAR,
    });
    await txDeposit.wait();

    const txTransfer = await contract.transfer(
      contractWithoutReceive,
      ONE_HBAR
    );
    await txTransfer.wait();

    const receiverBalanceAfter = await contract.balanceOf(receiver);
    expect(receiverBalanceBefore).to.equal(0);
    expect(receiverBalanceAfter).to.equal(ONE_HBAR);

    const tryToWithdrawTx = await contractWithoutReceive.tryToWithdraw(
      contract.target,
      ONE_HBAR
    );
    const tryToWithdrawReceipt = await tryToWithdrawTx.wait();

    expect(tryToWithdrawReceipt.logs).to.not.be.empty;
    expect(tryToWithdrawReceipt.logs[0].fragment.name).to.equal(
      'WithdrawResponse'
    );
    // revert with SendFailed()
    expect(tryToWithdrawReceipt.logs[0].args[0]).to.be.false;
    // first 4 bytes of the SendError selector - keccak256("SendFailed()") = 0x81063e51806c3994c498b39c9d9f4124c2e61b7cd154bc84f959aea44d44ce4f
    expect(tryToWithdrawReceipt.logs[0].args[1]).to.equal('0x81063e51');
  });

  it('WHBAR-016 should revert on overflow via transfer', async function () {
    const receiver = ethers.Wallet.createRandom().address;
    const MAX_UINT256 = ethers.MaxUint256;

    const txDeposit = await contract.deposit({
      value: ONE_HBAR_AS_WEIBAR,
    });
    await txDeposit.wait();

    await expect(
      contract.transfer(receiver, OVERFLOW_VALUE)
    ).to.be.rejectedWith('value out-of-bounds');

    // Test with MAX_UINT256 which should revert with InsufficientFunds
    await expect(
      contract.transfer(receiver, MAX_UINT256)
    ).to.be.revertedWithCustomError(contract, 'InsufficientFunds');
  });

  it('WHBAR-017 should revert on overflow via approve', async function () {
    const spender = ethers.Wallet.createRandom().address;
    const MAX_UINT256 = ethers.MaxUint256;

    await expect(contract.approve(spender, OVERFLOW_VALUE)).to.be.rejectedWith(
      'value out-of-bounds'
    );

    // Test with MAX_UINT256 which should work (no overflow in approve)
    await expect(contract.approve(spender, MAX_UINT256)).not.to.be.reverted;
  });

  it('WHBAR-018 should revert on negative value for deposit', async function () {
    await expect(contract.deposit({ value: '-1' })).to.be.rejectedWith(
      'unsigned value cannot be negative'
    );
  });

  it('WHBAR-019 should revert on negative value for withdraw', async function () {
    await expect(contract.withdraw('-1')).to.be.rejectedWith(
      'value out-of-bounds'
    );
  });

  it('WHBAR-020 should revert on negative value for approve', async function () {
    const spender = ethers.Wallet.createRandom().address;

    await expect(contract.approve(spender, '-1')).to.be.rejectedWith(
      'value out-of-bounds'
    );
  });

  it('WHBAR-021 should revert on negative value for transfer', async function () {
    const receiver = ethers.Wallet.createRandom().address;

    await expect(contract.transfer(receiver, '-1')).to.be.rejectedWith(
      'value out-of-bounds'
    );
  });

  it('WHBAR-022 should revert on negative value for transferFrom', async function () {
    const sender = signers[0].address;
    const receiver = ethers.Wallet.createRandom().address;

    await expect(
      contract.transferFrom(sender, receiver, '-1')
    ).to.be.rejectedWith('value out-of-bounds');
  });

  it('WHBAR-023 should revert on value > MaxUint256 for deposit', async function () {
    await expect(
      contract.deposit({ value: OVERFLOW_VALUE })
    ).to.be.rejectedWith('fields had validation errors');
  });

  it('WHBAR-024 should revert on value > MaxUint256 for withdraw', async function () {
    await expect(contract.withdraw(OVERFLOW_VALUE)).to.be.rejectedWith(
      'value out-of-bounds'
    );
  });

  it('WHBAR-025 should revert on value > MaxUint256 for transfer', async function () {
    const receiver = ethers.Wallet.createRandom().address;

    await expect(
      contract.transfer(receiver, OVERFLOW_VALUE)
    ).to.be.rejectedWith('value out-of-bounds');
  });

  it('WHBAR-026 should revert on value > MaxUint256 for approve', async function () {
    const spender = ethers.Wallet.createRandom().address;

    await expect(contract.approve(spender, OVERFLOW_VALUE)).to.be.rejectedWith(
      'value out-of-bounds'
    );
  });

  it('WHBAR-027 should revert on value > MaxUint256 for transferFrom', async function () {
    const sender = signers[0].address;
    const receiver = ethers.Wallet.createRandom().address;

    await expect(
      contract.transferFrom(sender, receiver, OVERFLOW_VALUE)
    ).to.be.rejectedWith('value out-of-bounds');
  });

  it('WHBAR-032 Sending small amount of hbar should work and have the same value on WHBAR', async function () {
    const tinyAmount = TINY_AMOUNT;
    const tinyAmountAsWeibar = tinyAmount * WEIBAR_COEF;

    const initialBalance = await contract.balanceOf(signers[0].address);

    // Deposit the tiny amount and check for Deposit event
    const txDeposit = await contract.deposit({
      value: tinyAmountAsWeibar,
    });
    const receiptDeposit = await txDeposit.wait();
    const depositEvents = receiptDeposit.logs.filter(
      (log) => log.fragment && log.fragment.name === 'Deposit'
    );
    expect(depositEvents.length).to.equal(1);
    expect(depositEvents[0].args[0]).to.equal(signers[0].address); // dst
    expect(depositEvents[0].args[1]).to.equal(1); // wad

    // Check that balance increased by exactly the tiny amount
    const finalBalance = await contract.balanceOf(signers[0].address);
    expect(finalBalance - initialBalance).to.equal(tinyAmount);

    // Verify total supply also increased by the same amount
    const totalSupply = await contract.totalSupply();
    expect(totalSupply).to.be.greaterThanOrEqual(tinyAmount);
  });

  it('WHBAR-033 Multiple depositors can withdraw and transfer up to their own values', async function () {
    const depositors = [signers[1], signers[2], signers[3]];
    const depositAmounts = [TWO_HBAR, FIVE_HBAR, THREE_HBAR];

    const initialBalances = [];
    for (let i = 0; i < depositors.length; i++) {
      initialBalances.push(await contract.balanceOf(depositors[i].address));
    }

    for (let i = 0; i < depositors.length; i++) {
      const txDeposit = await contract.connect(depositors[i]).deposit({
        value: depositAmounts[i] * WEIBAR_COEF,
      });
      const receiptDeposit = await txDeposit.wait();

      // Verify Deposit event was emitted with correct parameters
      const depositEvents = receiptDeposit.logs.filter(
        (log) => log.fragment && log.fragment.name === 'Deposit'
      );
      expect(depositEvents.length).to.equal(1);
      expect(depositEvents[0].args[0]).to.equal(depositors[i].address); // dst
      expect(depositEvents[0].args[1]).to.equal(depositAmounts[i]); // wad

      // Verify balance increased by exactly the deposit amount
      const newBalance = await contract.balanceOf(depositors[i].address);
      expect(newBalance - initialBalances[i]).to.equal(depositAmounts[i]);
    }

    // Test that each depositor can transfer their full amount but not more
    for (let i = 0; i < depositors.length; i++) {
      const recipient = signers[4].address;
      const recipientInitialBalance = await contract.balanceOf(recipient);

      // Transfer the full amount
      const txTransfer = await contract
        .connect(depositors[i])
        .transfer(recipient, depositAmounts[i]);
      const receiptTransfer = await txTransfer.wait();

      // Verify Transfer event was emitted with correct parameters
      const transferEvents = receiptTransfer.logs.filter(
        (log) => log.fragment && log.fragment.name === 'Transfer'
      );
      expect(transferEvents.length).to.equal(1);
      expect(transferEvents[0].args[0]).to.equal(depositors[i].address); // src
      expect(transferEvents[0].args[1]).to.equal(recipient); // dst
      expect(transferEvents[0].args[2]).to.equal(depositAmounts[i]); // wad

      // Verify recipient received the full amount
      const recipientFinalBalance = await contract.balanceOf(recipient);
      expect(recipientFinalBalance - recipientInitialBalance).to.equal(
        depositAmounts[i]
      );

      // Verify depositor's balance is now zero (or back to initial)
      const depositorFinalBalance = await contract.balanceOf(
        depositors[i].address
      );
      expect(depositorFinalBalance).to.equal(initialBalances[i]);

      // Attempt to transfer more should fail
      await expect(
        contract.connect(depositors[i]).transfer(recipient, ONE_HBAR)
      ).to.be.revertedWithCustomError(contract, 'InsufficientFunds');
    }

    // Test that signers[4] can withdraw the received funds
    const signers4Balance = await contract.balanceOf(signers[4].address);
    const ethBalanceBefore = await ethers.provider.getBalance(
      signers[4].address
    );

    // Withdraw all received funds
    const txWithdraw = await contract
      .connect(signers[4])
      .withdraw(signers4Balance);
    const receiptWithdraw = await txWithdraw.wait();

    // Verify Withdrawal event was emitted with correct parameters
    const withdrawalEvents = receiptWithdraw.logs.filter(
      (log) => log.fragment && log.fragment.name === 'Withdrawal'
    );
    expect(withdrawalEvents.length).to.equal(1);
    expect(withdrawalEvents[0].args[0]).to.equal(signers[4].address); // src
    expect(withdrawalEvents[0].args[1]).to.equal(signers4Balance); // wad

    // Verify WHBAR balance is now zero
    expect(await contract.balanceOf(signers[4].address)).to.equal(0);

    // Verify ETH balance increased (minus gas costs)
    const ethBalanceAfter = await ethers.provider.getBalance(
      signers[4].address
    );
    expect(ethBalanceAfter).to.be.greaterThan(ethBalanceBefore);
  });

  it('WHBAR-044 Test that I can transfer to myself', async function () {
    const depositAmount = THREE_HBAR;
    const txDeposit = await contract.deposit({
      value: depositAmount * WEIBAR_COEF,
    });
    const receiptDeposit = await txDeposit.wait();

    // Verify Deposit event was emitted
    const depositEvents = receiptDeposit.logs.filter(
      (log) => log.fragment && log.fragment.name === 'Deposit'
    );
    expect(depositEvents.length).to.equal(1);

    const initialBalance = await contract.balanceOf(signers[0].address);

    const txTransfer = await contract.transfer(signers[0].address, ONE_HBAR);
    const receiptTransfer = await txTransfer.wait();

    // Verify Transfer event was emitted with correct parameters
    const transferEvents = receiptTransfer.logs.filter(
      (log) => log.fragment && log.fragment.name === 'Transfer'
    );
    expect(transferEvents.length).to.equal(1);
    expect(transferEvents[0].args[0]).to.equal(signers[0].address); // src
    expect(transferEvents[0].args[1]).to.equal(signers[0].address); // dst
    expect(transferEvents[0].args[2]).to.equal(ONE_HBAR); // wad

    // Balance should remain unchanged
    const finalBalance = await contract.balanceOf(signers[0].address);
    expect(finalBalance).to.equal(initialBalance);
  });

  it('WHBAR-045 Test that sending with 18 decimals precision truncates correctly', async function () {
    // WHBAR has 8 decimals, but HBAR has 18 decimals in its wei representation
    // When converting between them, the last 10 decimal places should be truncated

    // Create two values that differ only in the last 10 decimal places
    // 1.0 HBAR (clean value)
    const cleanAmount = ethers.parseEther('1.0');

    // 1.000000001234567890 HBAR (with extra precision in positions 9-18)
    const preciseAmount = ethers.parseEther('1.000000001234567890');

    const initialBalance = await contract.balanceOf(signers[0].address);

    const txDeposit = await contract.deposit({
      value: preciseAmount,
    });
    const receiptDeposit = await txDeposit.wait();

    const depositEvents = receiptDeposit.logs.filter(
        (log) => log.fragment && log.fragment.name === 'Deposit'
    );
    expect(depositEvents.length).to.equal(1);
    expect(depositEvents[0].args[0]).to.equal(signers[0].address); // dst
    expect(depositEvents[0].args[1]).to.equal(ONE_HBAR_TRUNCATED); // wad - should be truncated to 8 decimals

    const finalBalance = await contract.balanceOf(signers[0].address);
    const balanceIncrease = finalBalance - initialBalance;

    const expectedIncrease = ONE_HBAR_TRUNCATED;

    expect(balanceIncrease).to.equal(expectedIncrease);

    // Verify that we can withdraw the full amount that was recognized
    const txWithdraw = await contract.withdraw(expectedIncrease);
    const receiptWithdraw = await txWithdraw.wait();

    // Verify Withdrawal event was emitted with correct parameters
    const withdrawalEvents = receiptWithdraw.logs.filter(
        (log) => log.fragment && log.fragment.name === 'Withdrawal'
    );
    expect(withdrawalEvents.length).to.equal(1);
    expect(withdrawalEvents[0].args[0]).to.equal(signers[0].address); // src
    expect(withdrawalEvents[0].args[1]).to.equal(expectedIncrease); // wad

    // Balance should be back to initial
    const balanceAfterWithdraw = await contract.balanceOf(signers[0].address);
    expect(balanceAfterWithdraw).to.equal(initialBalance);
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
