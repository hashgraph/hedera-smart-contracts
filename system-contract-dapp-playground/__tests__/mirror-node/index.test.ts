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

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { TNetworkName } from '@/types/common';
import { HEDERA_NETWORKS } from '@/utils/common/constants';
import { estimateGasViaMirrorNode, getHederaNativeIDFromEvmAddress } from '@/api/mirror-node';

// Create a new instance of MockAdapter
const RestMock = new MockAdapter(axios);

describe('Mirror Node Test Suite', () => {
  it('should match mirror-node url dynamically based on different networks', async () => {
    const evmAddress = '0xCC07a8243578590d55c5708D7fB453245350Cc2A';
    const networks: TNetworkName[] = ['mainnet', 'testnet', 'previewnet', 'localnet'];

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

  it('should match mirror-node url dynamically based on different params', async () => {
    const evmAddress = '0xCC07a8243578590d55c5708D7fB453245350Cc2A';
    const network: TNetworkName = 'mainnet';
    const params = ['accounts', 'contracts'];

    params.forEach((param) => {
      const experimentUrl = `${HEDERA_NETWORKS[network].mirrorNodeUrl}/${param}/${evmAddress}`;

      let expectedUrl = `https://${network}.mirrornode.hedera.com/api/v1/${param}/${evmAddress}`;
      expect(experimentUrl).toBe(expectedUrl);
    });
  });

  it('should call getHederaNativeIDFromEvmAddress() and return the expected values', async () => {
    const accountParam = 'accounts';
    const contractParam = 'contracts';
    const network: TNetworkName = 'testnet';
    const expectedHederaNativeId = '0.0.445445';
    const evmAddress = '0xCC07a8243578590d55c5708D7fB453245350Cc2A';

    const mockAccountResponse = { account: expectedHederaNativeId };
    const mockContractResponse = { contract_id: expectedHederaNativeId };

    const expectedAccountUrl = `https://${network}.mirrornode.hedera.com/api/v1/${accountParam}/${evmAddress}`;
    const expectedContractUrl = `https://${network}.mirrornode.hedera.com/api/v1/${contractParam}/${evmAddress}`;

    RestMock.onGet(expectedAccountUrl).reply(200, mockAccountResponse);
    RestMock.onGet(expectedContractUrl).reply(200, mockContractResponse);

    const accountResult = await getHederaNativeIDFromEvmAddress(evmAddress, network, accountParam);
    const contractResult = await getHederaNativeIDFromEvmAddress(evmAddress, network, contractParam);

    expect(accountResult.accountId).toBe(expectedHederaNativeId);
    expect(contractResult.contractId).toBe(expectedHederaNativeId);
  });

  it('should call estimateGasViaMirrorNode() and return the expected values', async () => {
    const network: TNetworkName = 'testnet';
    const to = '0x701962ab7ce76b0367c400ffcde5867aa584999c';
    const from = '0xc9f01be8d573a0b4ba8a4c9c23d6c775176dffa1';
    const data = '0xf2f38a74000000000000000000000000000000000000000000000000000000000000e8f5';
    const expectedGasLimit = '0x0000000000017a49';

    const expectedUrl = `https://${network}.mirrornode.hedera.com/api/v1/contracts/call`;
    RestMock.onPost(expectedUrl).reply(200, { result: expectedGasLimit });

    const estimateGas = await estimateGasViaMirrorNode(to, from, data, network);

    expect(estimateGas.err).toBeNull;
    expect(estimateGas.gasLimit).toBe(expectedGasLimit);
  });
});
