/*-
 *
 * Hedera JSON RPC Relay - Hardhat Example
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
const Utils = require('../../utils');

describe('Native Precompiles - Ecrecover Test Suite', function () {
  this.timeout(10000);

  let contract, signedData, hashedData, v, r, s, signer, callData;
  const UNSIGNED_DATA = 'Hello World!';
  const DEFAULT_VALUE = 10000000000000;
  const ADDRESS_ONE = '0x0000000000000000000000000000000000000001';

  before(async () => {
    const Contract = await ethers.getContractFactory(
      Constants.Contract.EcrecoverCaller
    );
    const _contract = await Contract.deploy({
      gasLimit: 8_000_000,
    });

    const contractAddress = await _contract.getAddress();
    contract = Contract.attach(contractAddress);

    signer = (await ethers.getSigners())[0];
    signedData = await signer.signMessage(UNSIGNED_DATA);
    hashedData = ethers.hashMessage(UNSIGNED_DATA);

    const splitSignature = ethers.Signature.from(signedData);

    v = splitSignature.v;
    r = splitSignature.r;
    s = splitSignature.s;

    callData = `0x${Utils.to32ByteString(hashedData)}${Utils.to32ByteString(
      v
    )}${Utils.to32ByteString(r)}${Utils.to32ByteString(s)}`;
  });

  // Calling a method that uses `ecrecover`
  it('should be able to call callEcrecover', async function () {
    const result = await contract.callEcrecover(hashedData, v, r, s);
    expect(result).to.eq(signer.address);
  });

  // Calling a method that calls `0x1` with the specified CallData
  it('should be able to call call0x1', async function () {
    const result = await contract.call0x1(callData);
    const rec = await result.wait();
    expect(rec.logs[0].data).to.contain(
      signer.address.toLowerCase().replace('0x', '')
    );
  });

  it('should not be able to call call0x1 with value', async function () {
    const balanceAtStart = await ethers.provider.getBalance(ADDRESS_ONE);
    expect(balanceAtStart).to.eq(0);

    try {
      await contract.call0x1(callData, { value: DEFAULT_VALUE });
      await result.wait();
      expect(1).to.eq(2);
    } catch (e) {
      expect(e).to.exist;
    }

    const balanceAtEnd = await ethers.provider.getBalance(ADDRESS_ONE);
    expect(balanceAtEnd).to.eq(0);
  });

  // Executing .send to 0x1
  it('should not be able to call send0x1 with no value', async function () {
    const balanceAtStart = await ethers.provider.getBalance(ADDRESS_ONE);
    expect(balanceAtStart).to.eq(0);

    try {
      await contract.send0x1();
      expect(1).to.eq(2);
    } catch (e) {
      expect(e).to.exist;
    }

    const balanceAtEnd = await ethers.provider.getBalance(ADDRESS_ONE);
    expect(balanceAtEnd).to.eq(0);
  });

  it('should not be able to call send0x1 with value', async function () {
    const balanceAtStart = await ethers.provider.getBalance(ADDRESS_ONE);
    expect(balanceAtStart).to.eq(0);

    try {
      await contract.send0x1({ value: DEFAULT_VALUE });
      expect(1).to.eq(2);
    } catch (e) {
      expect(e).to.exist;
    }

    const balanceAtEnd = await ethers.provider.getBalance(ADDRESS_ONE);
    expect(balanceAtEnd).to.eq(0);
  });

  // Executing .transfer to 0x1
  it('should not be able to call transfer0x1 with no value', async function () {
    const balanceAtStart = await ethers.provider.getBalance(ADDRESS_ONE);
    expect(balanceAtStart).to.eq(0);

    try {
      await contract.transfer0x1();
      expect(1).to.eq(2);
    } catch (e) {
      expect(e).to.exist;
    }

    const balanceAtEnd = await ethers.provider.getBalance(ADDRESS_ONE);
    expect(balanceAtEnd).to.eq(0);
  });

  it('should not be able to call transfer0x1 with value', async function () {
    const balanceAtStart = await ethers.provider.getBalance(ADDRESS_ONE);
    expect(balanceAtStart).to.eq(0);

    try {
      await contract.transfer0x1({ value: DEFAULT_VALUE });
      expect(1).to.eq(2);
    } catch (e) {
      expect(e).to.exist;
    }

    const balanceAtEnd = await ethers.provider.getBalance(ADDRESS_ONE);
    expect(balanceAtEnd).to.eq(0);
  });
});
