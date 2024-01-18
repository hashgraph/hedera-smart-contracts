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
const {
  SECOND,
  MINUTE,
  HOUR,
  DAY,
  WEEK,
  Contract,
} = require('../../constants');

describe('@solidityequiv3 Time Units Test Suite', function () {
  let contract;

  before(async function () {
    signers = await ethers.getSigners();

    const factory = await ethers.getContractFactory(Contract.TimeUnits);
    contract = await factory.deploy();
  });

  it('confirm 1 == 1 seconds', async function () {
    const res = await contract.get1Second();

    expect(res).to.equal(SECOND);
  });

  it('confirm 1 minutes == 60 seconds', async function () {
    const res = await contract.get1Minute();

    expect(res).to.equal(MINUTE);
  });

  it('confirm 1 hours == 60 minutes', async function () {
    const res = await contract.get1Hour();

    expect(res).to.equal(HOUR);
  });

  it('confirm 1 days == 24 hours', async function () {
    const res = await contract.get1Day();

    expect(res).to.equal(DAY);
  });

  it('confirm 1 weeks == 7 days', async function () {
    const res = await contract.get1Week();

    expect(res).to.equal(WEEK);
  });
});
