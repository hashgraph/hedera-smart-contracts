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

describe('@cancun KZG Point Evaluation Test Suite', () => {
  let kzgPointEvalContract;

  before(async () => {
    const kzgPointEvalFac = await ethers.getContractFactory(
      Constants.Contract.KZGPointEvaluation
    );
    kzgPointEvalContract = await kzgPointEvalFac.deploy();
  });

  it('Should successfully execute evaluateKZGProof() with valid parameters', async () => {
    // example input and expected output from https://github.com/hashgraph/hedera-services/blob/develop/hedera-node/test-clients/src/main/resource/contract/contracts/Module050OpcodesExist/Module050OpcodesExist.sol#L34C34-L34C418
    const INPUT =
      '010657f37554c781402a22917dee2f75def7ab966d7b770905398eba3c444014623ce31cf9759a5c8daf3a357992f9f3dd7f9339d8998bc8e68373e54f00b75e0000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const EXPECTED_OUTPUT =
      '0x000000000000000000000000000000000000000000000000000000000000100073eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001';

    // input broke down logic based on EIP-4844 https://eips.ethereum.org/EIPS/eip-4844#point-evaluation-precompile
    const VERSIONED_HASH = `0x${INPUT.slice(0, 64)}`;
    const Z = `0x${INPUT.slice(64, 128)}`;
    const Y = `0x${INPUT.slice(128, 192)}`;
    const COMMITMENT = `0x${INPUT.slice(192, 288)}`;
    const PROOF = `0x${INPUT.slice(288)}`;

    // contract call
    const tx = await kzgPointEvalContract.evaluateKZGProof(
      VERSIONED_HASH,
      Z,
      Y,
      COMMITMENT,
      PROOF,
      Constants.GAS_LIMIT_1_000_000
    );

    // wait for a receipt
    const receipt = await tx.wait();

    // extract log
    const result = receipt.logs.find(
      (e) => e.fragment.name === 'ExpectedOutput'
    ).args[0];

    // assertion
    expect(result).to.eq(EXPECTED_OUTPUT);
  });

  it('Should failingly execute evaluateKZGProof() with invalid parameters', async () => {
    // prepare params
    const VERSIONED_HASH =
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const Z =
      '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const Y =
      '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
    const COMMITMENT =
      '0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd';
    const PROOF =
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    const EXPECTED_FAILURE_OUTPUT = 'KZGPointEvalFailure';

    // contract call
    const tx = await kzgPointEvalContract.evaluateKZGProof(
      VERSIONED_HASH,
      Z,
      Y,
      COMMITMENT,
      PROOF,
      Constants.GAS_LIMIT_1_000_000
    );

    // wait for receipt
    const receipt = await tx.wait();

    // extract log
    const result = receipt.logs.find(
      (e) => e.fragment.name === 'ExpectedOutput'
    ).args[0];

    // assertion
    expect(ethers.toUtf8String(result)).to.eq(EXPECTED_FAILURE_OUTPUT);
  });
});
