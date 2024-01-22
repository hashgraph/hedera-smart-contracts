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

describe('@yulequiv Math Test Suite', () => {
  let mathCoverageContract;
  const X = 6;
  const SX = -6;
  const Y = 3;
  const SY = -3;
  const M = 2;

  before(async () => {
    const mathConverageContractFactory = await ethers.getContractFactory(
      Constants.Contract.MathCoverage
    );

    mathCoverageContract = await mathConverageContractFactory.deploy();
  });

  it('Should execute add(x, y)', async () => {
    const result = await mathCoverageContract.add(X, Y);

    expect(result).to.eq(X + Y);
  });

  it('Should execute sub(x, y)', async () => {
    const result = await mathCoverageContract.sub(X, Y);

    expect(result).to.eq(X - Y);
  });

  it('Should execute mul(x, y)', async () => {
    const result = await mathCoverageContract.mul(X, Y);

    expect(result).to.eq(X * Y);
  });

  it('Should execute div(x, y)', async () => {
    const result = await mathCoverageContract.div(X, Y);
    const zeroResult = await mathCoverageContract.div(X, 0);

    expect(result).to.eq(X / Y);
    expect(zeroResult).to.eq(0);
  });

  it('Should execute sdiv(x, y)', async () => {
    const result = await mathCoverageContract.sdiv(SX, SY);
    const zeroResult = await mathCoverageContract.sdiv(SX, 0);

    expect(result).to.eq(SX / SY);
    expect(zeroResult).to.eq(0);
  });

  it('Should execute mod(x, y)', async () => {
    const result = await mathCoverageContract.mod(X, Y);

    expect(result).to.eq(X % Y);
  });

  it('Should execute smod(x, y)', async () => {
    const result = await mathCoverageContract.smod(SX, SY);

    expect(result).to.eq(SX % SY);
  });

  it('Should execute exp(x, y)', async () => {
    const result = await mathCoverageContract.exp(X, Y);

    expect(result).to.eq(X ** Y);
  });

  it('Should execute lt(x, y)', async () => {
    const result = await mathCoverageContract.lt(X, Y);

    expect(result).to.eq(X < Y ? 1 : 0);
  });

  it('Should execute gt(x, y)', async () => {
    const result = await mathCoverageContract.gt(X, Y);

    expect(result).to.eq(X > Y ? 1 : 0);
  });

  it('Should execute slt(x, y)', async () => {
    const result = await mathCoverageContract.slt(SX, SY);

    expect(result).to.eq(SX < SY ? 1 : 0);
  });

  it('Should execute sgt(x, y)', async () => {
    const result = await mathCoverageContract.sgt(SX, SY);

    expect(result).to.eq(SX > SY ? 1 : 0);
  });

  it('Should execute eq(x, y)', async () => {
    const truthResult = await mathCoverageContract.eq(X, X);
    const falsyResult = await mathCoverageContract.eq(X, Y);

    expect(truthResult).to.eq(1);
    expect(falsyResult).to.eq(X === Y ? 1 : 0);
  });

  it('Should execute iszero(x, y)', async () => {
    const result = await mathCoverageContract.iszero(X);

    expect(result).to.eq(result === 0 ? 1 : 0);
  });

  it('Should execute addMod(x, y)', async () => {
    const result = await mathCoverageContract.addMod(X, Y, M);

    expect(result).to.eq((X + Y) % M);
  });

  it('Should execute mulMod(x, y)', async () => {
    const result = await mathCoverageContract.mulMod(X, Y, M);

    expect(result).to.eq((X * Y) % M);
  });
});
