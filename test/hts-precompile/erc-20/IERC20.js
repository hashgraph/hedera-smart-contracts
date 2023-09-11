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

const { expect } = require('chai')
const { ethers } = require('hardhat')
const utils = require('../utils')
const Constants = require('../../constants')

describe('IERC20 Test Suite', function () {
  let tokenCreateContract
  let tokenTransferContract
  let tokenAddress
  let IERC20
  let signers
  const TOTAL_SUPPLY = 1000
  const AMOUNT = 33

  before(async function () {
    signers = await ethers.getSigners()
    tokenCreateContract = await utils.deployTokenCreateContract()
    tokenTransferContract = await utils.deployTokenTransferContract()
    await utils.updateAccountKeysViaHapi([
      tokenCreateContract.address,
      tokenTransferContract.address,
    ])
    tokenAddress = await utils.createFungibleToken(
      tokenCreateContract,
      signers[0].address
    )
    await utils.updateTokenKeysViaHapi(tokenAddress, [
      tokenCreateContract.address,
      tokenTransferContract.address,
    ])
    await utils.associateToken(
      tokenCreateContract,
      tokenAddress,
      Constants.Contract.TokenCreateContract
    )
    await utils.grantTokenKyc(tokenCreateContract, tokenAddress)
    IERC20 = await ethers.getContractAt(Constants.Path.ERC20Mock, tokenAddress)
  })

  it('should be able to get token name', async function () {
    const name = await IERC20.name()
    expect(name).to.equal(Constants.TOKEN_NAME)
  })

  it('should be able to get token symbol', async function () {
    const symbol = await IERC20.symbol()
    expect(symbol).to.equal(Constants.TOKEN_SYMBOL)
  })

  it('should be able to get token decimals', async function () {
    const decimals = await IERC20.decimals()
    expect(decimals).to.equal(8)
  })

  it('should be able to get token totalSupply', async function () {
    const totalSupply = await IERC20.totalSupply()
    expect(totalSupply).to.equal(TOTAL_SUPPLY)
  })

  it('should be able to get token balance of any account', async function () {
    const contractOwnerBalance = await IERC20.balanceOf(
      tokenCreateContract.address
    )
    const signer0Balance = await IERC20.balanceOf(signers[0].address)
    const signer1Balance = await IERC20.balanceOf(signers[1].address)

    expect(contractOwnerBalance).to.exist
    expect(contractOwnerBalance.toNumber()).to.eq(0)
    expect(signer0Balance).to.exist
    expect(signer0Balance.toNumber()).to.eq(TOTAL_SUPPLY)
    expect(signer1Balance).to.exist
    expect(signer1Balance.toNumber()).to.eq(0)
  })

  it('should be able to approve another account', async function () {
    const signer1AllowanceBefore = await IERC20.allowance(
      signers[0].address,
      signers[1].address
    )
    await IERC20.approve(signers[1].address, AMOUNT, Constants.GAS_LIMIT_800000)
    const signer1AllowanceAfter = await IERC20.allowance(
      signers[0].address,
      signers[1].address
    )

    expect(signer1AllowanceBefore).to.eq(0)
    expect(signer1AllowanceAfter).to.eq(AMOUNT)
  })

  it('should be able to transfer tokens to another account', async function () {
    const signer0BalanceBefore = await IERC20.balanceOf(signers[0].address)
    const signer1BalanceBefore = await IERC20.balanceOf(signers[1].address)
    await IERC20.transfer(signers[1].address, AMOUNT)

    const signer0BalanceAfter = await pollForNewSignerBalance(IERC20, signers[0].address, signer0BalanceBefore)
    const signer1BalanceAfter = await IERC20.balanceOf(signers[1].address)

    expect(signer0BalanceAfter).to.eq(signer0BalanceBefore - AMOUNT)
    expect(signer1BalanceAfter).to.eq(signer1BalanceBefore + AMOUNT)
  })

  it('should be able to execute transferFrom to another account', async function () {
    const tokenCreateBalanceBefore = await IERC20.balanceOf(
      tokenCreateContract.address
    )
    const signer0BalanceBefore = await IERC20.balanceOf(signers[0].address)
    const signer1BalanceBefore = await IERC20.balanceOf(signers[1].address)

    await IERC20.approve(signers[1].address, AMOUNT, Constants.GAS_LIMIT_800000)
    const IERC20Signer1 = await IERC20.connect(signers[1])
    await IERC20Signer1.transferFrom(
      signers[0].address,
      tokenCreateContract.address,
      AMOUNT,
      Constants.GAS_LIMIT_800000
    )

    const tokenCreateBalanceAfter = await pollForNewBalance(IERC20, tokenCreateContract.address, tokenCreateBalanceBefore)
    const signer0BalanceAfter = await pollForNewSignerBalance(IERC20, signers[0].address, signer0BalanceBefore)
    const signer1BalanceAfter = await IERC20.balanceOf(signers[1].address)

    expect(tokenCreateBalanceAfter).to.eq(tokenCreateBalanceBefore + AMOUNT)
    expect(signer0BalanceAfter).to.eq(signer0BalanceBefore - AMOUNT)
    expect(signer1BalanceAfter).to.eq(signer1BalanceBefore)
  })
})

async function pollForNewSignerBalance(IERC20Contract, signersAddress, signerBefore) {
  const timesToTry = 200;
  let signerAfter, numberOfTries = 0;

  while (numberOfTries < timesToTry) {
    signerAfter = await IERC20Contract.balanceOf(
      signersAddress
    )

    if ((signerAfter) && (signerAfter != signerBefore)) {
      return signerAfter;
    }

    numberOfTries++;
    await delay(3000); // Delay for 3 second before the next attempt
  }

  throw new Error(`erc20Contract.balanceOf failed to get a different value after ${timesToTry} tries`);
}

async function pollForNewBalance(IERC20, contractAddress, tokenCreateBalanceBefore) {
  const timesToTry = 200;
  let balanceAfter, numberOfTries = 0;

  while (numberOfTries < timesToTry) {
    balanceAfter = await await IERC20.balanceOf(
        contractAddress
      )

    if ((balanceAfter) && (balanceAfter != tokenCreateBalanceBefore)) {
      return balanceAfter;
    }

    numberOfTries++;
    await delay(3000); // Delay for 3 second before the next attempt
  }
  throw new Error(`PollForNewBalance failed to change after ${timesToTry} tries`);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
