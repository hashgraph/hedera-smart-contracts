/*-
 *
 * Hedera JSON RPC Relay - Hardhat Example
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
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

describe('Eth Native Precompiles - Test Suite', function () {
  let contract,
    signedData,
    hashedData,
    v,
    r,
    s,
    signer,
    hashedMessageData,
    signerAddr;
  const MESSAGE_DATA = 'Hello World!';
  const UNSIGNED_DATA = 'Hello Eth Native Precompiles!';
  // RIPEMD160 encoding of the string "Hello World!"
  const RIPEMD160_ENCODED =
    '0x0000000000000000000000008476ee4631b9b30ac2754b0ee0c47e161d3f724c';

  before(async () => {
    const Contract = await ethers.getContractFactory(
      Constants.Contract.EthNativePrecompileCaller
    );
    contract = await Contract.deploy({
      gasLimit: 15_000_000,
    });

    signer = (await ethers.getSigners())[0];
    signerAddr = signer.address.toLowerCase().replace('0x', '');
    signedData = await signer.signMessage(UNSIGNED_DATA);
    hashedData = ethers.hashMessage(UNSIGNED_DATA);
    hashedMessageData = ethers.sha256(new Buffer.from(MESSAGE_DATA, 'utf-8'));

    const splitSignature = ethers.Signature.from(signedData);

    v = splitSignature.v;
    r = splitSignature.r;
    s = splitSignature.s;
  });

  it('should be able to call "call0x01 -> ecRecover"', async function () {
    const callData = `0x${Utils.to32ByteString(hashedData)}${Utils.to32ByteString(
      v
    )}${Utils.to32ByteString(r)}${Utils.to32ByteString(s)}`;

    const result = await contract.call0x01(callData);
    const rec = await result.wait();
    expect(rec.logs[0].data).to.contain(signerAddr);
  });

  it('should be able to call "call0x02sha256 -> ecRecover"', async function () {
    const result = await contract.call0x02sha256(MESSAGE_DATA);
    expect(result).to.equal(hashedMessageData);
  });

  it('should be able to call "call0x02 -> SHA2-256"', async function () {
    const result = await contract.call0x02(MESSAGE_DATA);
    const { logs } = await result.wait();
    expect(logs[0].data).to.equal(hashedMessageData);
  });

  it('should be able to call "call0x03 -> RIPEMD-160"', async function () {
    const result = await contract.call0x03(MESSAGE_DATA);
    const { logs } = await result.wait();
    expect(logs[0].data).to.equal(RIPEMD160_ENCODED);
  });

  it('should be able to call "call0x04 -> identity"', async function () {
    const result = await contract.call0x04(MESSAGE_DATA);
    const { logs } = await result.wait();
    const dataToWrite = logs[1].data;
    const resultFromIdentity = logs[0].data;

    expect(dataToWrite).to.equal(resultFromIdentity);
  });

  it('should be able to call "call0x05 -> modexp"', async function () {
    // 3^2 mod 8 = 1
    const result = await contract.call0x05.staticCall(3, 2, 8);

    expect(parseInt(result, 16)).to.equal(1);
  });

  describe('call0x06 & call0x07 -> ecAdd & ecMul', function () {
    const EXPECTED_RESULT_FOR_X =
      '0x030644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd3';
    const EXPECTED_RESULT_FOR_Y =
      '0x15ed738c0e0a7c92e7845f96b2ae9c0a68a6a449e3538fc7ff3ebf7a5a18a2c4';
    const Point = {
      x1: Utils.to32ByteString(1),
      y1: Utils.to32ByteString(2),
    };

    it('should be able to call "call0x06 -> ecAdd', async function () {
      const x1 = (x2 = Point.x1);
      const y1 = (y2 = Point.y1);
      const callData = `0x${x1}${y1}${x2}${y2}`;
      const result = await contract.call0x06(callData);

      const { logs } = await result.wait();
      const x = logs[0].data;
      const y = logs[1].data;

      expect(x).to.equal(EXPECTED_RESULT_FOR_X);
      expect(y).to.equal(EXPECTED_RESULT_FOR_Y);
    });

    it('should be able to call "call0x07 -> ecMul', async function () {
      const x1 = Point.x1;
      const y1 = Point.y1;
      const s = Utils.to32ByteString(2);
      const callData = `0x${x1}${y1}${s}`;
      const result = await contract.call0x07(callData);

      const { logs } = await result.wait();
      const x = logs[0].data;
      const y = logs[1].data;

      expect(x).to.equal(EXPECTED_RESULT_FOR_X);
      expect(y).to.equal(EXPECTED_RESULT_FOR_Y);
    });
  });

  describe('call0x08 -> ecPairing', function () {
    const EXPECTED_RESULT_FAILURE = Utils.to32ByteString(0);
    const EXPECTED_RESULT_SUCCESS = Utils.to32ByteString(1);

    const x1 =
      '2cf44499d5d27bb186308b7af7af02ac5bc9eeb6a3d147c186b21fb1b76e18da';
    const y1 =
      '2c0f001f52110ccfe69108924926e45f0b0c868df0e7bde1fe16d3242dc715f6';
    const x2 =
      '1fb19bb476f6b9e44e2a32234da8212f61cd63919354bc06aef31e3cfaff3ebc';
    const y2 =
      '22606845ff186793914e03e21df544c34ffe2f2f3504de8a79d9159eca2d98d9';
    const x3 =
      '2bd368e28381e8eccb5fa81fc26cf3f048eea9abfdd85d7ed3ab3698d63e4f90';
    const y3 =
      '2fe02e47887507adf0ff1743cbac6ba291e66f59be6bd763950bb16041a0a85e';
    const x4 =
      '0000000000000000000000000000000000000000000000000000000000000001';
    const y4 =
      '30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd45';
    const x5 =
      '1971ff0471b09fa93caaf13cbf443c1aede09cc4328f5a62aad45f40ec133eb4';
    const y5 =
      '091058a3141822985733cbdddfed0fd8d6c104e9e9eff40bf5abfef9ab163bc7';
    const x6 =
      '2a23af9a5ce2ba2796c1f4e453a370eb0af8c212d9dc9acd8fc02c2e907baea2';
    const y6 =
      '23a8eb0b0996252cb548a4487da97b02422ebc0e834613f954de6c7e0afdc1fc';
    // The point at infinity is encoded with both field x and y at 0.
    const x_failure =
      '0000000000000000000000000000000000000000000000000000000000000000';
    const y_failure =
      '0000000000000000000000000000000000000000000000000000000000000000';

    it('should be able to call "call0x08 -> ecPairing (0 points)', async function () {
      const callData = `0x`;
      const result = await contract.call0x08(callData);

      const { logs } = await result.wait();
      const success = logs[0].data;

      expect(success.replace('0x', '')).to.equal(EXPECTED_RESULT_SUCCESS);
    });

    it('should be able to call "call0x08 -> ecPairing', async function () {
      const callData = `0x${x1}${y1}${x2}${y2}${x3}${y3}${x4}${y4}${x5}${y5}${x6}${y6}`;
      const result = await contract.call0x08(callData);

      const { logs } = await result.wait();
      const success = logs[0].data;

      expect(success.replace('0x', '')).to.equal(EXPECTED_RESULT_SUCCESS);
    });

    it('should be able to call "call0x08 -> ecPairing (failure)', async function () {
      const callData = `0x${x_failure}${y_failure}${x2}${y2}${x3}${y3}${x4}${y4}${x5}${y5}${x6}${y6}`;
      const result = await contract.call0x08(callData);

      const { logs } = await result.wait();
      const success = logs[0].data;

      expect(success.replace('0x', '')).to.equal(EXPECTED_RESULT_FAILURE);
    });
  });

  describe('call0x09 -> blake2f', function () {
    const rounds = '0000000c';
    const h =
      '48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5d182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b';
    const m =
      '6162630000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const t = '03000000000000000000000000000000';
    const f = '01';
    const callData = `0x${rounds}${h}${m}${t}${f}`;
    const correctResult =
      'ba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d17d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923';

    it('should be able to call "call0x09 -> blake2f', async function () {
      const result = await contract.call0x09(callData);

      const { logs } = await result.wait();
      const stateVector = logs[0].data;

      expect(stateVector.slice(-128)).to.equal(correctResult);
    });
  });
});
