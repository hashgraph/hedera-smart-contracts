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

describe('@solidityequiv1 Concatenation Test Suite', function () {
  let contract;
  const first = 'first';
  const second = 'second';
  const third = 'third';

  before(async function () {
    signers = await ethers.getSigners();

    const factory = await ethers.getContractFactory(
      Constants.Contract.Concatenation
    );
    contract = await factory.deploy();
  });

  it('byte concatenation', async function () {
    let utf8Encode = new TextEncoder();
    const bytesFirst = utf8Encode.encode(first);
    const bytesSecond = utf8Encode.encode(second);
    const bytesThird = utf8Encode.encode(third);
    const res = await contract.byteConcatenation(
      bytesFirst,
      bytesSecond,
      bytesThird
    );

    expect(
      bytesFirst.byteLength + bytesSecond.byteLength + bytesThird.byteLength
    ).to.equal(res);
  });

  it('string concatenation', async function () {
    const res = await contract.stringConcatenation(first, second, third);

    expect(first.length + second.length + third.length).to.equal(res.length);
    expect(first.concat(second, third)).to.equal(res);
  });

  it('string concatenation Empty', async function () {
    const res = await contract.stringConcatenationEmpty();

    expect(res.length).to.equal(0);
  });

  it('string concatenation Empty', async function () {
    const res = await contract.stringConcatenationEmpty();

    expect(res.length).to.equal(0);
  });
});
