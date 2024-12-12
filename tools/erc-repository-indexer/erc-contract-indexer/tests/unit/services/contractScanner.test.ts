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
import constants from '../../../src/utils/constants';
import testConstants from '../utils/constants';
import { MirrorNodeContract } from '../../../src/schemas/MirrorNodeSchemas';
import { ContractScannerService } from '../../../src/services/contractScanner';
import { Helper } from '../../../src/utils/helper';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

jest.mock('axios');
jest.mock('../../../src/utils/helper');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedHelper = Helper as jest.Mocked<typeof Helper>;

describe('ContractScannerService', () => {
  const mockValidMirrorNodeUrl = 'mock-mirror-node.com';
  const mockValidMirrorNodeUrlWeb3 = 'mock-mirror-node-web3.com';

  let contractScannerService: ContractScannerService;

  beforeEach(() => {
    mockedHelper.buildAxiosClient.mockReturnValue({
      mirrorNodeRestClient: mockedAxios,
      mirrorNodeWeb3Client: mockedAxios,
    });

    contractScannerService = new ContractScannerService(
      mockValidMirrorNodeUrl,
      mockValidMirrorNodeUrlWeb3
    );
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

  describe('fetchContractObject', () => {
    const contractId = '0.0.1013';
    const mockBytecode = '0x1234567890abcdef';

    it('should fetch contract bytecode successfully', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { runtime_bytecode: mockBytecode },
      });

      const contractObject =
        await contractScannerService.fetchContractObject(contractId);

      expect(contractObject?.runtime_bytecode).toEqual(mockBytecode);
      expect(axios.get).toHaveBeenCalledWith(
        constants.GET_CONTRACT_ENDPOINT + '/' + contractId
      );
    });

    it('should return null when there is an error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      const contractObject =
        await contractScannerService.fetchContractObject(contractId);

      expect(contractObject).toBeNull();
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it('should retry fetching bytecode on rate limit error', async () => {
      mockedAxios.get
        .mockRejectedValueOnce({ response: { status: 429 } }) // First call returns rate limit error
        .mockResolvedValueOnce({ data: { runtime_bytecode: mockBytecode } }); // Second call succeeds
      mockedHelper.wait.mockResolvedValueOnce(undefined);

      const contractObject =
        await contractScannerService.fetchContractObject(contractId);

      expect(contractObject?.runtime_bytecode).toEqual(mockBytecode);
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('contractCallRequest', () => {
    const callData = {
      data: testConstants.MOCK_CONTRACT_CALL_RESPONSE.erc20.name.sighash,
      to: testConstants.MOCK_MN_CONTRACTS[0].evm_address,
    };

    it('should send a contract call request successfully', async () => {
      const mockResponse = { result: '0xabcdef' };
      mockedAxios.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await contractScannerService.contractCallRequest(callData);

      expect(result).toEqual(mockResponse.result);
      expect(axios.post).toHaveBeenCalledWith(
        constants.CONTRACT_CALL_ENDPOINT,
        callData
      );
    });

    it('should return null when there is an error', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network Error'));

      const result = await contractScannerService.contractCallRequest(callData);

      expect(result).toBeNull();
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    it('should retry on rate limit error', async () => {
      mockedAxios.post
        .mockRejectedValueOnce({ response: { status: 429 } }) // First call returns rate limit error
        .mockResolvedValueOnce({ data: { result: '0xabcdef' } }); // Second call succeeds

      mockedHelper.wait.mockResolvedValueOnce(undefined);
      const result = await contractScannerService.contractCallRequest(callData);

      expect(result).toEqual('0xabcdef');
      expect(axios.post).toHaveBeenCalledTimes(2);
    });
  });
});
