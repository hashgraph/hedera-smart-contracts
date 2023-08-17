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
const Constants = require('../../constants')
const { expectValidHash } = require('../assertions')
const { ethers } = require('hardhat')

describe('TokenCreateCustomContract Test Suite', () => {
  let signers
  const tokenName = 'WrappedHbar'
  const tokenSymbol = 'WHBAR'
  const tokenMemo = 'Wrapped Hbar'
  const initialSupply = 1500
  const maxSupply = 2000
  const decimals = 8
  const freezeDefaultStatus = false
  const key = utils.getSignerCompressedPublicKey()
  let tokenCreateCustomContract

  before(async () => {
    signers = await ethers.getSigners()
    tokenCreateCustomContract = await utils.deployTokenCreateCustomContract()
    await utils.updateAccountKeysViaHapi([tokenCreateCustomContract.address])
  })

  it('should be able to execute createFungibleTokenPublic with dynamic params', async function () {
    const tx = await tokenCreateCustomContract.createFungibleTokenPublic(
      tokenName,
      tokenSymbol,
      tokenMemo,
      initialSupply,
      maxSupply,
      decimals,
      freezeDefaultStatus,
      signers[0].address,
      key,
      {
        value: '20000000000000000000',
        gasLimit: 1_000_000,
      }
    )

    const txReceipt = await tx.wait()
    const { tokenAddress } = txReceipt.events[0].args

    expect(tokenAddress).to.exist
    expectValidHash(tokenAddress, 40)
  })

  it('should be able to execute createFungibleTokenWithCustomFees with dynamic params', async function () {
    fixedFeeTokenAddress = utils.createFungibleTokenPublic(
      tokenName,
      tokenSymbol,
      tokenMemo,
      initialSupply,
      maxSupply,
      decimals,
      freezeDefaultStatus,
      signers[0].address,
      key,
      tokenCreateCustomContract
    )

    const tx =
      await tokenCreateCustomContract.createFungibleTokenWithCustomFeesPublic(
        signers[0].address,
        fixedFeeTokenAddress,
        tokenName,
        tokenSymbol,
        tokenMemo,
        initialSupply,
        maxSupply,
        decimals,
        key,
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

  it('should be able to execute createNonFungibleToken with dynamic params', async function () {
    const tx = await tokenCreateCustomContract.createNonFungibleTokenPublic(
      tokenName,
      tokenSymbol,
      tokenMemo,
      maxSupply,
      signers[0].address,
      utils.getSignerCompressedPublicKey(),
      {
        value: ethers.BigNumber.from('20000000000000000000'),
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

  it('should be able to execute createNonFungibleTokenWithCustomFees', async function () {
    fixedFeeTokenAddress = utils.createFungibleTokenPublic(
      tokenName,
      tokenSymbol,
      tokenMemo,
      initialSupply,
      maxSupply,
      decimals,
      freezeDefaultStatus,
      signers[0].address,
      key,
      tokenCreateCustomContract
    )

    const tx =
      await tokenCreateCustomContract.createNonFungibleTokenWithCustomFeesPublic(
        signers[0].address,
        fixedFeeTokenAddress,
        tokenName,
        tokenSymbol,
        tokenMemo,
        maxSupply,
        utils.getSignerCompressedPublicKey(),
        {
          value: ethers.BigNumber.from('20000000000000000000'),
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
            signers[0].address,
            utils.getSignerCompressedPublicKey(),
            {
              value: '20000000000000000000',
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
            signers[0].address,
            utils.getSignerCompressedPublicKey(),
            {
              value: ethers.BigNumber.from('20000000000000000000'),
              gasLimit: 1_000_000,
            }
          )
        ).wait()
      ).events.filter((e) => e.event === Constants.Events.CreatedToken)[0]
        .args[0]

      await utils.updateTokenKeysViaHapi(prepFungibleTokenAddress, [
        tokenCreateCustomContract.address,
      ])

      await utils.updateTokenKeysViaHapi(prepNonFungibeTokenAddress, [
        tokenCreateCustomContract.address,
      ])
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
      const randomReceiverAddress = ethers.Wallet.createRandom().address

      const tx = await tokenCreateCustomContract.mintTokenToAddressPublic(
        prepFungibleTokenAddress,
        randomReceiverAddress,
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
      expect(receiver).to.eq(randomReceiverAddress)
      expect(amount).to.eq(amountToMint)
    })

    it('should be able to execute mintNonFungibleTokenToAddressPublic', async function () {
      const randomReceiverAddress = ethers.Wallet.createRandom().address

      const tx =
        await tokenCreateCustomContract.mintNonFungibleTokenToAddressPublic(
          prepNonFungibeTokenAddress,
          randomReceiverAddress,
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
      expect(receiver).to.eq(randomReceiverAddress)
      expect(amount).to.eq(0)
    })

    it('should be able to execute associateTokensPublic', async function () {
      const tx = await tokenCreateCustomContract.associateTokensPublic(
        signers[1].address,
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
      const tokenAddress = (
        await (
          await tokenCreateCustomContract.createFungibleTokenPublic(
            tokenName,
            tokenSymbol,
            tokenMemo,
            initialSupply,
            maxSupply,
            decimals,
            freezeDefaultStatus,
            signers[0].address,
            utils.getSignerCompressedPublicKey(),
            {
              value: '20000000000000000000',
              gasLimit: 1_000_000,
            }
          )
        ).wait()
      ).events.filter((e) => e.event === Constants.Events.CreatedToken)[0].args
        .tokenAddress

      const tx = await tokenCreateCustomContract.associateTokenPublic(
        signers[1].address,
        tokenAddress,
        Constants.GAS_LIMIT_1_000_000
      )

      const receipt = await tx.wait()

      const { responseCode } = receipt.events.filter(
        (e) => e.event === Constants.Events.ResponseCode
      )[0].args
      expect(responseCode).to.equal(22)
    })

    it('should be able to execute grantTokenKyc', async function () {
      const grantKycTx = await tokenCreateCustomContract.grantTokenKycPublic(
        prepFungibleTokenAddress,
        signers[0].address,
        Constants.GAS_LIMIT_1_000_000
      )

      expect(
        (await grantKycTx.wait()).events.filter(
          (e) => e.event === Constants.Events.ResponseCode
        )[0].args.responseCode
      ).to.equal(22)
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

      const tx = await tokenCreateCustomContract.createFungibleTokenPublic(
        tokenName,
        tokenSymbol,
        tokenMemo,
        initialSupply,
        maxSupply,
        decimals,
        freezeDefaultStatus,
        signers[0].address,
        failedKey,
        {
          value: '20000000000000000000',
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

    it("should pass when the key caller's public key is set as key param", async () => {
      const wallet0 = new ethers.Wallet(
        hre.config.networks[network.name].accounts[0]
      )
      const callerAddress = await wallet0.getAddress()

      const callerPubKey = Buffer.from(
        wallet0._signingKey().compressedPublicKey.replace('0x', ''),
        'hex'
      )

      const tx = await tokenCreateCustomContract.createFungibleTokenPublic(
        tokenName,
        tokenSymbol,
        tokenMemo,
        initialSupply,
        maxSupply,
        decimals,
        freezeDefaultStatus,
        signers[0].address,
        callerPubKey,
        {
          value: '20000000000000000000',
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
  })
})
