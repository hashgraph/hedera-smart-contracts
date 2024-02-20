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

describe('@yulequiv Data Allocation Test Suite', () => {
  let dataAllocationContract;
  const P = 32;
  const V = 72;
  const SLOT_0_KEY = 0;
  const SLOT_1_KEY = 1;

  before(async () => {
    const dataAllocationContractFactory = await ethers.getContractFactory(
      Constants.Contract.DataAllocation
    );

    dataAllocationContract = await dataAllocationContractFactory.deploy();
  });

  it('Should execute allocateMemory', async () => {
    const result = await dataAllocationContract.allocateMemory(P, V);

    expect(result).to.eq(V);
  });

  it('Should execute allocateMemory8', async () => {
    const result = await dataAllocationContract.allocateMemory8(P, V);

    expect(result).to.eq(V);
  });

  it('Should execute sload', async () => {
    const EXPECTED_SLOT_0_VALUE = 0; // state variable `a`
    const EXPECTED_SLOT_1_VALUE = 12; // state variable `b`

    const result0 = await dataAllocationContract.sload(SLOT_0_KEY);
    const result1 = await dataAllocationContract.sload(SLOT_1_KEY);

    expect(result0).to.eq(EXPECTED_SLOT_0_VALUE);
    expect(result1).to.eq(EXPECTED_SLOT_1_VALUE);
  });

  it('Should execute sstore', async () => {
    await (await dataAllocationContract.sstore(SLOT_0_KEY, V)).wait();

    const result = await dataAllocationContract.sload(SLOT_0_KEY);

    expect(result).to.eq(V);
  });
});
