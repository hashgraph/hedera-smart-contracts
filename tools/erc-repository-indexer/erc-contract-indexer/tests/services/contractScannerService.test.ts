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

import axios from 'axios';
import { Contract } from '../../src/schemas/MirrorNodeSchemas';
import { ContractScannerService } from '../../src/services/contractScanner';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Helper } from '../../src/utils/helper';

jest.mock('axios');
jest.mock('../../src/utils/helper');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedHelper = Helper as jest.Mocked<typeof Helper>;

describe('ContractScannerService', () => {
  let contractScannerService: ContractScannerService;

  beforeEach(() => {
    contractScannerService = new ContractScannerService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchContracts', () => {
    it('should fetch contracts successfully', async () => {
      const mockContracts: Contract[] = [
        {
          admin_key: {},
          auto_renew_account: null,
          auto_renew_period: 7776000,
          contract_id: '0.0.1013',
          created_timestamp: '1732323370.357439918',
          deleted: false,
          evm_address: '0x00000000000000000000000000000000000003f5',
          expiration_timestamp: '1740099370.357439918',
          file_id: '0.0.1012',
          max_automatic_token_associations: 0,
          memo: 'cellar door',
          nonce: 1,
          obtainer_id: null,
          permanent_removal: null,
          proxy_account_id: null,
          timestamp: {},
        },
      ];

      mockedAxios.get.mockResolvedValueOnce({
        data: { contracts: mockContracts },
      });

      const contracts = await contractScannerService.fetchContracts();
      expect(contracts?.contracts).toEqual(mockContracts);
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it('should return null when there is an error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));
      const contracts = await contractScannerService.fetchContracts();
      expect(contracts).toBeNull();
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it('should retry fetching contracts on rate limit error', async () => {
      const mockContracts: Contract[] = [
        {
          admin_key: {},
          auto_renew_account: null,
          auto_renew_period: 7776000,
          contract_id: '0.0.1013',
          created_timestamp: '1732323370.357439918',
          deleted: false,
          evm_address: '0x00000000000000000000000000000000000003f5',
          expiration_timestamp: '1740099370.357439918',
          file_id: '0.0.1012',
          max_automatic_token_associations: 0,
          memo: 'cellar door',
          nonce: 1,
          obtainer_id: null,
          permanent_removal: null,
          proxy_account_id: null,
          timestamp: {},
        },
      ];

      mockedAxios.get
        .mockRejectedValueOnce({ response: { status: 429 } }) // First call returns rate limit error
        .mockResolvedValueOnce({ data: { contracts: mockContracts } }); // Second call succeeds

      mockedHelper.wait.mockResolvedValueOnce(undefined);
      const contractsPromise = contractScannerService.fetchContracts();
      const contracts = await contractsPromise;

      expect(contracts?.contracts).toEqual(mockContracts);
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });
});
