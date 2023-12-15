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

describe('@solidityequiv1 Assignments Tests', function () {
  before(async function () {
    const factoryDestructuring = await ethers.getContractFactory(
      Constants.Contract.DestructuringReturns
    );
    contractDesctructuring = await factoryDestructuring.deploy();

    const factoryReferenceTypes = await ethers.getContractFactory(
      Constants.Contract.AssignmentReferenceTypes
    );
    contractReferenceTypes = await factoryReferenceTypes.deploy();
  });

  it('should verify destructuring works', async function () {
    const result = await contractDesctructuring.testDestructuredReturnParams();
    expect(result).to.deep.equal([
      ethers.BigNumber.from(7),
      true,
      ethers.BigNumber.from(2),
    ]);
  });

  it('should verify assignment of reference types', async function () {
    // here we are testing that if a parameter is assigned to memory a copy will be created
    // and the original object wont be changed
    // while if it is in storage and only referenced we expect it to change
    await contractReferenceTypes.testAssignmentOfReferenceTypes();
    const result = await contractReferenceTypes.getSomeArray();
    expect(result).to.deep.equal([
      ethers.BigNumber.from(1),
      ethers.BigNumber.from(2),
      ethers.BigNumber.from(3),
      ethers.BigNumber.from(10),
      ethers.BigNumber.from(5),
    ]);
  });
});
