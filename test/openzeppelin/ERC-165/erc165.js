// SPDX-License-Identifier: Apache-2.0

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
