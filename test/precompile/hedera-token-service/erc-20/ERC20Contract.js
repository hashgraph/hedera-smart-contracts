/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
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
const Constants = require('../../../constants');

describe('ERC20Contract Test Suite', function () {
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
    await utils.updateAccountKeysViaHapi([
      await tokenCreateContract.getAddress(),
      await tokenTransferContract.getAddress(),
    ]);
    erc20Contract = await utils.deployERC20Contract();
    tokenAddress = await utils.createFungibleToken(
      tokenCreateContract,
      signers[0].address
    );

    await utils.updateTokenKeysViaHapi(tokenAddress, [
      await tokenCreateContract.getAddress(),
      await tokenTransferContract.getAddress(),
    ]);
    await utils.associateToken(
      tokenCreateContract,
      tokenAddress,
      Constants.Contract.TokenCreateContract
    );
    await utils.grantTokenKyc(tokenCreateContract, tokenAddress);
  });

  it('should be able to get token name', async function () {
    const name = await erc20Contract.name(tokenAddress);
    expect(name).to.equal(Constants.TOKEN_NAME);
  });

  it('should be able to get token symbol', async function () {
    const symbol = await erc20Contract.symbol(tokenAddress);
    expect(symbol).to.equal('tokenSymbol');
  });

  it('should be able to get token decimals', async function () {
    const decimals = await erc20Contract.decimals(tokenAddress);
    expect(decimals).to.equal(8);
  });

  it('should be able to get token totalSupply', async function () {
    const totalSupply = await erc20Contract.totalSupply(tokenAddress);
    expect(totalSupply).to.equal(TOTAL_SUPPLY);
  });

  it('should be able to get token balance of any account', async function () {
    const contractOwnerBalance = await erc20Contract.balanceOf(
      tokenAddress,
      await tokenCreateContract.getAddress()
    );
    const wallet1Balance = await erc20Contract.balanceOf(
      tokenAddress,
      signers[0].address
    );
    const wallet2Balance = await erc20Contract.balanceOf(
      tokenAddress,
      signers[1].address
    );

    expect(contractOwnerBalance).to.exist;
    expect(contractOwnerBalance).to.eq(0);
    expect(wallet1Balance).to.exist;
    expect(wallet1Balance).to.eq(TOTAL_SUPPLY);
    expect(wallet2Balance).to.exist;
    expect(wallet2Balance).to.eq(0);
  });

  it('should NOT be able to use transfer', async function () {
    const signers = await ethers.getSigners();
    const amount = 200;

    const contractOwnerBalanceBefore = await erc20Contract.balanceOf(
      tokenAddress,
      await tokenCreateContract.getAddress()
    );
    const wallet1BalanceBefore = await erc20Contract.balanceOf(
      tokenAddress,
      signers[0].address
    );
    const wallet2BalanceBefore = await erc20Contract.balanceOf(
      tokenAddress,
      signers[1].address
    );

    try {
      const tx = await erc20Contract
        .connect(signers[0])
        .transfer(
          tokenAddress,
          signers[1].address,
          amount,
          Constants.GAS_LIMIT_1_000_000
        );
      await tx.wait();
    } catch (e) {
      expect(e).to.exist;
      expect(e.code).to.eq(Constants.CALL_EXCEPTION);
    }

    const contractOwnerBalanceAfter = await erc20Contract.balanceOf(
      tokenAddress,
      await tokenCreateContract.getAddress()
    );
    const wallet1BalanceAfter = await erc20Contract.balanceOf(
      tokenAddress,
      signers[0].address
    );
    const wallet2BalanceAfter = await erc20Contract.balanceOf(
      tokenAddress,
      signers[1].address
    );

    expect(contractOwnerBalanceBefore).to.eq(contractOwnerBalanceAfter);
    expect(wallet1BalanceBefore).to.eq(wallet1BalanceAfter);
    expect(wallet2BalanceBefore).to.eq(wallet2BalanceAfter);
  });

  it('should NOT be able to use delegateTransfer', async function () {
    const signers = await ethers.getSigners();
    const amount = 200;

    const wallet1BalanceBefore = await erc20Contract.balanceOf(
      tokenAddress,
      signers[0].address
    );
    const wallet2BalanceBefore = await erc20Contract.balanceOf(
      tokenAddress,
      signers[1].address
    );

    try {
      const tx = await erc20Contract
        .connect(signers[0])
        .delegateTransfer(
          tokenAddress,
          signers[1].address,
          amount,
          Constants.GAS_LIMIT_1_000_000
        );
      await tx.wait();
    } catch (e) {
      expect(e).to.exist;
      expect(e.code).to.eq(Constants.CALL_EXCEPTION);
    }

    const wallet1BalanceAfter = await erc20Contract.balanceOf(
      tokenAddress,
      signers[0].address
    );
    const wallet2BalanceAfter = await erc20Contract.balanceOf(
      tokenAddress,
      signers[1].address
    );

    expect(wallet1BalanceBefore).to.eq(wallet1BalanceAfter);
    expect(wallet2BalanceBefore).to.eq(wallet2BalanceAfter);
  });

  it('should NOT be able to use approve', async function () {
    const signers = await ethers.getSigners();
    const approvedAmount = 200;

    const allowanceBefore = await erc20Contract.allowance(
      tokenAddress,
      signers[0].address,
      signers[1].address
    );
    expect(allowanceBefore).to.eq(0);

    try {
      const tx = await erc20Contract
        .connect(signers[0])
        .approve(
          tokenAddress,
          signers[1].address,
          approvedAmount,
          Constants.GAS_LIMIT_1_000_000
        );
      await tx.wait();
    } catch (e) {
      expect(e).to.exist;
      expect(e.code).to.eq(Constants.CALL_EXCEPTION);
    }

    const allowanceAfter = await erc20Contract.allowance(
      tokenAddress,
      signers[0].address,
      signers[1].address
    );
    expect(allowanceAfter).to.eq(0);
  });

  it('should NOT be able to use delegateApprove and allowance', async function () {
    const signers = await ethers.getSigners();
    const approvedAmount = 200;

    const allowanceBefore = await erc20Contract.allowance(
      tokenAddress,
      signers[0].address,
      signers[1].address
    );
    expect(allowanceBefore).to.eq(0);

    try {
      const tx = await erc20Contract
        .connect(signers[0])
        .delegateApprove(
          tokenAddress,
          signers[1].address,
          approvedAmount,
          Constants.GAS_LIMIT_1_000_000
        );
      await tx.wait();
    } catch (e) {
      expect(e).to.exist;
      expect(e.code).to.eq(Constants.CALL_EXCEPTION);
    }

    const allowanceAfter = await erc20Contract.allowance(
      tokenAddress,
      signers[0].address,
      signers[1].address
    );
    expect(allowanceAfter).to.eq(allowanceBefore);
  });

  it('should NOT be able to use delegateTransferFrom', async function () {
    const signers = await ethers.getSigners();
    const amount = 50;

    const wallet1BalanceBefore = await erc20Contract.balanceOf(
      tokenAddress,
      signers[0].address
    );
    const wallet2BalanceBefore = await erc20Contract.balanceOf(
      tokenAddress,
      signers[1].address
    );
    const allowanceBefore = await erc20Contract.allowance(
      tokenAddress,
      signers[0].address,
      signers[1].address
    );

    try {
      const tx = await erc20Contract
        .connect(signers[1])
        .delegateTransferFrom(
          tokenAddress,
          signers[0].address,
          signers[1].address,
          amount,
          Constants.GAS_LIMIT_1_000_000
        );
      await tx.wait();
    } catch (e) {
      expect(e).to.exist;
      expect(e.code).to.eq(Constants.CALL_EXCEPTION);
    }

    const wallet1BalanceAfter = await erc20Contract.balanceOf(
      tokenAddress,
      signers[0].address
    );
    const wallet2BalanceAfter = await erc20Contract.balanceOf(
      tokenAddress,
      signers[1].address
    );
    const allowanceAfter = await erc20Contract.allowance(
      tokenAddress,
      signers[0].address,
      signers[1].address
    );

    expect(allowanceAfter).to.eq(allowanceBefore);
    expect(wallet1BalanceBefore).to.eq(wallet1BalanceAfter);
    expect(wallet2BalanceBefore).to.eq(wallet2BalanceAfter);
  });
});
