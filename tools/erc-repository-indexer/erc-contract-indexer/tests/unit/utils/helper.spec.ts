/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
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

import { Helper } from '../../../src/utils/helper';

describe('Helper', () => {
  describe('mergeAndSort', () => {
    const existingContracts = [
      {
        contractId: '0.0.14902',
        address: '0x0000...',
        name: '',
        symbol: '',
        totalSupply: 0,
        decimals: 0,
      },
      {
        contractId: '0.0.15701',
        address: '0x0000...',
        name: 'CUSD',
        symbol: 'CUSD',
        totalSupply: 0,
        decimals: 18,
      },
    ];

    const newContracts = [
      {
        contractId: '0.0.14903',
        address: '0x0000...',
        name: 'CUSD',
        symbol: 'CUSD',
        totalSupply: 0,
        decimals: 18,
      },
      {
        contractId: '0.0.15701',
        address: '0x0000...',
        name: 'CUSD',
        symbol: 'CUSD',
        totalSupply: 0,
        decimals: 18,
      },
      {
        contractId: '0.0.15707',
        address: '0x0000...',
        name: 'CUSD',
        symbol: 'CUSD',
        totalSupply: 0,
        decimals: 18,
      },
    ];

    it('merges, sorts, and removes duplicate objects from the two contract arrays', () => {
      const result = Helper.mergeAndSort(existingContracts, newContracts);

      const expectedResult = [
        existingContracts[0], // '0.0.14902'
        newContracts[0], // '0.0.14903'
        existingContracts[1], // '0.0.15701' (duplicate removed)
        newContracts[2], // '0.0.15707'
      ];

      expect(result).toEqual(expectedResult);
    });
  });
});
