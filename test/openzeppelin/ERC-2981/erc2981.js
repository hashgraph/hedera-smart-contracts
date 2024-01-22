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
const Constants = require('../../constants');

describe('@OZERC29821 Royalty Info Test Suite', function () {
  let signers, wallet, wallet2;
  let contract;
  const TOKEN_ID = 666;
  const DEFAULT_FEE_NUMERATOR = 20;
  const DEFAULT_FEE_DENOMINATOR = 10000;

  before(async function () {
    signers = await ethers.getSigners();
    wallet = signers[0];
    wallet2 = signers[1];

    const factory = await ethers.getContractFactory(
      Constants.Contract.ERC2981Test
    );
    contract = await factory.deploy();
  });

  it('should return the default Fee Denominator', async function () {
    const res = await contract.feeDenominator();

    expect(res).to.equal(DEFAULT_FEE_DENOMINATOR);
  });

  it('should set the Default Royalty', async function () {
    const trx = await contract.setDefaultRoyalty(
      wallet2.address,
      DEFAULT_FEE_NUMERATOR,
      { gasLimit: 10_000_000 }
    );
    await trx.wait();
    const royaltyInfoDefault = await contract.royaltyInfo(
      ethers.ZeroAddress,
      10000
    );

    expect(royaltyInfoDefault[0]).to.equal(wallet2.address);
    expect(royaltyInfoDefault[1]).to.equal(DEFAULT_FEE_NUMERATOR);
  });

  it('should return error for setting ZERO Address for receiver', async function () {
    let hasError = false;
    try {
      const trx = await contract.setDefaultRoyalty(
        ethers.ZeroAddress,
        DEFAULT_FEE_NUMERATOR
      );
      await trx.wait();
    } catch (error) {
      hasError = true;
    }

    expect(hasError).to.equal(true);
  });

  it('should return error for setting too big of feeNumerator', async function () {
    let hasError = false;
    try {
      const trx = await contract.setDefaultRoyalty(
        wallet.address,
        DEFAULT_FEE_DENOMINATOR + 1
      );
      await trx.wait();
    } catch (error) {
      hasError = true;
    }

    expect(hasError).to.equal(true);
  });

  it('should return Royalty info for token', async function () {
    const salePrice = 200n;
    const royaltyFraction = 400n;
    const feeDenominator = await contract.feeDenominator();
    const calculatedRoyalty = (salePrice * royaltyFraction) / feeDenominator;
    const trx = await contract.setTokenRoyalty(
      TOKEN_ID,
      wallet.address,
      royaltyFraction
    );
    trx.wait();
    const royaltyInfoDefault = await contract.royaltyInfo(TOKEN_ID, salePrice);

    expect(royaltyInfoDefault[0]).to.equal(wallet.address);
    expect(royaltyInfoDefault[1]).to.equal(calculatedRoyalty);
  });

  it('should reset Royalty Info', async function () {
    const trx = await contract.resetTokenRoyalty(TOKEN_ID);
    await trx.wait();
    const royaltyInfoDefault = await contract.royaltyInfo(
      TOKEN_ID,
      DEFAULT_FEE_NUMERATOR
    );

    expect(royaltyInfoDefault[0]).to.equal(wallet2.address);
    expect(royaltyInfoDefault[1]).to.equal(0);
  });
});
