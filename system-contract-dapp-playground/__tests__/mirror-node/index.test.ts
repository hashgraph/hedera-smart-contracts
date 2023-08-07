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

import { getAcocuntIdFromEvmAddress } from '@/api/mirror-node';
import { NetworkName } from '@/types/interfaces';
import { HEDERA_NETWORKS } from '@/utils/constants';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// Create a new instance of MockAdapter
const RestMock = new MockAdapter(axios);

describe('getAcocuntIdFromEvmAddress calls the correct mirror URL', () => {
  it('should match mirror-node url dynamically based on different networks', async () => {
    const evmAddress = '0xCC07a8243578590d55c5708D7fB453245350Cc2A';
    const networks: NetworkName[] = ['mainnet', 'testnet', 'previewnet', 'localnet'];

    networks.forEach((network) => {
      const experimentUrl = `${HEDERA_NETWORKS[network].mirrorNodeUrl}/accounts/${evmAddress}`;

      let expectedUrl = ``;
      if (network === 'localnet') {
        expectedUrl = `http://127.0.0.1:5600/api/v1/accounts/${evmAddress}`;
      } else {
        expectedUrl = `https://${network}.mirrornode.hedera.com/api/v1/accounts/${evmAddress}`;
      }
      expect(experimentUrl).toBe(expectedUrl);
    });
  });

  it('should call the correct mirror node URL when a network environment is set', async () => {
    const network: NetworkName = 'testnet';
    const expectedAccountId = '0.0.445445';
    const evmAddress = '0xCC07a8243578590d55c5708D7fB453245350Cc2A';

    const mockResponse = { account: expectedAccountId };
    const expectedUrl = `https://${network}.mirrornode.hedera.com/api/v1/accounts/${evmAddress}`;

    RestMock.onGet(expectedUrl).reply(200, mockResponse);

    const result = await getAcocuntIdFromEvmAddress(evmAddress, network);
    expect(result.accountId).toBe(expectedAccountId);
  });
});
