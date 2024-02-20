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
import {
  MOCK_TX_HASH,
  MOCK_GAS_LIMIT,
  MOCK_HEDERA_NETWORK,
  MOCK_SIGNER_ADDRESS,
} from '../../utils/common/constants';

describe('PRNG Test Suite', () => {
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
        hash: MOCK_TX_HASH,
      }),
    }),
  };

  it('should execute handlePRGNAPI then return a transaction hash and a pseudo random seed', async () => {
    const txRes = await handlePRGNAPI(
      baseContract as unknown as Contract,
      MOCK_SIGNER_ADDRESS,
      MOCK_HEDERA_NETWORK,
      MOCK_GAS_LIMIT
    );

    expect(txRes.err).toBeNull;
    expect(txRes.transactionHash).toBe(MOCK_TX_HASH);
    expect(txRes.pseudoRandomSeed).toBe(pseudoRandomeSeed);
  });
});
