// SPDX-License-Identifier: Apache-2.0

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
