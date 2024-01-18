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

describe('@solidityequiv1 CryptoMath Test Suite', function () {
  let cryptoMathContract, provider, signers;

  before(async function () {
    signers = await ethers.getSigners();
    provider = ethers.getDefaultProvider();
    const factory = await ethers.getContractFactory(Constants.Path.CRYPTO_MATH);
    cryptoMathContract = await factory.deploy({ gasLimit: 15000000 });
  });

  // callAddMod computes (x + y) % k where x, y, and k are uint
  it('callAddMod', async function () {
    const x = 5;
    const y = 6;
    const k = 7;
    const res = await cryptoMathContract.callAddMod(x, y, k);
    const expectedRes = (x + y) % k;
    expect(res).to.equal(expectedRes);
  });

  // callMulMod computes (x * y) % k where x, y, and k are uint
  it('callMulMod', async function () {
    const x = 5;
    const y = 6;
    const k = 7;
    const res = await cryptoMathContract.callMulMod(x, y, k);
    const expectedRes = (x * y) % k;
    expect(res).to.equal(expectedRes);
  });

  // callKeccak256 computes the Keccak256 hash of the input
  it('callKeccak256', async function () {
    const input = ethers.toUtf8Bytes('hello world');
    const res = await cryptoMathContract.callKeccak256(input);
    const expectedRes = ethers.keccak256(input);
    expect(res).to.equal(expectedRes);
  });

  // callSha256 computes the SHA256 hash of the input
  it('callSha256', async function () {
    const input = ethers.toUtf8Bytes('hello world');
    const res = await cryptoMathContract.callSha256(input);
    const expectedRes = ethers.sha256(input);
    expect(res).to.equal(expectedRes);
  });

  // callRipemd160 computes the RIPEMD-160 hash of the input
  it('callRipemd160', async function () {
    const input = ethers.toUtf8Bytes('hello world');
    const res = await cryptoMathContract.callRipemd160(input);
    const expectedRes = ethers.ripemd160(input);
    expect(res).to.equal(expectedRes);
  });

  // callEcrecover recovers the address associated with the public key from the signature
  it('callEcrecover and verify that returns the correct address of the signer', async function () {
    const messageToSign = 'Hello Future';
    const hashOfMessage = ethers.hashMessage(messageToSign);
    const walletSigner = ethers.Wallet.createRandom();
    const signedMessage = await walletSigner.signMessage(messageToSign);

    const splitSignature = ethers.Signature.from(signedMessage);

    // extract the v, r, s values from the splitSignature
    const v = splitSignature.v;
    const r = splitSignature.r;
    const s = splitSignature.s;

    const res = await cryptoMathContract.callEcrecover(hashOfMessage, v, r, s);
    const signerAddress = walletSigner.address;
    expect(res).to.equal(signerAddress);
  });
});
