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

describe('@solidityequiv1 Solidity Defaults Test Suite', function () {
  let contract;

  before(async function () {
    signers = await ethers.getSigners();

    const factory = await ethers.getContractFactory(
      Constants.Contract.Defaults
    );
    contract = await factory.deploy();
  });

  it('confirm solidity functionality: uint defaults', async function () {
    const res = await contract.getUintDefaults();
    expect(res.uInt8).to.equal(0);
    expect(res.uInt16).to.equal(0);
    expect(res.uInt32).to.equal(0);
    expect(res.uInt64).to.equal(BigInt(0));
    expect(res.uInt128).to.equal(BigInt(0));
    expect(res.uInt256).to.equal(BigInt(0));
    expect(res.uInt).to.equal(BigInt(0));
  });

  it('confirm solidity functionality: int defaults', async function () {
    const res = await contract.getIntDefaults();
    expect(res.uInt8).to.equal(0);
    expect(res.uInt16).to.equal(0);
    expect(res.uInt32).to.equal(0);
    expect(res.uInt64).to.equal(BigInt(0));
    expect(res.uInt128).to.equal(BigInt(0));
    expect(res.uInt256).to.equal(BigInt(0));
    expect(res.uInt).to.equal(BigInt(0));
  });

  // Fixed point numbers are Not supported by Solidity yet
  // You can find the documentation: https://docs.soliditylang.org/en/latest/types.html#fixed-point-numbers
  xit('confirm solidity functionality: fixed defaults', async function () {
    const res = await contract.getFixedDefaults();
  });

  // Fixed point numbers are Not supported by Solidity yet
  // You can find the documentation: https://docs.soliditylang.org/en/latest/types.html#fixed-point-numbers
  xit('confirm solidity functionality: ufixed defaults', async function () {
    const res = await contract.getUFixedDefaults();
  });

  it('confirm solidity functionality: bytes defaults', async function () {
    const res = await contract.getBytesDefaults();
    expect(res.bytesDef3).to.equal(
      ethers.zeroPadValue(ethers.hexlify('0x'), 3)
    );
    expect(res.bytesDef10).to.equal(
      ethers.zeroPadValue(ethers.hexlify('0x'), 10)
    );
    expect(res.bytesDef15).to.equal(
      ethers.zeroPadValue(ethers.hexlify('0x'), 15)
    );
    expect(res.bytesDef20).to.equal(
      ethers.zeroPadValue(ethers.hexlify('0x'), 20)
    );
    expect(res.bytesDef25).to.equal(
      ethers.zeroPadValue(ethers.hexlify('0x'), 25)
    );
    expect(res.bytesDef30).to.equal(
      ethers.zeroPadValue(ethers.hexlify('0x'), 30)
    );
    expect(res.bytesDef32).to.equal(
      ethers.zeroPadValue(ethers.hexlify('0x'), 32)
    );
  });

  it('confirm solidity functionality: string defaults', async function () {
    const res = await contract.getStringDefaults();
    expect(res).to.equal('');
  });

  it('confirm solidity functionality: array defaults', async function () {
    const res = await contract.getArrayDefaults();
    expect(Array.isArray(res.strArr)).to.be.true;
    expect(Array.isArray(res.uintArr)).to.be.true;
    expect(Array.isArray(res.boolArr)).to.be.true;
    expect(Array.isArray(res.bytesArr)).to.be.true;
  });

  it('confirm solidity functionality: address defaults', async function () {
    const res = await contract.getAddressDefaults();
    expect(res).to.equal(ethers.zeroPadValue(ethers.hexlify('0x'), 20));
  });

  it('confirm solidity functionality: mapping', async function () {
    const res1 = await contract.strUintMap('');
    const res2 = await contract.addrBoolMap(await contract.getAddress());
    const res3 = await contract.bytesBytesMap(10);
    expect(res1).to.equal(BigInt(0));
    expect(res2).to.equal(false);
    expect(res3).to.equal('0x');
  });
});
