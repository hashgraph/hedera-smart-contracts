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

describe('ExchangeRateMock Test Suite', function () {
  let exchangeRateMock;
  const gasLimit = 1000000;
  const tinybars = 100000000;
  const tinycents = 100000000;

  before(async function () {
    const factory = await ethers.getContractFactory(
      Constants.Contract.ExchangeRateMock
    );

    exchangeRateMock = await factory.deploy();
  });

  it('should be able to execute convertTinycentsToTinybars', async function () {
    const tx = await exchangeRateMock.convertTinycentsToTinybars(tinycents, {
      gasLimit,
    });

    const txReceipt = await tx.wait();
    const result = txReceipt.logs.filter(
      (e) => e.fragment.name === Constants.Events.TinyBars
    )[0].args[0];

    expect(result).to.exist;
  });

  it('should be able to execute convertTinybarsToTinycents', async function () {
    const tx = await exchangeRateMock.convertTinybarsToTinycents(tinybars, {
      gasLimit,
    });

    const txReceipt = await tx.wait();
    const result = txReceipt.logs.filter(
      (e) => e.fragment.name === Constants.Events.TinyCents
    )[0].args[0];

    expect(result).to.exist;
  });
});
