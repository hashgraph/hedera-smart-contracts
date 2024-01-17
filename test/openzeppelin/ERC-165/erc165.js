/*
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

describe('@OZERC165 Support Interface Test Suite', function () {
  let contract, climberSelectorContract;

  before(async function () {
    signers = await ethers.getSigners();

    const factory = await ethers.getContractFactory(
      Constants.Contract.Test_ERC165
    );
    contract = await factory.deploy();

    const ClimberSelectorFactory = await ethers.getContractFactory(
      Constants.Contract.ClimberSelector
    );
    climberSelectorContract = await ClimberSelectorFactory.deploy();

    climberInterface = new ethers.Interface([
      'function hasHarness()',
      'function hasChalk()',
      'function hasClimbingShoes()',
    ]);
  });

  it('should confirm support for: ERC-165', async function () {
    const selector = climberSelectorContract.calculateSelector();
    const supports = await contract.supportsInterface(selector);
    expect(supports).to.equal(true);
  });

  it('should confirm support for: ERC-165 -> Selector not suported', async function () {
    const selector = climberSelectorContract.calculateSelectorNotSupported();
    const supports = await contract.supportsInterface(selector);
    expect(supports).to.equal(false);
  });
});
