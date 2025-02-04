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
const Constants = require('../../../constants.js');

describe('TokenQueryContract Test Suite', function () {
  const TX_SUCCESS_CODE = 22;

  let tokenCreateContract;
  let tokenQueryContract;
  let tokenAddress;
  let tokenWithCustomFeesAddress;
  let nftTokenAddress;
  let mintedTokenSerialNumber;
  let signers;

  before(async function () {
    signers = await ethers.getSigners();
    tokenCreateContract = await utils.deployTokenCreateContract();
    tokenQueryContract = await utils.deployTokenQueryContract();
    await utils.updateAccountKeysViaHapi([
      await tokenCreateContract.getAddress(),
      await tokenQueryContract.getAddress(),
    ]);

    tokenAddress = await utils.createFungibleToken(
      tokenCreateContract,
      await tokenCreateContract.getAddress()
    );
    await utils.updateTokenKeysViaHapi(tokenAddress, [
      await tokenCreateContract.getAddress(),
      await tokenQueryContract.getAddress(),
    ]);
    tokenWithCustomFeesAddress = await utils.createFungibleTokenWithCustomFees(
      tokenCreateContract,
      tokenAddress
    );
    nftTokenAddress = await utils.createNonFungibleToken(
      tokenCreateContract,
      await tokenCreateContract.getAddress()
    );
    mintedTokenSerialNumber = await utils.mintNFTToAddress(
      tokenCreateContract,
      nftTokenAddress
    );

    await utils.associateToken(
      tokenCreateContract,
      tokenAddress,
      Constants.Contract.TokenCreateContract
    );

    await utils.grantTokenKyc(tokenCreateContract, tokenAddress);

    await utils.associateToken(
      tokenCreateContract,
      nftTokenAddress,
      Constants.Contract.TokenCreateContract
    );

    await utils.grantTokenKyc(tokenCreateContract, nftTokenAddress);
  });

  it('should query allowance', async function () {
    const tx = await tokenQueryContract.allowancePublic(
      tokenAddress,
      await tokenCreateContract.getAddress(),
      signers[1].address,
      Constants.GAS_LIMIT_1_000_000
    );
    const amount = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.AllowanceValue
    )[0].args.amount;
    const { responseCode } = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args;

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(amount).to.equal(0);
  });

  it('should query getApproved', async function () {
    const tx = await tokenQueryContract.getApprovedPublic(
      nftTokenAddress,
      mintedTokenSerialNumber,
      Constants.GAS_LIMIT_1_000_000
    );
    const { approved } = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ApprovedAddress
    )[0].args;
    const { responseCode } = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args;

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(approved).to.equal('0x0000000000000000000000000000000000000000');
  });

  it('should query isApprovedForAll', async function () {
    const tx = await tokenQueryContract.isApprovedForAllPublic(
      nftTokenAddress,
      await tokenCreateContract.getAddress(),
      signers[1].address,
      Constants.GAS_LIMIT_1_000_000
    );
    const approved = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.Approved
    )[0].args.approved;
    const { responseCode } = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args;

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(approved).to.equal(false);
  });

  it('should query isFrozen', async function () {
    const tx = await tokenQueryContract.isFrozenPublic(
      tokenAddress,
      await tokenCreateContract.getAddress(),
      Constants.GAS_LIMIT_1_000_000
    );
    const isFrozen = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.Frozen
    )[0].args.frozen;
    const { responseCode } = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args;

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(isFrozen).to.equal(false);
  });

  it('should query isKyc', async function () {
    const tx = await tokenQueryContract.isKycPublic(
      tokenAddress,
      await tokenCreateContract.getAddress(),
      Constants.GAS_LIMIT_1_000_000
    );
    const isFrozen = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.KycGranted
    )[0].args.kycGranted;
    const { responseCode } = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args;

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(isFrozen).to.equal(true);
  });

  it('should query getTokenCustomFees', async function () {
    //All values for fixedFees and fractionalFees are hardcoded and pulled from the Token Create Contract
    const tx = await tokenQueryContract.getTokenCustomFeesPublic(
      tokenWithCustomFeesAddress,
      Constants.GAS_LIMIT_1_000_000
    );
    const { fixedFees, fractionalFees } = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.TokenCustomFees
    )[0].args;
    const { responseCode } = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args;

    expect(responseCode).to.equal(TX_SUCCESS_CODE);

    expect(fixedFees[0].amount).to.equal(1);
    expect(fixedFees[0].tokenId).to.equal(tokenAddress);
    expect(fixedFees[0].useHbarsForPayment).to.equal(false);
    expect(fixedFees[0].useCurrentTokenForPayment).to.equal(false);

    expect(fractionalFees[0].numerator).to.equal(4);
    expect(fractionalFees[0].denominator).to.equal(5);
    expect(fractionalFees[0].minimumAmount).to.equal(10);
    expect(fractionalFees[0].maximumAmount).to.equal(30);
    expect(fractionalFees[0].netOfTransfers).to.equal(false);
  });

  it('should query getTokenDefaultFreezeStatus', async function () {
    const tx =
      await tokenQueryContract.getTokenDefaultFreezeStatusPublic(tokenAddress,Constants.GAS_LIMIT_1_000_000);
    const defaultFreezeStatus = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.TokenDefaultFreezeStatus
    )[0].args.defaultFreezeStatus;
    const { responseCode } = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args;

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(defaultFreezeStatus).to.equal(false);
  });

  it('should query getTokenDefaultKycStatus', async function () {
    const tx =
      await tokenQueryContract.getTokenDefaultKycStatusPublic(tokenAddress,Constants.GAS_LIMIT_1_000_000);
    const defaultKycStatus = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.TokenDefaultKycStatus
    )[0].args.defaultKycStatus;
    const { responseCode } = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args;

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(defaultKycStatus).to.equal(false);
  });

  it('should query getTokenExpiryInfo', async function () {
    const tx = await tokenQueryContract.getTokenExpiryInfoPublic(tokenAddress,Constants.GAS_LIMIT_1_000_000);
    const expiryInfo = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.TokenExpiryInfo
    )[0].args.expiryInfo;
    const { responseCode } = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args;

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(expiryInfo).not.null;
  });

  it('should query getFungibleTokenInfo', async function () {
    const tx =
      await tokenQueryContract.getFungibleTokenInfoPublic(tokenAddress);
    const tokenInfo = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.FungibleTokenInfo
    )[0].args.tokenInfo;
    const { responseCode } = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args;

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(tokenInfo).not.null;
  });

  it('should query getTokenInfo', async function () {
    const tx = await tokenQueryContract.getTokenInfoPublic(tokenAddress);
    const tokenInfo = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.TokenInfo
    )[0].args.tokenInfo;
    const { responseCode } = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args;

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(tokenInfo).not.null;
  });

  it('should query getTokenKey', async function () {
    const tx = await tokenQueryContract.getTokenKeyPublic(tokenAddress, 2,Constants.GAS_LIMIT_1_000_000);
    const key = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.TokenKey
    )[0].args.key;
    const { responseCode } = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args;

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(key).to.exist;
  });

  it('should query getNonFungibleTokenInfo', async function () {
    const tx = await tokenQueryContract.getNonFungibleTokenInfoPublic(
      nftTokenAddress,
      mintedTokenSerialNumber
    );
    const tokenInfo = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.NonFungibleTokenInfo
    )[0].args.tokenInfo;
    const { responseCode } = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args;

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(tokenInfo).not.null;
  });

  it('should query isToken', async function () {
    const tx = await tokenQueryContract.isTokenPublic(tokenAddress,Constants.GAS_LIMIT_1_000_000);
    const isToken = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.IsToken
    )[0].args.isToken;
    const { responseCode } = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args;

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(isToken).to.equal(true);
  });

  it('should query getTokenType', async function () {
    const tx = await tokenQueryContract.getTokenTypePublic(tokenAddress,Constants.GAS_LIMIT_1_000_000);
    const tokenType = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.TokenType
    )[0].args.tokenType;
    const { responseCode } = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args;

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(tokenType).to.equal(0);
  });
});
