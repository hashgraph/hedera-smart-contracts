// SPDX-License-Identifier: Apache-2.0

import { Contract } from 'ethers';
import {
  MOCK_TX_HASH,
  MOCK_GAS_LIMIT,
  MOCK_HEDERA_NETWORK,
  MOCK_SIGNER_ADDRESS,
} from '../../utils/common/constants';
import { handleExchangeRate } from '@/api/hedera/exchange-rate-interactions';

describe('Exchange Rate Test Suite', () => {
  const amount = 100000000;
  const mockConvertedAmount = 833333;

  // mock resolved return value
  const contractMockedResolvedValue = (eventName: string) => {
    return {
      wait: jest.fn().mockResolvedValue({
        logs: [
          {
            fragment: {
              name: eventName,
            },
            data: mockConvertedAmount,
          },
        ],
        hash: MOCK_TX_HASH,
      }),
    };
  };

  // mock baseContract object
  const baseContract = {
    convertTinycentsToTinybars: jest.fn().mockResolvedValue(contractMockedResolvedValue('TinyBars')),
    convertTinybarsToTinycents: jest.fn().mockResolvedValue(contractMockedResolvedValue('TinyCents')),
  };

  it('should execute handleExchangeRate with API === "CENT_TO_BAR" and return a txHash and convertedAmount', async () => {
    const txRes = await handleExchangeRate(
      baseContract as unknown as Contract,
      MOCK_SIGNER_ADDRESS,
      MOCK_HEDERA_NETWORK,
      'CENT_TO_BAR',
      amount,
      MOCK_GAS_LIMIT
    );

    expect(txRes.err).toBeNull;
    expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    expect(txRes.convertedAmount).toBe(mockConvertedAmount);
  });

  it('should execute handleExchangeRate with API === "BAR_TO_CENT" and return a txHash and convertedAmount', async () => {
    const txRes = await handleExchangeRate(
      baseContract as unknown as Contract,
      MOCK_SIGNER_ADDRESS,
      MOCK_HEDERA_NETWORK,
      'BAR_TO_CENT',
      amount,
      MOCK_GAS_LIMIT
    );

    expect(txRes.err).toBeNull;
    expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    expect(txRes.convertedAmount).toBe(mockConvertedAmount);
  });
});
