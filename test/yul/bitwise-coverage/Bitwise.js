// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../constants');

describe('@yulequiv Bitwise Test Suite', () => {
  let bitwiseContract;
  const X = 1;
  const Y = 12;

  before(async () => {
    const bitwiseContractFactory = await ethers.getContractFactory(
      Constants.Contract.Bitwise
    );
    bitwiseContract = await bitwiseContractFactory.deploy();
  });

  it('Should execute not(x)', async () => {
    const result = await bitwiseContract.not(Y);
    expect(result).to.eq(~Y);
  });

  it('Should execute and(x, y)', async () => {
    const result = await bitwiseContract.and(X, Y);
    expect(result).to.eq(X & Y);
  });

  it('Should execute or(x, y)', async () => {
    const result = await bitwiseContract.or(X, Y);
    expect(result).to.eq(X | Y);
  });

  it('Should execute xor(x, y)', async () => {
    const result = await bitwiseContract.xor(X, Y);
    expect(result).to.eq(X ^ Y);
  });

  it('Should execute extractbyteat(n, x)', async () => {
    const DATA = 0x01020304;
    const N = 31; // 32nd byte - since `DATA` is supposed to be a 256-bit (32 bytes) unsigned integer, Solidity will convert the `DATA` to bytes32 by padding 0s in front of the actual data
    const EXPECTED_RESULT = 4; // last byte

    const result = await bitwiseContract.extractbyteat(N, DATA);

    expect(result).to.eq(EXPECTED_RESULT);
  });

  it('Should execute shl(x, y)', async () => {
    const result = await bitwiseContract.shl(X, Y);
    expect(result).to.eq(Y << X);
  });

  it('Should execute shr(x, y)', async () => {
    const result = await bitwiseContract.shr(X, Y);
    expect(result).to.eq(Y >> X);
  });

  it('Should execute sar(x, y)', async () => {
    const SX = -3;
    const SY = -9;
    const result = await bitwiseContract.sar(SX, SY);
    expect(result).to.eq(SY >> SX);
  });
});
