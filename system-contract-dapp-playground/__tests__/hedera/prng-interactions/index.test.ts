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
import { handlePRGNAPI } from '@/api/hedera/prng-interactions';

describe('PRNG Test Suite', () => {
  const gasLimit = 1000000;
  const txHash = '0x6a1210aab9aa367254b93fc8b50e5a8a4134c06c83785880e2e6f44701a6ca3a';
  const pseudoRandomeSeed = '0xfa50a79075af247b11ea6e7e492d10e96f66237a9f8352ac92473580d23ec924';

  // mock baseContract object
  const baseContract = {
    getPseudorandomSeed: jest.fn().mockResolvedValue({
      wait: jest.fn().mockResolvedValue({
        logs: [
          {
            fragment: {
              name: 'PseudoRandomSeed',
            },
            data: pseudoRandomeSeed,
          },
        ],
        hash: txHash,
      }),
    }),
  };

  it('should execute handlePRGNAPI then return a transaction hash and a pseudo random seed', async () => {
    const txRes = await handlePRGNAPI(baseContract as unknown as Contract, gasLimit);

    expect(txRes.err).toBeNull;
    expect(txRes.transactionHash).toBe(txHash);
    expect(txRes.pseudoRandomSeed).toBe(pseudoRandomeSeed);
  });
});
