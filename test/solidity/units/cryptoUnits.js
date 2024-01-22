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
const { WEI, GWEI, Contract } = require('../../constants');

describe('@solidityequiv3 Crypto Units Test Suite', function () {
  let contract;

  before(async function () {
    signers = await ethers.getSigners();

    const factory = await ethers.getContractFactory(Contract.CryptoUnits);
    contract = await factory.deploy();
  });

  it('confirm 1 wei == 1', async function () {
    const res = await contract.get1Wei();

    expect(res).to.equal(WEI);
  });

  it('confirm 1 gwei == 1e9', async function () {
    const res = await contract.get1GWei();

    expect(res).to.equal(GWEI);
  });

  it('confirm 1 ether == 1e18', async function () {
    const res = await contract.get1Eth();

    expect(res / BigInt(1e9)).to.equal(GWEI);
  });
});
