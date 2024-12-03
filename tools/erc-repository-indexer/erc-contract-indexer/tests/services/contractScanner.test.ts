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
import constants from '../../src/utils/constants';
import testConstants from '../utils/constants';
import { MirrorNodeContract } from '../../src/schemas/MirrorNodeSchemas';
import { ContractScannerService } from '../../src/services/contractScanner';
import { Helper } from '../../src/utils/helper';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

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
    const mockContracts: MirrorNodeContract[] = testConstants.MOCK_MN_CONTRACTS;

    it('should fetch contracts successfully', async () => {
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
