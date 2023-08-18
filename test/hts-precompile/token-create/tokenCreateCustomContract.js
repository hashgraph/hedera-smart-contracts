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

const utils = require('../utils')
const { expect } = require('chai')
const { ethers } = require('hardhat')
const Constants = require('../../constants')
const { expectValidHash } = require('../assertions')

describe('TokenCreateCustomContract Test Suite', () => {
  const tokenName = 'WrappedHbar'
  const tokenSymbol = 'WHBAR'
  const tokenMemo = 'Wrapped Hbar'
  const initialSupply = 900000000 // 9 WHBAR
  const maxSupply = 30000000000 // 300 WHBAR
  const decimals = 8
  const freezeDefaultStatus = false
  let keys, signers, fixedFeeTokenAddress, tokenCreateCustomContract

  before(async () => {
    tokenCreateCustomContract = await utils.deployTokenCreateCustomContract()
    keys = utils.prepareTokenKeysArray(tokenCreateCustomContract.address)
    signers = await ethers.getSigners()

    fixedFeeTokenAddress = await utils.createFungibleTokenPublic(
      tokenName,
      tokenSymbol,
      tokenMemo,
      initialSupply,
      maxSupply,
      decimals,
      freezeDefaultStatus,
      tokenCreateCustomContract.address,
      keys,
      tokenCreateCustomContract
    )
  })

  it('should be able to create fungible token with dynamic params and empty keys array', async () => {
    // @notice: Only the ID of the smart contract is valid for the treasury by default.
    //          Any account other than the smart contract ID must first sign an AccountUpdate transaction
    //          before being eligible to be elected as the token's treasury account.
    //          For a practical example, refer to `utils.updateAccountKeysViaHapi()`.
    const tx = await tokenCreateCustomContract.createFungibleTokenPublic(
      tokenName,
      tokenSymbol,
      tokenMemo,
      initialSupply,
      maxSupply,
      decimals,
      freezeDefaultStatus,
      tokenCreateCustomContract.address,
      keys,
      {
        value: '35000000000000000000', // = 35 hbars. The more configs on the token, the higher the value fee for precompile contract is
        gasLimit: 1_000_000,
      }
    )

    const txReceipt = await tx.wait()
    const result = txReceipt.events.filter(
      (e) => e.event === Constants.Events.CreatedToken
    )[0].args[0]
    expect(result).to.exist
    expectValidHash(result, 40)
  })

  it('should be able to execute createFungibleTokenWithCustomFees with dynamic params', async function () {
    const tx =
      await tokenCreateCustomContract.createFungibleTokenWithCustomFeesPublic(
        tokenCreateCustomContract.address,
        fixedFeeTokenAddress,
        tokenName,
        tokenSymbol,
        tokenMemo,
        initialSupply,
        maxSupply,
        decimals,
        keys,
        {
          value: '40000000000000000000',
          gasLimit: 1_000_000,
        }
      )

    const txReceipt = await tx.wait()
    const result = txReceipt.events.filter(
      (e) => e.event === Constants.Events.CreatedToken
    )[0].args[0]
    expect(result).to.exist
    expectValidHash(result, 40)
  })

  it('should be able to execute createNonFungibleToken with dynamic params', async function () {
    const tx = await tokenCreateCustomContract.createNonFungibleTokenPublic(
      tokenName,
      tokenSymbol,
      tokenMemo,
      maxSupply,
      tokenCreateCustomContract.address,
      keys,
      {
        value: '35000000000000000000',
        gasLimit: 1_000_000,
      }
    )

    try {
      const txReceipt = await tx.wait()
      const result = txReceipt.events.filter(
        (e) => e.event === Constants.Events.CreatedToken
      )[0].args[0]
      expect(result).to.exist
      expectValidHash(result, 40)
    } catch (error) {
      console.log(error.transaction.hash)
    }
  })

  it('should be able to execute createNonFungibleTokenWithCustomFees', async function () {
    const tx =
      await tokenCreateCustomContract.createNonFungibleTokenWithCustomFeesPublic(
        tokenCreateCustomContract.address,
        fixedFeeTokenAddress,
        tokenName,
        tokenSymbol,
        tokenMemo,
        maxSupply,
        keys,
        {
          value: '35000000000000000000',
          gasLimit: 1_000_000,
        }
      )

    const txReceipt = await tx.wait()
    const result = txReceipt.events.filter(
      (e) => e.event === Constants.Events.CreatedToken
    )[0].args[0]
    expect(result).to.exist
    expectValidHash(result, 40)
  })

  describe('TokenCreateCustomContract token actions', () => {
    let prepFungibleTokenAddress, prepNonFungibeTokenAddress
    before(async () => {
      prepFungibleTokenAddress = (
        await (
          await tokenCreateCustomContract.createFungibleTokenPublic(
            tokenName,
            tokenSymbol,
            tokenMemo,
            initialSupply,
            maxSupply,
            decimals,
            freezeDefaultStatus,
            tokenCreateCustomContract.address,
            keys,
            {
              value: '35000000000000000000',
              gasLimit: 1_000_000,
            }
          )
        ).wait()
      ).events.filter((e) => e.event === Constants.Events.CreatedToken)[0].args
        .tokenAddress

      prepNonFungibeTokenAddress = (
        await (
          await tokenCreateCustomContract.createNonFungibleTokenPublic(
            tokenName,
            tokenSymbol,
            tokenMemo,
            maxSupply,
            tokenCreateCustomContract.address,
            keys,
            {
              value: '35000000000000000000',
              gasLimit: 1_000_000,
            }
          )
        ).wait()
      ).events.filter((e) => e.event === Constants.Events.CreatedToken)[0]
        .args[0]
    })

    it('should be able to execute mintToken', async function () {
      const amountToMint = 120

      // mint fungible tokens
      const mintFungibleTokenTx =
        await tokenCreateCustomContract.mintTokenPublic(
          prepFungibleTokenAddress,
          amountToMint,
          ['0x02'],
          Constants.GAS_LIMIT_1_000_000
        )

      const mintFungibleTokenReceipt = await mintFungibleTokenTx.wait()
      const { responseCode: mintFungibleTokenResCode } =
        mintFungibleTokenReceipt.events.filter(
          (e) => e.event === Constants.Events.ResponseCode
        )[0].args
      expect(mintFungibleTokenResCode).to.equal(22)

      const { newTotalSupply } = mintFungibleTokenReceipt.events.filter(
        (e) => e.event === Constants.Events.MintedToken
      )[0].args
      expect(newTotalSupply.toNumber()).to.eq(initialSupply + amountToMint)

      // mint NFTs
      const mintNonFungibleTokenTx =
        await tokenCreateCustomContract.mintTokenPublic(
          prepNonFungibeTokenAddress,
          0,
          ['0x02'],
          Constants.GAS_LIMIT_1_000_000
        )

      const mintNonFungibleTokenReceipt = await mintNonFungibleTokenTx.wait()

      const { responseCode } = mintNonFungibleTokenReceipt.events.filter(
        (e) => e.event === Constants.Events.ResponseCode
      )[0].args
      expect(responseCode).to.equal(22)

      const { serialNumbers } = mintNonFungibleTokenReceipt.events.filter(
        (e) => e.event === Constants.Events.MintedToken
      )[0].args
      expect(serialNumbers[0].toNumber()).to.be.greaterThan(0)
    })

    it('should be able to execute mintTokenToAddressPublic', async function () {
      const amountToMint = 120

      const tx = await tokenCreateCustomContract.mintTokenToAddressPublic(
        prepFungibleTokenAddress,
        signers[1].address,
        amountToMint,
        ['0x02'],
        Constants.GAS_LIMIT_1_000_000
      )

      const receipt = await tx.wait()

      const { responseCode } = receipt.events.filter(
        (e) => e.event === Constants.Events.ResponseCode
      )[0].args
      expect(responseCode).to.equal(22)

      const { newTotalSupply } = receipt.events.filter(
        (e) => e.event === Constants.Events.MintedToken
      )[0].args
      expect(newTotalSupply.toNumber()).to.greaterThan(initialSupply)

      const { receiver, amount } = receipt.events.filter(
        (e) => e.event === Constants.Events.TransferToken
      )[0].args
      expect(receiver).to.eq(signers[1].address)
      expect(amount).to.eq(amountToMint)
    })

    it('should be able to execute mintNonFungibleTokenToAddressPublic', async function () {
      const tx =
        await tokenCreateCustomContract.mintNonFungibleTokenToAddressPublic(
          prepNonFungibeTokenAddress,
          signers[1].address,
          0,
          ['0x02'],
          Constants.GAS_LIMIT_1_000_000
        )

      const receipt = await tx.wait()

      const { responseCode } = receipt.events.filter(
        (e) => e.event === Constants.Events.ResponseCode
      )[0].args
      expect(responseCode).to.equal(22)

      const { serialNumbers } = receipt.events.filter(
        (e) => e.event === Constants.Events.MintedToken
      )[0].args
      expect(serialNumbers[0].toNumber()).to.be.greaterThan(0)

      const { receiver, amount } = receipt.events.filter(
        (e) => e.event === Constants.Events.TransferToken
      )[0].args
      expect(receiver).to.eq(signers[1].address)
      expect(amount).to.eq(0)
    })

    it('should be able to execute associateTokensPublic', async function () {
      // @notice the provided associating account must sign an updateAccountKeys transaction first.
      // @notice see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/HederaTokenService.sol#L98
      //         for more information on precompiled HTS.associateTokens()
      await utils.updateAccountKeysViaHapi([tokenCreateCustomContract.address])

      const tx = await tokenCreateCustomContract.associateTokensPublic(
        signers[0].address,
        [prepFungibleTokenAddress, prepNonFungibeTokenAddress],
        Constants.GAS_LIMIT_1_000_000
      )

      const receipt = await tx.wait()
      const { responseCode } = receipt.events.filter(
        (e) => e.event === Constants.Events.ResponseCode
      )[0].args
      expect(responseCode).to.equal(22)
    })

    it('should be able to execute associateTokenPublic', async function () {
      // @notice the provided associating account must sign the transaction first.
      // @notice see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/HederaTokenService.sol#L105
      //         for more information on precompiled HTS.associateToken()
      await utils.updateAccountKeysViaHapi([tokenCreateCustomContract.address])

      const tx = await tokenCreateCustomContract.associateTokenPublic(
        signers[1].address, // using a different account to avoid TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT error
        prepFungibleTokenAddress,
        Constants.GAS_LIMIT_1_000_000
      )

      const receipt = await tx.wait()
      const { responseCode } = receipt.events.filter(
        (e) => e.event === Constants.Events.ResponseCode
      )[0].args
      expect(responseCode).to.equal(22)
    })

    it('should be able to execute grantTokenKyc', async function () {
      // @notice: The ID of the smart contract is set as the account receiving KYC for testing purpose.
      //          Any account other than the smart contract ID must first get associated with the token first.
      //
      // @notice  see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/HederaTokenService.sol#L399
      //          for more information on precompiled HTS.associateToken()
      const tx = await tokenCreateCustomContract.grantTokenKycPublic(
        prepFungibleTokenAddress,
        tokenCreateCustomContract.address,
        Constants.GAS_LIMIT_1_000_000
      )

      const receipt = await tx.wait()
      const { responseCode } = receipt.events.filter(
        (e) => e.event === Constants.Events.ResponseCode
      )[0].args
      expect(responseCode).to.equal(22)
    })
  })

  describe('Key params', () => {
    it('should fail when token create has missing signatures in transaction', async () => {
      const wallet0 = new ethers.Wallet(
        hre.config.networks[network.name].accounts[0]
      )
      const callerAddress = await wallet0.getAddress()

      const wallet1 = new ethers.Wallet(
        hre.config.networks[network.name].accounts[1]
      )

      const failedKey = Buffer.from(
        wallet1._signingKey().compressedPublicKey.replace('0x', ''),
        'hex'
      )

      const failedKeys = utils.prepareTokenKeysArray(null, failedKey)

      const tx = await tokenCreateCustomContract.createFungibleTokenPublic(
        tokenName,
        tokenSymbol,
        tokenMemo,
        initialSupply,
        maxSupply,
        decimals,
        freezeDefaultStatus,
        signers[0].address,
        failedKeys,
        {
          value: '35000000000000000000',
          gasLimit: 1_000_000,
        }
      )
      expect(tx.from).to.eq(callerAddress)
      expect(tx.to).to.be.null

      try {
        await tx.wait()
      } catch (error) {
        expect(error).to.exist
        expect(error.reason).to.eq('transaction failed')
      }
    })

    it('should pass when token create has the correct signatures in transaction', async () => {
      await utils.updateAccountKeysViaHapi([tokenCreateCustomContract.address])

      const wallet0 = new ethers.Wallet(
        hre.config.networks[network.name].accounts[0]
      )
      const callerAddress = await wallet0.getAddress()

      const callerPubKey = Buffer.from(
        wallet0._signingKey().compressedPublicKey.replace('0x', ''),
        'hex'
      )

      const keys = utils.prepareTokenKeysArray(null, callerPubKey)

      const tx = await tokenCreateCustomContract.createFungibleTokenPublic(
        tokenName,
        tokenSymbol,
        tokenMemo,
        initialSupply,
        maxSupply,
        decimals,
        freezeDefaultStatus,
        signers[0].address,
        keys,
        {
          value: '35000000000000000000',
          gasLimit: 1_000_000,
        }
      )

      expect(tx.from).to.eq(callerAddress)
      expect(tx.to).to.exist

      const txReceipt = await tx.wait()
      const { tokenAddress } = txReceipt.events[0].args

      expect(tokenAddress).to.exist
      expectValidHash(tokenAddress, 40)
    })

    it('should be able to create token with an array of custom keys', async () => {
      const adminKey = utils.constructIHederaTokenKey(
        'ADMIN',
        'SECP256K1',
        utils.getSignerCompressedPublicKey()
      )

      const pauseKey = utils.constructIHederaTokenKey(
        'PAUSE',
        'CONTRACT_ID',
        tokenCreateCustomContract.address
      )

      const supplyKey = utils.constructIHederaTokenKey(
        'SUPPLY',
        'SECP256K1',
        utils.getSignerCompressedPublicKey()
      )

      const kycKey = utils.constructIHederaTokenKey(
        'KYC',
        'CONTRACT_ID',
        tokenCreateCustomContract.address
      )

      const customKeys = [adminKey, pauseKey, supplyKey, kycKey]

      const tx = await tokenCreateCustomContract.createFungibleTokenPublic(
        tokenName,
        tokenSymbol,
        tokenMemo,
        initialSupply,
        maxSupply,
        decimals,
        freezeDefaultStatus,
        tokenCreateCustomContract.address,
        customKeys,
        {
          value: '20000000000000000000',
          gasLimit: 1_000_000,
        }
      )

      const txReceipt = await tx.wait()
      const result = txReceipt.events.filter(
        (e) => e.event === Constants.Events.CreatedToken
      )[0].args[0]
      expect(result).to.exist
      expectValidHash(result, 40)
    })
  })
})
