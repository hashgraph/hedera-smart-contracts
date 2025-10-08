// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../constants');

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
