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

import { ethers } from 'ethers';
import { handleIHRC719APIs } from '@/api/hedera/ihrc-interactions';
import {
  MOCK_GAS_LIMIT,
  MOCK_HEDERA_NETWORK,
  MOCK_TOKEN_ADDRESS,
  MOCK_TX_HASH,
} from '../../utils/common/constants';

// Mock the ethers.Contract constructor
jest.mock('ethers', () => {
  const actualEthers = jest.requireActual('ethers');
  return {
    ...actualEthers,
    Contract: jest.fn().mockImplementation(() => ({
      associate: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({ hash: MOCK_TX_HASH }),
      }),
      dissociate: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({ hash: MOCK_TX_HASH }),
      }),
    })),
  };
});

describe('handleIHR719CAPIs test suite', () => {
  it("should execute handleIHRCAPI() with API === 'ASSOCIATE' and return a success response code and a transaction hash", async () => {
    const txRes = await handleIHRC719APIs(
      'ASSOCIATE',
      MOCK_TOKEN_ADDRESS,
      {} as ethers.JsonRpcSigner,
      MOCK_GAS_LIMIT,
      MOCK_HEDERA_NETWORK
    );

    expect(txRes.err).toBeNull;
    expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
  });

  it("should execute handleIHRCAPI() with API === 'DISSOCIATE' and return a success response code and a transaction hash", async () => {
    const txRes = await handleIHRC719APIs(
      'DISSOCIATE',
      MOCK_TOKEN_ADDRESS,
      {} as ethers.JsonRpcSigner,
      MOCK_GAS_LIMIT,
      MOCK_HEDERA_NETWORK
    );

    expect(txRes.err).toBeNull;
    expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
  });

  it("should execute handleIHRCAPI() with API === 'ASSOCIATE' and return error if hederaTokenAddress is not valid", async () => {
    const txRes = await handleIHRC719APIs(
      'ASSOCIATE',
      '0xabc',
      {} as ethers.JsonRpcSigner,
      MOCK_GAS_LIMIT,
      MOCK_HEDERA_NETWORK
    );

    expect(txRes.err).toBe('Invalid token address');
    expect(txRes.transactionHash).toBeNull;
  });
});
