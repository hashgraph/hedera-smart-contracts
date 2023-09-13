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
import { handleExchangeRate } from '@/api/hedera/exchange-rate-interactions';

describe('Exchange Rate Test Suite', () => {
  const amount = 100000000;
  const gasLimit = 1000000;
  const mockConvertedAmount = 833333;
  const txHash = '0x6a1210aab9aa367254b93fc8b50e5a8a4134c06c83785880e2e6f44701a6ca3a';

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
        hash: txHash,
      }),
    };
  };

  // mock baseContract object
  const baseContract = {
    convertTinycentsToTinybars: jest
      .fn()
      .mockResolvedValue(contractMockedResolvedValue('TinyBars')),
    convertTinybarsToTinycents: jest
      .fn()
      .mockResolvedValue(contractMockedResolvedValue('TinyCents')),
  };

  it('should execute handleExchangeRate with API === "CENT_TO_BAR" and return a txHash and convertedAmount', async () => {
    const txRes = await handleExchangeRate(
      baseContract as unknown as Contract,
      'CENT_TO_BAR',
      amount,
      gasLimit
    );

    expect(txRes.err).toBeNull;
    expect(txRes.transactionHash).toBe(txHash);
    expect(txRes.convertedAmount).toBe(mockConvertedAmount);
  });

  it('should execute handleExchangeRate with API === "BAR_TO_CENT" and return a txHash and convertedAmount', async () => {
    const txRes = await handleExchangeRate(
      baseContract as unknown as Contract,
      'BAR_TO_CENT',
      amount,
      gasLimit
    );

    expect(txRes.err).toBeNull;
    expect(txRes.transactionHash).toBe(txHash);
    expect(txRes.convertedAmount).toBe(mockConvertedAmount);
  });
});
