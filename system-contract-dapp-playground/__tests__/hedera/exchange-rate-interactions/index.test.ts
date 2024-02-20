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
