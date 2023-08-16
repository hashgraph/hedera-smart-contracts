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
const { expectValidHash } = require('../assertions')
const Constants = require('../../constants')
const {
  TokenCreateTransaction,
  TransactionId,
  PublicKey,
  TokenSupplyType,
  AccountId,
} = require('@hashgraph/sdk')

describe('TokenCreateContract Test Suite', function () {
  let tokenCreateContract
  let tokenTransferContract
  let tokenManagmentContract
  let tokenQueryContract
  let erc20Contract
  let tokenAddress
  let nftTokenAddress
  let signers

  before(async function () {
    signers = await ethers.getSigners()
    tokenCreateContract = await utils.deployTokenCreateContract()
    tokenTransferContract = await utils.deployTokenTransferContract()
    tokenManagmentContract = await utils.deployTokenManagementContract()
    await utils.updateAccountKeysViaHapi([
      tokenCreateContract.address,
      tokenTransferContract.address,
      tokenManagmentContract.address,
    ])
    erc20Contract = await utils.deployERC20Contract()
    erc721Contract = await utils.deployERC721Contract()
    tokenAddress = await utils.createFungibleTokenWithSECP256K1AdminKey(
      tokenCreateContract,
      signers[0].address,
      utils.getSignerCompressedPublicKey()
    )
    await utils.updateTokenKeysViaHapi(tokenAddress, [
      tokenCreateContract.address,
      tokenTransferContract.address,
      tokenManagmentContract.address,
    ])
    nftTokenAddress = await utils.createNonFungibleTokenWithSECP256K1AdminKey(
      tokenCreateContract,
      signers[0].address,
      utils.getSignerCompressedPublicKey()
    )
    await utils.updateTokenKeysViaHapi(nftTokenAddress, [
      tokenCreateContract.address,
      tokenTransferContract.address,
      tokenManagmentContract.address,
    ])
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
    mintedTokenSerialNumber = await utils.mintNFT(
      tokenCreateContract,
      nftTokenAddress
    )
  })

  it('should be able to execute burnToken', async function () {
    const amount = 111
    const totalSupplyBefore = await erc20Contract.totalSupply(tokenAddress)
    const balanceBefore = await erc20Contract.balanceOf(
      tokenAddress,
      signers[0].address
    )
    await tokenManagmentContract.burnTokenPublic(tokenAddress, amount, [])
    const balanceAfter = await erc20Contract.balanceOf(
      tokenAddress,
      signers[0].address
    )
    const totalSupplyAfter = await erc20Contract.totalSupply(tokenAddress)

    expect(totalSupplyAfter).to.equal(totalSupplyBefore - amount)
    expect(balanceAfter).to.equal(balanceBefore - amount)
  })

  it('should be able to execute dissociateTokens and associateTokens', async function () {
    const tokenCreateContractWallet2 = tokenCreateContract.connect(signers[1])
    const tokenManagmentContractWallet2 = tokenManagmentContract.connect(
      signers[1]
    )

    const txDisassociate =
      await tokenManagmentContractWallet2.dissociateTokensPublic(
        signers[1].address,
        [tokenAddress],
        Constants.GAS_LIMIT_1_000_000
      )
    const receiptDisassociate = await txDisassociate.wait()
    expect(
      receiptDisassociate.events.filter(
        (e) => e.event === Constants.Events.ResponseCode
      )[0].args.responseCode
    ).to.equal(22)

    const txAssociate = await tokenCreateContractWallet2.associateTokensPublic(
      signers[1].address,
      [tokenAddress],
      Constants.GAS_LIMIT_1_000_000
    )
    const receiptAssociate = await txAssociate.wait()
    expect(
      receiptAssociate.events.filter(
        (e) => e.event === Constants.Events.ResponseCode
      )[0].args.responseCode
    ).to.equal(22)
  })

  it('should be able to execute dissociateToken and associateToken', async function () {
    const tokenCreateContractWallet2 = tokenCreateContract.connect(signers[1])
    const tokenManagmentContractWallet2 = tokenManagmentContract.connect(
      signers[1]
    )

    const txDisassociate =
      await tokenManagmentContractWallet2.dissociateTokenPublic(
        signers[1].address,
        tokenAddress,
        Constants.GAS_LIMIT_1_000_000
      )
    const receiptDisassociate = await txDisassociate.wait()
    expect(
      receiptDisassociate.events.filter(
        (e) => e.event === Constants.Events.ResponseCode
      )[0].args.responseCode
    ).to.equal(22)

    const txAssociate = await tokenCreateContractWallet2.associateTokenPublic(
      signers[1].address,
      tokenAddress,
      Constants.GAS_LIMIT_1_000_000
    )
    const receiptAssociate = await txAssociate.wait()
    expect(
      receiptAssociate.events.filter(
        (e) => e.event === Constants.Events.ResponseCode
      )[0].args.responseCode
    ).to.equal(22)
  })

  it('should be able to execute createFungibleToken', async function () {
    const tokenAddressTx = await tokenCreateContract.createFungibleTokenPublic(
      tokenCreateContract.address,
      {
        value: ethers.BigNumber.from('10000000000000000000'),
        gasLimit: 1_000_000,
      }
    )
    const tokenAddressReceipt = await tokenAddressTx.wait()
    const result = tokenAddressReceipt.events.filter(
      (e) => e.event === Constants.Events.CreatedToken
    )[0].args[0]
    expect(result).to.exist
    expectValidHash(result, 40)
  })

  it('should be able to execute createNonFungibleToken', async function () {
    const tokenAddressTx =
      await tokenCreateContract.createNonFungibleTokenPublic(
        tokenCreateContract.address,
        {
          value: ethers.BigNumber.from('10000000000000000000'),
          gasLimit: 1_000_000,
        }
      )

    const tokenAddressReceipt = await tokenAddressTx.wait()
    const result = tokenAddressReceipt.events.filter(
      (e) => e.event === Constants.Events.CreatedToken
    )[0].args[0]
    expect(result).to.exist
    expectValidHash(result, 40)
  })

  it('should be able to execute createFungibleTokenWithCustomFees', async function () {
    const tx =
      await tokenCreateContract.createFungibleTokenWithCustomFeesPublic(
        signers[0].address,
        tokenAddress,
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
    const tx =
      await tokenCreateContract.createNonFungibleTokenWithCustomFeesPublic(
        signers[0].address,
        tokenAddress,
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

  it('should be able to execute mintToken', async function () {
    const nftAddress = await utils.createNonFungibleToken(
      tokenCreateContract,
      signers[0].address
    )
    expect(nftAddress).to.exist
    expectValidHash(nftAddress, 40)

    const tx = await tokenCreateContract.mintTokenPublic(
      nftAddress,
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
  })

  it('should be able to execute grantTokenKyc', async function () {
    const grantKycTx = await tokenCreateContract.grantTokenKycPublic(
      tokenAddress,
      signers[1].address,
      Constants.GAS_LIMIT_1_000_000
    )
    expect(
      (await grantKycTx.wait()).events.filter(
        (e) => e.event === Constants.Events.ResponseCode
      )[0].args.responseCode
    ).to.equal(22)
  })

  describe('Hapi vs Ethereum token create test', function () {
    const tokenName = 'tokenName'
    const tokenSymbol = 'tokenSymbol'
    const tokenMemo = 'memo'
    const initialSupply = 1000
    const maxSupply = 1000
    const decimals = 8
    const freezeDefaultStatus = false
    const key = PublicKey.fromBytes(utils.getSignerCompressedPublicKey())
    let signers

    before(async function () {
      signers = await ethers.getSigners()
      tokenCreateContract = await utils.deployTokenCreateContract()
      tokenQueryContract = await utils.deployTokenQueryContract()
      await utils.updateAccountKeysViaHapi([
        tokenCreateContract.address,
        tokenQueryContract.address,
      ])
    })

    async function createTokenviaHapi() {
      const client = await utils.createSDKClient()
      const autoRenewAccount = await utils.getAccountId(
        signers[0].address,
        client
      )

      const tokenCreate = await new TokenCreateTransaction()
        .setTokenName(tokenName)
        .setTokenMemo(tokenMemo)
        .setTokenSymbol(tokenSymbol)
        .setDecimals(decimals)
        .setInitialSupply(initialSupply)
        .setMaxSupply(maxSupply)
        .setSupplyType(TokenSupplyType.Finite)
        .setTreasuryAccountId(client.operatorAccountId)
        .setAutoRenewAccountId(autoRenewAccount)
        .setKycKey(key)
        .setWipeKey(key)
        .setPauseKey(key)
        .setFreezeKey(key)
        .setSupplyKey(key)
        .setFreezeDefault(freezeDefaultStatus)
        .setTransactionId(TransactionId.generate(client.operatorAccountId))
        .setNodeAccountIds([client._network.getNodeAccountIdsForExecute()[0]])
        .setTransactionMemo('Token')
        .execute(client)

      const receipt = await tokenCreate.getReceipt(client)
      const tokenId = receipt.tokenId.toString()
      return tokenId
    }

    async function createTokenviaPrecompile() {
      const tokenAddressTx =
        await tokenCreateContract.createFungibleTokenWithSECP256K1AdminKeyPublic(
          signers[0].address,
          utils.getSignerCompressedPublicKey(),
          {
            value: '10000000000000000000',
            gasLimit: 1_000_000,
          }
        )
      const tokenAddressReceipt = await tokenAddressTx.wait()
      const { tokenAddress } = tokenAddressReceipt.events.filter(
        (e) => e.event === Constants.Events.CreatedToken
      )[0].args

      return tokenAddress
    }

    it('should be able to compare tokens created from precompile and hapi', async function () {
      const hapiTokenAddress =
        '0x' +
        AccountId.fromString(await createTokenviaHapi()).toSolidityAddress()
      const precompileTokenAddress = await createTokenviaPrecompile()

      const hapiTokenInfoTx =
        await tokenQueryContract.getFungibleTokenInfoPublic(hapiTokenAddress)

      const hapiTokenInfo = (await hapiTokenInfoTx.wait()).events.filter(
        (e) => e.event === Constants.Events.FungibleTokenInfo
      )[0].args.tokenInfo[0][0]

      const precompileTokenInfoTx =
        await tokenQueryContract.getFungibleTokenInfoPublic(
          precompileTokenAddress
        )

      const precompileTokenInfo = (
        await precompileTokenInfoTx.wait()
      ).events.filter((e) => e.event === Constants.Events.FungibleTokenInfo)[0]
        .args.tokenInfo[0][0]

      expect(
        (await hapiTokenInfoTx.wait()).events.filter(
          (e) => e.event === Constants.Events.ResponseCode
        )[0].args.responseCode
      ).to.equal(22)
      expect(
        (await precompileTokenInfoTx.wait()).events.filter(
          (e) => e.event === Constants.Events.ResponseCode
        )[0].args.responseCode
      ).to.equal(22)
      expect(hapiTokenInfo).not.null
      expect(precompileTokenInfo).not.null

      expect(hapiTokenInfo.name).to.eq(precompileTokenInfo.name)
      expect(hapiTokenInfo.symbol).to.eq(precompileTokenInfo.symbol)
      expect(hapiTokenInfo.memo).to.eq(precompileTokenInfo.memo)
      expect(hapiTokenInfo.maxSupply).to.eq(precompileTokenInfo.maxSupply)

      expect(hapiTokenInfo.tokenKeys[1].key.ECDSA_secp256k1).to.eq(
        precompileTokenInfo.tokenKeys[1].key.ECDSA_secp256k1
      ) // KYC KEY
      expect(hapiTokenInfo.tokenKeys[2].key.ECDSA_secp256k1).to.eq(
        precompileTokenInfo.tokenKeys[2].key.ECDSA_secp256k1
      ) // FREEZE KEY
      expect(hapiTokenInfo.tokenKeys[3].key.ECDSA_secp256k1).to.eq(
        precompileTokenInfo.tokenKeys[3].key.ECDSA_secp256k1
      ) // WIPE KEY
      expect(hapiTokenInfo.tokenKeys[4].key.ECDSA_secp256k1).to.eq(
        precompileTokenInfo.tokenKeys[4].key.ECDSA_secp256k1
      ) // SUPPLY KEY
      expect(hapiTokenInfo.tokenKeys[6].key.ECDSA_secp256k1).to.eq(
        precompileTokenInfo.tokenKeys[6].key.ECDSA_secp256k1
      ) // PAUSE KEY
    })
  })
})
