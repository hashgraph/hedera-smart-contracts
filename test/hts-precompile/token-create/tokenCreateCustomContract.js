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

const utils = require('../utils');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../constants');
const { expectValidHash } = require('../assertions');

describe('TokenCreateCustomContract Test Suite', () => {
  const tokenName = 'WrappedHbar';
  const tokenSymbol = 'WHBAR';
  const tokenMemo = 'Wrapped Hbar';
  const initialSupply = 900000000; // 9 WHBAR
  const maxSupply = 30000000000; // 300 WHBAR
  const decimals = 8;
  const feeAmount = 1000n;
  const freezeDefaultStatus = false;
  let keys, signers, fixedFeeTokenAddress, tokenCreateCustomContract;

  before(async () => {
    tokenCreateCustomContract = await utils.deployTokenCreateCustomContract();
    signers = await ethers.getSigners();

    // constructing keys array
    const adminKey = utils.constructIHederaTokenKey(
      'ADMIN',
      'CONTRACT_ID',
      await tokenCreateCustomContract.getAddress()
    );

    const kycKey = utils.constructIHederaTokenKey(
      'KYC',
      'CONTRACT_ID',
      await tokenCreateCustomContract.getAddress()
    );
    const freezeKey = utils.constructIHederaTokenKey(
      'FREEZE',
      'CONTRACT_ID',
      await tokenCreateCustomContract.getAddress()
    );
    const wipeKey = utils.constructIHederaTokenKey(
      'WIPE',
      'CONTRACT_ID',
      await tokenCreateCustomContract.getAddress()
    );

    const supplyKey = utils.constructIHederaTokenKey(
      'SUPPLY',
      'CONTRACT_ID',
      await tokenCreateCustomContract.getAddress()
    );
    const feeKey = utils.constructIHederaTokenKey(
      'FEE',
      'CONTRACT_ID',
      await tokenCreateCustomContract.getAddress()
    );
    const pauseKey = utils.constructIHederaTokenKey(
      'PAUSE',
      'CONTRACT_ID',
      await tokenCreateCustomContract.getAddress()
    );

    keys = [adminKey, kycKey, freezeKey, wipeKey, supplyKey, feeKey, pauseKey];

    fixedFeeTokenAddress = await utils.createFungibleTokenPublic(
      tokenName,
      tokenSymbol,
      tokenMemo,
      initialSupply,
      maxSupply,
      decimals,
      freezeDefaultStatus,
      await tokenCreateCustomContract.getAddress(),
      keys,
      tokenCreateCustomContract
    );
  });

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
      await tokenCreateCustomContract.getAddress(),
      keys,
      {
        value: '35000000000000000000', // = 35 hbars. The more configs on the token, the higher the value fee for precompile contract is
        gasLimit: 1_000_000,
      }
    );

    const txReceipt = await tx.wait();
    const result = txReceipt.logs.filter(
      (e) => e.fragment.name === Constants.Events.CreatedToken
    )[0].args[0];
    expect(result).to.exist;
    expectValidHash(result, 40);
  });

  it('should be able to execute createFungibleTokenWithCustomFees with dynamic params', async function () {
    const tx =
      await tokenCreateCustomContract.createFungibleTokenWithCustomFeesPublic(
        await tokenCreateCustomContract.getAddress(),
        fixedFeeTokenAddress,
        tokenName,
        tokenSymbol,
        tokenMemo,
        initialSupply,
        maxSupply,
        decimals,
        feeAmount,
        keys,
        {
          value: '35000000000000000000',
          gasLimit: 1_000_000,
        }
      );

    const txReceipt = await tx.wait();
    const result = txReceipt.logs.filter(
      (e) => e.fragment.name === Constants.Events.CreatedToken
    )[0].args[0];
    expect(result).to.exist;
    expectValidHash(result, 40);
  });

  it('should be able to execute createNonFungibleToken with dynamic params', async function () {
    const tx = await tokenCreateCustomContract.createNonFungibleTokenPublic(
      tokenName,
      tokenSymbol,
      tokenMemo,
      maxSupply,
      await tokenCreateCustomContract.getAddress(),
      keys,
      {
        value: '35000000000000000000',
        gasLimit: 1_000_000,
      }
    );

    const txReceipt = await tx.wait();
    const result = txReceipt.logs.filter(
      (e) => e.fragment.name === Constants.Events.CreatedToken
    )[0].args[0];
    expect(result).to.exist;
    expectValidHash(result, 40);
  });

  it('should be able to execute createNonFungibleTokenWithCustomFees', async function () {
    const tx =
      await tokenCreateCustomContract.createNonFungibleTokenWithCustomFeesPublic(
        await tokenCreateCustomContract.getAddress(),
        fixedFeeTokenAddress,
        tokenName,
        tokenSymbol,
        tokenMemo,
        maxSupply,
        feeAmount,
        keys,
        {
          value: '20000000000000000000',
          gasLimit: 1_000_000,
        }
      );

    const txReceipt = await tx.wait();
    const result = txReceipt.logs.filter(
      (e) => e.fragment.name === Constants.Events.CreatedToken
    )[0].args[0];
    expect(result).to.exist;
    expectValidHash(result, 40);
  });

  describe('TokenCreateCustomContract token actions', () => {
    let prepFungibleTokenAddress, prepNonFungibeTokenAddress;
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
            await tokenCreateCustomContract.getAddress(),
            keys,
            {
              value: '20000000000000000000',
              gasLimit: 1_000_000,
            }
          )
        ).wait()
      ).logs.filter((e) => e.fragment.name === Constants.Events.CreatedToken)[0]
        .args.tokenAddress;

      prepNonFungibeTokenAddress = (
        await (
          await tokenCreateCustomContract.createNonFungibleTokenPublic(
            tokenName,
            tokenSymbol,
            tokenMemo,
            maxSupply,
            await tokenCreateCustomContract.getAddress(),
            keys,
            {
              value: '20000000000000000000',
              gasLimit: 1_000_000,
            }
          )
        ).wait()
      ).logs.filter((e) => e.fragment.name === Constants.Events.CreatedToken)[0]
        .args[0];
    });

    it('should be able to execute mintToken', async function () {
      const amountToMint = 120;

      // mint fungible tokens
      const mintFungibleTokenTx =
        await tokenCreateCustomContract.mintTokenPublic(
          prepFungibleTokenAddress,
          amountToMint,
          ['0x02'],
          Constants.GAS_LIMIT_1_000_000
        );

      const mintFungibleTokenReceipt = await mintFungibleTokenTx.wait();
      const { responseCode: mintFungibleTokenResCode } =
        mintFungibleTokenReceipt.logs.filter(
          (e) => e.fragment.name === Constants.Events.ResponseCode
        )[0].args;
      expect(mintFungibleTokenResCode).to.equal(22);

      const { newTotalSupply } = mintFungibleTokenReceipt.logs.filter(
        (e) => e.fragment.name === Constants.Events.MintedToken
      )[0].args;
      expect(newTotalSupply).to.eq(initialSupply + amountToMint);

      // mint NFTs
      const mintNonFungibleTokenTx =
        await tokenCreateCustomContract.mintTokenPublic(
          prepNonFungibeTokenAddress,
          0,
          ['0x02'],
          Constants.GAS_LIMIT_1_000_000
        );

      const mintNonFungibleTokenReceipt = await mintNonFungibleTokenTx.wait();

      const { responseCode } = mintNonFungibleTokenReceipt.logs.filter(
        (e) => e.fragment.name === Constants.Events.ResponseCode
      )[0].args;
      expect(responseCode).to.equal(22);

      const { serialNumbers } = mintNonFungibleTokenReceipt.logs.filter(
        (e) => e.fragment.name === Constants.Events.MintedToken
      )[0].args;
      expect(serialNumbers[0]).to.be.greaterThan(0);
    });

    it('should be able to execute mintTokenToAddressPublic', async function () {
      const amountToMint = 120;

      const tx = await tokenCreateCustomContract.mintTokenToAddressPublic(
        prepFungibleTokenAddress,
        signers[1].address,
        amountToMint,
        ['0x02'],
        Constants.GAS_LIMIT_1_000_000
      );

      const receipt = await tx.wait();

      const { responseCode } = receipt.logs.filter(
        (e) => e.fragment.name === Constants.Events.ResponseCode
      )[0].args;
      expect(responseCode).to.equal(22);

      const { newTotalSupply } = receipt.logs.filter(
        (e) => e.fragment.name === Constants.Events.MintedToken
      )[0].args;
      expect(newTotalSupply).to.greaterThan(initialSupply);

      const { receiver, amount } = receipt.logs.filter(
        (e) => e.fragment.name === Constants.Events.TransferToken
      )[0].args;
      expect(receiver).to.eq(signers[1].address);
      expect(amount).to.eq(amountToMint);
    });

    it('should be able to execute mintNonFungibleTokenToAddressPublic', async function () {
      const tx =
        await tokenCreateCustomContract.mintNonFungibleTokenToAddressPublic(
          prepNonFungibeTokenAddress,
          signers[1].address,
          0,
          ['0x02'],
          Constants.GAS_LIMIT_1_000_000
        );

      const receipt = await tx.wait();

      const { responseCode } = receipt.logs.filter(
        (e) => e.fragment.name === Constants.Events.ResponseCode
      )[0].args;
      expect(responseCode).to.equal(22);

      const { serialNumbers } = receipt.logs.filter(
        (e) => e.fragment.name === Constants.Events.MintedToken
      )[0].args;
      expect(serialNumbers[0]).to.be.greaterThan(0);

      const { receiver, amount } = receipt.logs.filter(
        (e) => e.fragment.name === Constants.Events.TransferToken
      )[0].args;
      expect(receiver).to.eq(signers[1].address);
      expect(amount).to.eq(0);
    });

    it('should be able to execute associateTokensPublic', async function () {
      // @notice the provided associating account must sign an updateAccountKeys transaction first.
      // @notice see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/HederaTokenService.sol#L98
      //         for more information on precompiled HTS.associateTokens()
      await utils.updateAccountKeysViaHapi([
        await tokenCreateCustomContract.getAddress(),
      ]);

      const tx = await tokenCreateCustomContract.associateTokensPublic(
        signers[0].address,
        [prepFungibleTokenAddress, prepNonFungibeTokenAddress],
        Constants.GAS_LIMIT_1_000_000
      );

      const receipt = await tx.wait();
      const { responseCode } = receipt.logs.filter(
        (e) => e.fragment.name === Constants.Events.ResponseCode
      )[0].args;
      expect(responseCode).to.equal(22);
    });

    it('should be able to execute associateTokenPublic', async function () {
      // @notice the provided associating account must sign the transaction first.
      // @notice see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/HederaTokenService.sol#L105
      //         for more information on precompiled HTS.associateToken()
      await utils.updateAccountKeysViaHapi([
        await tokenCreateCustomContract.getAddress(),
      ]);

      const tx = await tokenCreateCustomContract.associateTokenPublic(
        signers[1].address, // using a different account to avoid TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT error
        prepFungibleTokenAddress,
        Constants.GAS_LIMIT_1_000_000
      );

      const receipt = await tx.wait();
      const { responseCode } = receipt.logs.filter(
        (e) => e.fragment.name === Constants.Events.ResponseCode
      )[0].args;
      expect(responseCode).to.equal(22);
    });

    it('should be able to execute grantTokenKyc', async function () {
      // @notice: The ID of the smart contract is set as the account receiving KYC for testing purpose.
      //          Any account other than the smart contract ID must first get associated with the token first.
      //
      // @notice  see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/HederaTokenService.sol#L399
      //          for more information on precompiled HTS.associateToken()
      const tx = await tokenCreateCustomContract.grantTokenKycPublic(
        prepFungibleTokenAddress,
        await tokenCreateCustomContract.getAddress(),
        Constants.GAS_LIMIT_1_000_000
      );

      const receipt = await tx.wait();
      const { responseCode } = receipt.logs.filter(
        (e) => e.fragment.name === Constants.Events.ResponseCode
      )[0].args;
      expect(responseCode).to.equal(22);
    });
  });

  it("should fail when token create has missing treasury's signature in transaction", async () => {
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
      signers[0].address, // the caller is set as treasury account of the token
      keys,
      {
        value: '35000000000000000000',
        gasLimit: 1_000_000,
      }
    );

    expect(tx.from).to.eq(signers[0].address);
    try {
      await tx.wait();
    } catch (error) {
      expect(error).to.exist;
      expect(error.code).to.eq(Constants.CALL_EXCEPTION);
    }
  });

  it("should pass when token create has the correct treasury's signature in transaction", async () => {
    // @notice the treasury account must sign the transaction first.
    await utils.updateAccountKeysViaHapi([
      await tokenCreateCustomContract.getAddress(),
    ]);

    const tx = await tokenCreateCustomContract.createFungibleTokenPublic(
      tokenName,
      tokenSymbol,
      tokenMemo,
      initialSupply,
      maxSupply,
      decimals,
      freezeDefaultStatus,
      signers[0].address, // the caller is set as treasury account of the token
      keys,
      {
        value: '35000000000000000000',
        gasLimit: 1_000_000,
      }
    );

    expect(tx.from).to.eq(signers[0].address);
    expect(tx.to).to.exist;

    const txReceipt = await tx.wait();
    const { tokenAddress } = txReceipt.logs[0].args;

    expect(tokenAddress).to.exist;
    expectValidHash(tokenAddress, 40);
  });
});
