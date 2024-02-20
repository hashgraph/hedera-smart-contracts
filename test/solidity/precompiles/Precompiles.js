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

const blake = require('blakejs');
const BN = require('bn.js');
const elliptic = require('elliptic');
const { ethers } = require('hardhat');
const { expect } = require('chai');
const Constants = require('../../constants');

function computeBlake2b(input) {
  const hash = blake.blake2b(input, null, 32); // 32 bytes = 256 bits
  return Buffer.from(hash).toString('hex');
}

describe('@solidityequiv3 Precompiles Support Test Suite', function () {
  let precompilesContract;
  const prime =
    '21888242871839275222246405745257275088696311157297823662689037894645226208583';

  const alt_bn128 = new elliptic.curve.short({
    p: new BN(prime),
    a: '0',
    b: '3',
    g: [new BN('1'), new BN('2')],
    n: new BN(
      '21888242871839275222246405745257275088548364400416034343698204186575808495617'
    ),
    h: '1',
  });

  before(async () => {
    const Precompiles = await ethers.getContractFactory(
      Constants.Contract.Precompiles
    );
    precompilesContract = await Precompiles.deploy();
  });

  it('Should verify the signer of a message using ecrecover', async function () {
    const UNSIGNED_MESSAGE = 'I agree to the terms';
    const walletSigner = ethers.Wallet.createRandom();
    const signedMessage = await walletSigner.signMessage(UNSIGNED_MESSAGE);
    const hashedMessage = ethers.hashMessage(UNSIGNED_MESSAGE);

    const splitMessage = ethers.Signature.from(signedMessage);

    const v = splitMessage.v;
    const r = splitMessage.r;
    const s = splitMessage.s;

    // Verify the signature using the contract
    const isVerifiedAddress = await precompilesContract.verifySignature(
      hashedMessage,
      v,
      r,
      s,
      walletSigner.address
    );
    expect(isVerifiedAddress).to.be.true;
  });

  it('Should return the correct SHA-256 hash', async function () {
    const crypto = require('crypto');
    const input = 'Hello future!';
    const hash = crypto.createHash('sha256').update(input).digest('hex');
    const expectedHash = '0x' + hash;

    const result = await precompilesContract.computeSha256Hash(input);
    expect(result).to.equal(expectedHash);
  });

  it('Should return the correct RIPEMD-160 hash', async function () {
    const crypto = require('crypto');
    const input = 'Hello future!';
    const hash = crypto.createHash('ripemd160').update(input).digest('hex');
    const expectedHash = '0x' + hash;

    const result = await precompilesContract.computeRipemd160Hash(input);
    expect(result).to.equal(expectedHash);
  });

  it('Should return the same value as input', async function () {
    const inputValue = 12345;
    const result = await precompilesContract.getIdentity(inputValue);

    expect(result).to.equal(inputValue);
  });

  it('Should correctly compute modular exponentiation', async function () {
    const base = 3n;
    const exponent = 2n;
    const modulus = 5n;

    // Expected result: (3^2) % 5 = 9 % 5 = 4
    const expectedOutput = 4n;
    const result = await precompilesContract.modExp.staticCall(
      base,
      exponent,
      modulus
    );

    expect(result).to.equal(expectedOutput);
  });

  it('should add two elliptic curve points', async function () {
    // Get the base point (generator) of the curve
    const basePoint = alt_bn128.g;
    // check that all is well
    expect(alt_bn128.validate(basePoint)).to.be.true;

    // Get another point on the curve by multiplying the base point by 2
    const secondPoint = basePoint.mul(new BN('2'));
    // check that all is well
    expect(alt_bn128.validate(secondPoint)).to.be.true;

    const resPoint = basePoint.add(secondPoint);

    const base = [
      BigInt(basePoint.getX().toString()),
      BigInt(basePoint.getY().toString()),
    ];

    const second = [
      BigInt(secondPoint.getX().toString()),
      BigInt(secondPoint.getY().toString()),
    ];

    // check in contract that the second point is on the curve
    expect(await precompilesContract.isOnCurve(second, prime)).to.be.true;

    const result = await precompilesContract.ecAdd(base, second);

    expect(result[0]).to.equal(resPoint.getX());
    expect(result[1]).to.equal(resPoint.getY());
  });

  it('should correctly multiply a point on the curve by a scalar', async () => {
    // Define a point on the curve (for example, the generator/base point)
    const basePoint = alt_bn128.g; // This is the generator point of the curve

    // Get another point on the curve by multiplying the base point by 2
    const secondPoint = basePoint.mul(new BN('2'));
    // check that all is well
    expect(alt_bn128.validate(secondPoint)).to.be.true;

    // Define a scalar for multiplication
    const scalar = new BN('7');

    // Multiply the point by the scalar
    const resultPoint = secondPoint.mul(scalar);

    const result = await precompilesContract.ecMul.staticCall(
      [
        BigInt(secondPoint.getX().toString()),
        BigInt(secondPoint.getY().toString()),
      ],
      BigInt(scalar.toString()),
      BigInt(prime.toString())
    );

    expect(result[0]).to.equal(resultPoint.getX());
    expect(result[1]).to.equal(resultPoint.getY());
  });

  it('Should correctly compute the ecPairing check', async function () {
    // zkSNARK verification with the pairing check. EIP-197: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-197.md
    // Inputs are taken from circom's "Getting started" example using circom and snarkjs:  https://docs.circom.io/getting-started/installation/

    const pa = [
      '0x10e0c597f83b5955dea39d1070b715e52c102ddb7e3a00168b44be8bf7119f55',
      '0x11661888377b0b03f2bcc23b8a351c8f3d23aabc8dc8df65c41e5d21c974b7c2',
    ];
    const pb = [
      [
        '0x2cf266680cb145e28c214aa7942adb33928091b85ee6a7d0f54c94b6073b89d9',
        '0x0c27c439fc1fd3e02ab52f501d6667fa3d3e1187fafd5b2c0ac15f45e6fbeae9',
      ],
      [
        '0x0f2f9159625c763a41d9eda032e8333d34d8d33d241f040f56e168de8236146c',
        '0x18bcf1bf1212e5e13fea9a0f7a7a01a663782a018a8dfaf5d1cbed099d8f2c45',
      ],
    ];
    const pc = [
      '0x01c57619c684da393e699fe9399a537a5d8d103b55151af2d750c67502a206ce',
      '0x171fe18647a62dbdb54ccb4ba1171ca0210715575ebd51e0abc5a2b8d9411f0c',
    ];
    const pd = [
      '0x0000000000000000000000000000000000000000000000000000000000000021',
    ];

    const result = await precompilesContract.ecPairing(pa, pb, pc, pd);
    expect(result).to.be.true;
  });

  it('Should return the correct Blake2 hash', async function () {
    // data from EIP-152: https://eips.ethereum.org/EIPS/eip-152
    const rounds = 12;
    const h = [
      '0x48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5',
      '0xd182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b',
    ];
    const m = [
      '0x6162630000000000000000000000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    ];
    // const t = ["0x03000000", "0x00000000"]
    const t = ['0x0300000000000000', '0x0000000000000000'];

    const f = true;

    const result = await precompilesContract.blake2.staticCall(
      rounds,
      h,
      m,
      t,
      f
    );

    expect(result[0]).to.equal(
      '0xba80a53f981c4d0d6a2797b69f12f6e94c212f14685ac4b74b12bb6fdbffa2d1'
    );
    expect(result[1]).to.equal(
      '0x7d87c5392aab792dc252d5de4533cc9518d38aa8dbf1925ab92386edd4009923'
    );
  });
});
