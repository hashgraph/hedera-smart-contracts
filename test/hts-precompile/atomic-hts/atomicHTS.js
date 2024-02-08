/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

const { expect } = require('chai');
const { ethers } = require('hardhat');
const utils = require('../utils');
const Constants = require('../../constants');

describe('AtomicHTS - HIP#551: Batch Transactions Test Suite', () => {
  let signers,
    tokenAddress,
    erc20Contract,
    atomicHTSContract,
    tokenCreateContract,
    tokenTransferContract,
    tokenManagmentContract;
  const ALLOWANCE = 30n;
  const WIPE_AMOUNT = 60n;
  const MINT_AMOUNT = 90n;
  const INITAL_AMOUNT = 1000n;
  const TRANSFER_AMOUNT = 120n;
  const SUCCESS_RESPONSE_CODE = 22n;

  beforeEach(async () => {
    signers = await ethers.getSigners();
    accountA = signers[0].address;
    accountB = signers[1].address;
    tokenCreateContract = await utils.deployTokenCreateContract();
    tokenTransferContract = await utils.deployTokenTransferContract();
    tokenManagmentContract = await utils.deployTokenManagementContract();

    const atomicContractFactory = await ethers.getContractFactory(
      Constants.Contract.AtomicHTS
    );
    atomicHTSContract = await atomicContractFactory.deploy();

    await utils.updateAccountKeysViaHapi([
      await tokenCreateContract.getAddress(),
      await tokenManagmentContract.getAddress(),
      await atomicHTSContract.getAddress(),
      await tokenTransferContract.getAddress(),
    ]);

    // @notice tokenCreateContract.createFungibleTokenPublic() will generate an intial amount of 1000 tokens
    // to the treasury at the smart contract level
    tokenAddress = await utils.createFungibleTokenWithSECP256K1AdminKey(
      tokenCreateContract,
      accountA,
      utils.getSignerCompressedPublicKey()
    );
    await utils.updateTokenKeysViaHapi(tokenAddress, [
      await tokenCreateContract.getAddress(),
      await tokenManagmentContract.getAddress(),
      await atomicHTSContract.getAddress(),
      await tokenTransferContract.getAddress(),
    ]);

    erc20Contract = await utils.deployERC20Contract();
  });

  it('Should execute batchAlpha(): associateToken() -> grantTokenKYC() -> transferToken()', async () => {
    const tx = await atomicHTSContract.batchAlpha(
      tokenAddress,
      accountA,
      accountB,
      TRANSFER_AMOUNT,
      Constants.GAS_LIMIT_10_000_000
    );
    const args = (await tx.wait()).logs.find(
      (e) => e.fragment.name === 'BatchAlpha'
    ).args;

    const afterSenderBalance = await erc20Contract.balanceOf(
      tokenAddress,
      accountA
    );
    const afterReceiverBalance = await erc20Contract.balanceOf(
      tokenAddress,
      accountB
    );

    expect(afterSenderBalance).to.eq(INITAL_AMOUNT - TRANSFER_AMOUNT);
    expect(afterReceiverBalance).to.eq(TRANSFER_AMOUNT);
    expect(args.associateResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
    expect(args.grantKYCResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
    expect(args.transferTokenResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
  });

  it('Should execute batchBeta(): approve() -> associateToken() -> grantTokenKyc() -> transferFrom()', async () => {
    const tx = await atomicHTSContract.batchBeta(
      tokenAddress,
      accountA,
      accountB,
      TRANSFER_AMOUNT,
      ALLOWANCE,
      Constants.GAS_LIMIT_10_000_000
    );

    const args = (await tx.wait()).logs.find(
      (e) => e.fragment?.name === 'BatchBeta'
    ).args;

    const afterSenderBalance = await erc20Contract.balanceOf(
      tokenAddress,
      accountA
    );
    const afterReceiverBalance = await erc20Contract.balanceOf(
      tokenAddress,
      accountB
    );

    expect(afterSenderBalance).to.eq(INITAL_AMOUNT - TRANSFER_AMOUNT);
    expect(afterReceiverBalance).to.eq(ALLOWANCE);
    expect(args.transferTokenResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
    expect(args.approveResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
    expect(args.associateResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
    expect(args.grantKYCResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
    expect(args.transferFromResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
  });

  it('Shoud execute batchCharlie(): unfreezeToken() -> grantTokenKyc() -> transferToken() -> freezeToken()', async () => {
    await utils.associateToken(
      tokenCreateContract,
      tokenAddress,
      Constants.Contract.TokenCreateContract
    );

    await tokenManagmentContract.freezeTokenPublic(
      tokenAddress,
      accountB,
      Constants.GAS_LIMIT_10_000_000
    );

    const charlieTx = await atomicHTSContract.batchCharlie(
      tokenAddress,
      accountA,
      accountB,
      TRANSFER_AMOUNT,
      Constants.GAS_LIMIT_10_000_000
    );

    const args = (await charlieTx.wait()).logs.find(
      (e) => e.fragment?.name === 'BatchCharlie'
    ).args;

    const afterSenderBalance = await erc20Contract.balanceOf(
      tokenAddress,
      accountA
    );
    const afterReceiverBalance = await erc20Contract.balanceOf(
      tokenAddress,
      accountB
    );

    expect(afterSenderBalance).to.eq(INITAL_AMOUNT - TRANSFER_AMOUNT);
    expect(afterReceiverBalance).to.eq(TRANSFER_AMOUNT);
    expect(args.unfreezeTokenResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
    expect(args.grantKYCResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
    expect(args.transferTokenResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
    expect(args.freezeTokenResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
  });

  it('Should execute batchDelta(): wipeTokenAccount() -> mintToken() -> transferToken()', async () => {
    await utils.associateToken(
      tokenCreateContract,
      tokenAddress,
      Constants.Contract.TokenCreateContract
    );
    await utils.grantTokenKyc(tokenCreateContract, tokenAddress);

    // top up accountB with some token fund
    const transferTx = await tokenTransferContract.transferTokenPublic(
      tokenAddress,
      accountA,
      accountB,
      TRANSFER_AMOUNT,
      Constants.GAS_LIMIT_10_000_000
    );
    await transferTx.wait();

    const deltaTx = await atomicHTSContract.batchDelta(
      tokenAddress,
      accountA,
      accountB,
      WIPE_AMOUNT,
      MINT_AMOUNT,
      TRANSFER_AMOUNT,
      Constants.GAS_LIMIT_10_000_000
    );
    const args = (await deltaTx.wait()).logs.find(
      (e) => e.fragment?.name === 'BatchDelta'
    ).args;

    const accountAbalance = await erc20Contract.balanceOf(
      tokenAddress,
      accountA
    );

    const accountBBalance = await erc20Contract.balanceOf(
      tokenAddress,
      accountB
    );

    /**
     * @logic accountA initially has INITIAL_AMOUNT token. It then transfers TRANSFER_AMOUNT token to accountB.
     *        During the batchDelta() transaction, accountA's balance increased with MINT_AMOUNT token after the mint transaction.
     *        Finally, accountA's reduced TRANSFER_AMOUNT token after the transfer transaction against accountB
     */
    expect(accountAbalance).to.eq(
      INITAL_AMOUNT - TRANSFER_AMOUNT + MINT_AMOUNT - TRANSFER_AMOUNT
    );

    /**
     * @logic accountB intially has 0 token but then got TRANSFER_AMOUNT token after the transfer transaction from accountB.
     *        During batchDelta(), accountB's balance is reduced by WIPE_AMOUNT after the wipe transaction and
     *        eventually gains TRANSFER_AMOUNT after the transfer transaction from accountA
     */
    expect(accountBBalance).to.eq(
      TRANSFER_AMOUNT - WIPE_AMOUNT + TRANSFER_AMOUNT
    );
    expect(args.wipeTokenResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
    expect(args.mintTokenResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
    expect(args.transferTokenResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
  });

  it('Should execute batchEcho(): mintToken() -> unfreezeToken() -> grantTokenKyc() -> transferToken() -> freezeToken()', async () => {
    await utils.associateToken(
      tokenCreateContract,
      tokenAddress,
      Constants.Contract.TokenCreateContract
    );

    await tokenManagmentContract.freezeTokenPublic(
      tokenAddress,
      accountB,
      Constants.GAS_LIMIT_10_000_000
    );

    const echoTx = await atomicHTSContract.batchEcho(
      tokenAddress,
      accountA,
      accountB,
      MINT_AMOUNT,
      TRANSFER_AMOUNT
    );

    const args = (await echoTx.wait()).logs.find(
      (e) => e.fragment?.name === 'BatchEcho'
    ).args;

    const accountAbalance = await erc20Contract.balanceOf(
      tokenAddress,
      accountA
    );

    const accountBBalance = await erc20Contract.balanceOf(
      tokenAddress,
      accountB
    );

    expect(accountAbalance).to.eq(
      INITAL_AMOUNT + MINT_AMOUNT - TRANSFER_AMOUNT
    );
    expect(accountBBalance).to.eq(TRANSFER_AMOUNT);
    expect(args.mintTokenResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
    expect(args.unfreezeTokenResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
    expect(args.grantKYCResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
    expect(args.freezeTokenResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
  });

  it('Should execute batchFoxtrot(): associateToken() -> mintToken() -> grantTokenKyc() -> transferToken()', async () => {
    const foxTrotTx = await atomicHTSContract.batchFoxtrot(
      tokenAddress,
      accountA,
      accountB,
      MINT_AMOUNT,
      Constants.GAS_LIMIT_10_000_000
    );

    const args = (await foxTrotTx.wait()).logs.find(
      (e) => e.fragment?.name === 'BatchFoxtrot'
    ).args;

    const accountAbalance = await erc20Contract.balanceOf(
      tokenAddress,
      accountA
    );

    const accountBBalance = await erc20Contract.balanceOf(
      tokenAddress,
      accountB
    );

    expect(accountAbalance).to.eq(INITAL_AMOUNT);
    expect(accountBBalance).to.eq(MINT_AMOUNT);
    expect(args.associateResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
    expect(args.mintTokenResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
    expect(args.grantKYCResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
    expect(args.transferTokenResponseCode).to.eq(SUCCESS_RESPONSE_CODE);
  });
});
