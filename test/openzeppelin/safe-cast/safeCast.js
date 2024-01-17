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

describe('@OZSafeCast Test Suite', function () {
  let contract;

  const SAFE_CAST_OVERLOW_UINT = 'SafeCastOverflowedUintDowncast';
  const SAFE_CAST_OVERLOW_INT = 'SafeCastOverflowedIntDowncast';
  const SAFE_CATS_OVERLOW_UINT_TO_INT = 'SafeCastOverflowedUintToInt';
  const SAFE_CATS_OVERLOW_INT_TO_UINT = 'SafeCastOverflowedIntToUint';

  const conversions = [
    { func: 'toUint256', error: SAFE_CATS_OVERLOW_INT_TO_UINT },
    { func: 'toUint248', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint240', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint232', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint224', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint216', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint208', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint200', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint192', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint184', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint176', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint168', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint160', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint152', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint144', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint136', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint128', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint120', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint112', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint104', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint96', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint88', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint80', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint72', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint64', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint56', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint48', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint40', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint32', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint24', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint16', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toUint8', error: SAFE_CAST_OVERLOW_UINT },
    { func: 'toInt256', error: SAFE_CATS_OVERLOW_UINT_TO_INT },
    { func: 'toInt248', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt240', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt232', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt224', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt216', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt208', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt200', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt192', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt184', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt176', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt168', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt160', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt152', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt144', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt136', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt128', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt120', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt112', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt104', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt96', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt88', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt80', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt72', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt64', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt56', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt48', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt40', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt32', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt24', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt16', error: SAFE_CAST_OVERLOW_INT },
    { func: 'toInt8', error: SAFE_CAST_OVERLOW_INT },
  ];

  before(async function () {
    const factory = await ethers.getContractFactory(
      Constants.Contract.SafeCastTest
    );
    contract = await factory.deploy({
      gasLimit: 10000000,
    });
  });

  for (const { func, error } of conversions) {
    it(`should return correct value and revert for: "${func}"`, async function () {
      const res = await contract[func](0);
      expect(res).to.exist;
      const revertVal = func === 'toUint256' ? -1 : 1;

      await expect(contract[func](revertVal)).to.eventually.be.rejected;
    });
  }
});
