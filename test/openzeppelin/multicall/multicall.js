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

describe('@OZMulticall Tests', function () {
  let contract;

  before(async function () {
    const factoryErrorsExternal = await ethers.getContractFactory(
      Constants.Contract.MulticallTest
    );
    contract = await factoryErrorsExternal.deploy();
    await contract.deployed();
  });

  it('should perform a multicall', async function () {
    const foo = await contract.populateTransaction.foo();
    const bar = await contract.populateTransaction.bar();
    const res = await contract.callStatic.multicall([foo.data, bar.data]);

    expect(BigInt(res[0])).to.be.equal(
      BigInt(123)
    );
    expect(BigInt(res[1])).to.be.equal(
      BigInt(456)
    );
  });
});
