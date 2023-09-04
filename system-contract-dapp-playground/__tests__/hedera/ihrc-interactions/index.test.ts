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

import { handleIHRCAPIs } from '@/api/hedera/ihrc-interactions';
import { ethers } from 'ethers';

const gasLimit = 1000000;
const hederaTokenAddress = '0x00000000000000000000000000000000000084b7';
const txHash = '0x63424020a69bf46a0669f46dd66addba741b9c02d37fab1686428f5209bc759d';

// Mock the ethers.Contract constructor
jest.mock('ethers', () => {
  const actualEthers = jest.requireActual('ethers');
  return {
    ...actualEthers,
    Contract: jest.fn().mockImplementation(() => ({
      associate: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({ hash: txHash }),
      }),
      dissociate: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({ hash: txHash }),
      }),
    })),
  };
});

describe('handleIHRCAPIs test suite', () => {
  it("should execute handleIHRCAPI() with API === 'ASSOCIATE' and return a success response code and a transaction hash", async () => {
    const txRes = await handleIHRCAPIs(
      'ASSOCIATE',
      hederaTokenAddress,
      {} as ethers.JsonRpcSigner,
      gasLimit
    );

    expect(txRes.err).toBeNull;
    expect(txRes.transactionHash).toBe(txHash);
  });

  it("should execute handleIHRCAPI() with API === 'DISSOCIATE' and return a success response code and a transaction hash", async () => {
    const txRes = await handleIHRCAPIs(
      'DISSOCIATE',
      hederaTokenAddress,
      {} as ethers.JsonRpcSigner,
      gasLimit
    );

    expect(txRes.err).toBeNull;
    expect(txRes.transactionHash).toBe(txHash);
  });

  it("should execute handleIHRCAPI() with API === 'ASSOCIATE' and return error if hederaTokenAddress is not valid", async () => {
    const txRes = await handleIHRCAPIs('ASSOCIATE', '0xabc', {} as ethers.JsonRpcSigner, gasLimit);

    expect(txRes.err).toBe('Invalid token address');
    expect(txRes.transactionHash).toBeNull;
  });
});
