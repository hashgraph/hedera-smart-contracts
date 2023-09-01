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

describe('TokenTransferContract Test Suite', function () {
  const TX_SUCCESS_CODE = 22

  let tokenCreateContract
  let tokenTransferContract
  let tokenQueryContract
  let erc20Contract
  let erc721Contract
  let tokenAddress
  let nftTokenAddress
  let mintedTokenSerialNumber
  let signers

  before(async function () {
    signers = await ethers.getSigners()
    tokenCreateContract = await utils.deployTokenCreateContract()
    tokenQueryContract = await utils.deployTokenQueryContract()
    tokenTransferContract = await utils.deployTokenTransferContract()
    erc20Contract = await utils.deployERC20Contract()
    erc721Contract = await utils.deployERC721Contract()
    await utils.updateAccountKeysViaHapi([
      tokenCreateContract.address,
      tokenQueryContract.address,
      tokenTransferContract.address,
    ])
    tokenAddress = await utils.createFungibleTokenWithSECP256K1AdminKey(
      tokenCreateContract,
      signers[0].address,
      utils.getSignerCompressedPublicKey()
    )
    await utils.updateTokenKeysViaHapi(tokenAddress, [
      tokenCreateContract.address,
      tokenQueryContract.address,
      tokenTransferContract.address,
    ])
    nftTokenAddress = await utils.createNonFungibleTokenWithSECP256K1AdminKey(
      tokenCreateContract,
      signers[0].address,
      utils.getSignerCompressedPublicKey()
    )
    await utils.updateTokenKeysViaHapi(nftTokenAddress, [
      tokenCreateContract.address,
      tokenQueryContract.address,
      tokenTransferContract.address,
    ])
    mintedTokenSerialNumber = await utils.mintNFT(
      tokenCreateContract,
      nftTokenAddress
    )

    await utils.associateToken(
      tokenCreateContract,
      tokenAddress,
      Constants.Contract.TokenCreateContract
    )
    await utils.grantTokenKyc(tokenCreateContract, tokenAddress)
    await utils.associateToken(
      tokenCreateContract,
      nftTokenAddress,
      Constants.Contract.TokenCreateContract
    )
    await utils.grantTokenKyc(tokenCreateContract, nftTokenAddress)
  })

  it('should NOT be able to use transferFrom on fungible tokens without approval', async function () {
    const amount = 1
    try {
      const txTransfer = await tokenTransferContract.transferFromPublic(
        tokenAddress,
        signers[0].address,
        signers[1].address,
        amount,
        Constants.GAS_LIMIT_1_000_000
      )
      await txTransfer.wait()
      expect.fail()
    } catch (e) {
      expect(e).to.exist
      expect(e.reason).to.eq('transaction failed')
    }
  })

  it('should NOT be able to use transferFrom on NFT tokens without approval', async function () {
    const amount = 1
    try {
      const txTransfer = await tokenTransferContract.transferFromNFTPublic(
        nftTokenAddress,
        signers[0].address,
        signers[1].address,
        mintedTokenSerialNumber,
        Constants.GAS_LIMIT_1_000_000
      )
      await txTransfer.wait()
      expect.fail()
    } catch (e) {
      expect(e).to.exist
      expect(e.reason).to.eq('transaction failed')
    }
  })

  it('should be able to execute transferTokens', async function () {
    const amount = 33
    const signers = await ethers.getSigners()

    let wallet1BalanceBefore = await erc20Contract.balanceOf(
      tokenAddress,
      signers[0].address
    )
    let wallet2BalanceBefore = await erc20Contract.balanceOf(
      tokenAddress,
      signers[1].address
    )
    await tokenTransferContract.transferTokensPublic(
      tokenAddress,
      [signers[0].address, signers[1].address],
      [-amount, amount],
      Constants.GAS_LIMIT_1_000_000
    )

    let wallet1BalanceAfter = await pollForNewERC20Balance(erc20Contract, tokenAddress, signers[0].address, wallet1BalanceBefore)

    let wallet2BalanceAfter = await erc20Contract.balanceOf(
      tokenAddress,
      signers[1].address
    )

    expect(wallet1BalanceAfter).to.equal(wallet1BalanceBefore - amount)
    expect(wallet2BalanceAfter).to.equal(wallet2BalanceBefore + amount)
  })

  it('should be able to execute transferNFTs', async function () {
    const signers = await ethers.getSigners()
    const ownerBefore = await erc721Contract.ownerOf(
      nftTokenAddress,
      mintedTokenSerialNumber
    )
    await tokenTransferContract.transferNFTsPublic(
      nftTokenAddress,
      [signers[0].address],
      [signers[1].address],
      [mintedTokenSerialNumber],
      Constants.GAS_LIMIT_1_000_000
    )

    const ownerAfter = await erc721Contract.ownerOf(
      nftTokenAddress,
      mintedTokenSerialNumber
    )

    expect(ownerBefore).to.equal(signers[0].address)
    expect(ownerAfter).to.equal(signers[1].address)
  })

  it('should be able to execute transferToken', async function () {
    const amount = 33
    const signers = await ethers.getSigners()

    let wallet1BalanceBefore = parseInt(
      await erc20Contract.balanceOf(tokenAddress, signers[0].address)
    )
    let wallet2BalanceBefore = parseInt(
      await erc20Contract.balanceOf(tokenAddress, signers[1].address)
    )
    await tokenTransferContract.transferTokenPublic(
      tokenAddress,
      signers[0].address,
      signers[1].address,
      amount,
      Constants.GAS_LIMIT_1_000_000
    )

    const wallet1BalanceAfter = await pollForNewERC20Balance(erc20Contract, tokenAddress, signers[0].address, wallet1BalanceBefore)
    const wallet2BalanceAfter = await pollForNewERC20Balance(erc20Contract, tokenAddress, signers[1].address, wallet1BalanceBefore)
   
    expect(wallet1BalanceAfter).to.equal(wallet1BalanceBefore - amount)
    expect(wallet2BalanceAfter).to.equal(wallet2BalanceBefore + amount)
  })

  it('should be able to execute transferNFT', async function () {
    const signers = await ethers.getSigners()
    const ownerBefore = await erc721Contract.ownerOf(
      nftTokenAddress,
      mintedTokenSerialNumber
    )
    const tokenTransferContractNewOwner = tokenTransferContract.connect(
      signers[1]
    )
    await tokenTransferContractNewOwner.transferNFTPublic(
      nftTokenAddress,
      signers[1].address,
      signers[0].address,
      mintedTokenSerialNumber,
      Constants.GAS_LIMIT_1_000_000
    )
    const ownerAfter = await erc721Contract.ownerOf(
      nftTokenAddress,
      mintedTokenSerialNumber
    )

    expect(ownerBefore).to.equal(signers[1].address)
    expect(ownerAfter).to.equal(signers[0].address)
  })

  it('should be able to execute getApproved', async function () {
    const approvedTx = await tokenQueryContract.getApprovedPublic(
      nftTokenAddress,
      mintedTokenSerialNumber,
      Constants.GAS_LIMIT_1_000_000
    )
    const receipt = await approvedTx.wait()
    const responseCode = receipt.events.filter(
      (e) => e.event === Constants.Events.ResponseCode
    )[0].args[0]
    const approved = receipt.events.filter(
      (e) => e.event === Constants.Events.ApprovedAddress
    )[0].args[0]

    expect(responseCode).to.equal(TX_SUCCESS_CODE)
    expect(approved).to.equal('0x0000000000000000000000000000000000000000')
  })

  it('should be able to execute cryptoTransfer for hbar transfer only', async function () {
    const cryptoTransfers = {
      transfers: [
        {
          accountID: signers[0].address,
          amount: -10_000,
        },
        {
          accountID: signers[1].address,
          amount: 10_000,
        },
      ],
    }
    const tokenTransferList = []

    const signers0Before = await signers[0].provider.getBalance(
      signers[0].address
    )
    const signers1Before = await signers[0].provider.getBalance(
      signers[1].address
    )
    const cryptoTransferTx = await tokenTransferContract.cryptoTransferPublic(
      cryptoTransfers,
      tokenTransferList,
      Constants.GAS_LIMIT_1_000_000
    )
    const cryptoTransferReceipt = await cryptoTransferTx.wait()
    const responseCode = cryptoTransferReceipt.events.filter(
      (e) => e.event === Constants.Events.ResponseCode
    )[0].args[0]

    const signers0After = await pollForNewSignerBalance(signers[0].provider, signers[0].address, signers0Before)

    const signers1After = await pollForNewSignerBalance(signers[0].provider, signers[1].address, signers0Before)
    expect(responseCode).to.equal(TX_SUCCESS_CODE)
    expect(signers0Before > signers0After).to.equal(true)
    expect(signers1After > signers1Before).to.equal(true)
  })

  it('should be able to execute cryptoTransfer for nft only', async function () {
    const mintedTokenSerialNumber = await utils.mintNFT(
      tokenCreateContract,
      nftTokenAddress
    )
    await tokenTransferContract.transferNFTsPublic(
      nftTokenAddress,
      [tokenCreateContract.address],
      [signers[0].address],
      [mintedTokenSerialNumber],
      Constants.GAS_LIMIT_1_000_000
    )

    const cryptoTransfers = {
      transfers: [],
    }

    let tokenTransferList = [
      {
        token: nftTokenAddress,
        transfers: [],
        nftTransfers: [
          {
            senderAccountID: signers[0].address,
            receiverAccountID: signers[1].address,
            serialNumber: mintedTokenSerialNumber,
          },
        ],
      },
    ]

    const ownerBefore = await erc721Contract.ownerOf(
      nftTokenAddress,
      mintedTokenSerialNumber
    )
    const cryptoTransferTx = await tokenTransferContract.cryptoTransferPublic(
      cryptoTransfers,
      tokenTransferList,
      Constants.GAS_LIMIT_1_000_000
    )
    const cryptoTransferReceipt = await cryptoTransferTx.wait()
    const responseCode = cryptoTransferReceipt.events.filter(
      (e) => e.event === Constants.Events.ResponseCode
    )[0].args[0]

    const ownerAfter = await erc721Contract.ownerOf(
      nftTokenAddress,
      mintedTokenSerialNumber
    )

    expect(responseCode).to.equal(TX_SUCCESS_CODE)
    expect(ownerBefore).to.equal(signers[0].address)
    expect(ownerAfter).to.equal(signers[1].address)
  })

  it('should be able to execute cryptoTransfer with both 3 txs', async function () {
    const amount = 1
    await tokenTransferContract.transferTokenPublic(
      tokenAddress,
      tokenCreateContract.address,
      signers[0].address,
      amount,
      Constants.GAS_LIMIT_1_000_000
    )

    const mintedTokenSerialNumber = await utils.mintNFT(
      tokenCreateContract,
      nftTokenAddress
    )
    await tokenTransferContract.transferNFTsPublic(
      nftTokenAddress,
      [tokenCreateContract.address],
      [signers[0].address],
      [mintedTokenSerialNumber],
      Constants.GAS_LIMIT_1_000_000
    )

    const signers0BeforeHbarBalance = await signers[0].provider.getBalance(
      signers[0].address
    )
    const signers1BeforeHbarBalance = await signers[0].provider.getBalance(
      signers[1].address
    )
    const signers0BeforeTokenBalance = parseInt(
      await erc20Contract.balanceOf(tokenAddress, signers[0].address)
    )
    const signers1BeforeTokenBalance = parseInt(
      await erc20Contract.balanceOf(tokenAddress, signers[1].address)
    )
    const nftOwnerBefore = await erc721Contract.ownerOf(
      nftTokenAddress,
      mintedTokenSerialNumber
    )

    const cryptoTransfers = {
      transfers: [
        {
          accountID: signers[0].address,
          amount: -10_000,
        },
        {
          accountID: signers[1].address,
          amount: 10_000,
        },
      ],
    }

    let tokenTransferList = [
      {
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
      },
      {
        token: nftTokenAddress,
        transfers: [],
        nftTransfers: [
          {
            senderAccountID: signers[0].address,
            receiverAccountID: signers[1].address,
            serialNumber: mintedTokenSerialNumber,
          },
        ],
      },
    ]
    //execute, verify balances, check the owner of the nft,
    const cryptoTransferTx = await tokenTransferContract.cryptoTransferPublic(
      cryptoTransfers,
      tokenTransferList,
      Constants.GAS_LIMIT_1_000_000
    )
    const cryptoTransferReceipt = await cryptoTransferTx.wait()
    const responseCode = cryptoTransferReceipt.events.filter(
      (e) => e.event === Constants.Events.ResponseCode
    )[0].args[0]
    await new Promise((r) => setTimeout(r, 2000))

    const signers0AfterHbarBalance = await signers[0].provider.getBalance(
      signers[0].address
    )
    const signers1AfterHbarBalance = await signers[0].provider.getBalance(
      signers[1].address
    )
    const signers0AfterTokenBalance = await erc20Contract.balanceOf(
      tokenAddress,
      signers[0].address
    )
    const signers1AfterTokenBalance = await erc20Contract.balanceOf(
      tokenAddress,
      signers[1].address
    )
    const nftOwnerAfter = await erc721Contract.ownerOf(
      nftTokenAddress,
      mintedTokenSerialNumber
    )

    expect(responseCode).to.equal(TX_SUCCESS_CODE)
    expect(signers0BeforeHbarBalance > signers0AfterHbarBalance).to.equal(true)
    expect(signers1AfterHbarBalance > signers1BeforeHbarBalance).to.equal(true)
    expect(signers0BeforeTokenBalance - amount).to.equal(
      signers0AfterTokenBalance
    )
    expect(signers1BeforeTokenBalance + amount).to.equal(
      signers1AfterTokenBalance
    )
    expect(nftOwnerBefore).to.equal(signers[0].address)
    expect(nftOwnerAfter).to.equal(signers[1].address)
  })
})

// Transaction needs to be propagated to the mirror node
async function pollForNewERC20Balance(erc20Contract, tokenAddress, signersAddress, balanceBefore) {
  const timesToTry = 200;
  let balanceAfter, numberOfTries = 0;

  while (numberOfTries < timesToTry) {
    balanceAfter = await erc20Contract.balanceOf(tokenAddress, signersAddress);

    if (!balanceAfter.eq(balanceBefore)) {
      return balanceAfter;
    }

    numberOfTries++;
    await delay(1000); // Delay for 1 second before the next attempt
  }

  throw new Error(`erc20Contract.balanceOf failed to get a different value after ${timesToTry} tries`);
}

async function pollForNewSignerBalance(provider, signersAddress, signerBefore) {
  const timesToTry = 200;
  let signerAfter, numberOfTries = 0;

  while (numberOfTries < timesToTry) {
    signerAfter = await provider.getBalance(
      signersAddress
    )

    if (signerAfter != signerBefore) {
      return signerAfter;
    }

    numberOfTries++;
    await delay(2000); // Delay for 2 seconds before the next attempt
  }

  throw new Error(`erc20Contract.balanceOf failed to get a different value after ${timesToTry} tries`);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}