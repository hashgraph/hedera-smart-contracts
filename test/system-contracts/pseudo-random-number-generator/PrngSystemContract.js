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

describe('PrngSystemContract Test Suite', function () {
  let prngSystemContract;

  before(async function () {
    const factory = await ethers.getContractFactory(
      Constants.Contract.PrngSystemContract
    );

    prngSystemContract = await factory.deploy();
  });

  it('should be able to execute getPseudorandomSeed to generate a pseudo random seed', async function () {
    const tx = await prngSystemContract.getPseudorandomSeed();
    const txReceipt = await tx.wait();

    const result = txReceipt.logs.filter(
      (e) => e.fragment.name === Constants.Events.PseudoRandomSeed
    )[0].args[0];

    expect(result).to.exist;
    expect(result).to.not.hexEqual(ethers.ZeroHash);
  });
});
