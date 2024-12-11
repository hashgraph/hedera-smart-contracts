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

import {
  MirrorNodeContract,
  MirrorNodeContractResponse,
  ContractCallData,
} from '../../../src/schemas/MirrorNodeSchemas';
import { ByteCodeAnalyzer } from '../../../src/services/byteCodeAnalyzer';
import { ContractScannerService } from '../../../src/services/contractScanner';
import constants from '../../../src/utils/constants';
import testConstants from '../utils/constants';
import { jest } from '@jest/globals';

describe('ByteCodeAnalyzer', () => {
  let byteCodeAnalyzer: ByteCodeAnalyzer;
  let contractScannerService: ContractScannerService;
  const mockContracts: MirrorNodeContract[] = testConstants.MOCK_MN_CONTRACTS;
  const mockContractCallResponse = testConstants.MOCK_CONTRACT_CALL_RESPONSE;
  const mockValidMirrorNodeUrl = 'mock-mirror-node.com';
  const mockValidMirrorNodeUrlWeb3 = 'mock-mirror-node-web3.com';

  beforeEach(() => {
    byteCodeAnalyzer = new ByteCodeAnalyzer();
    contractScannerService = new ContractScannerService(
      mockValidMirrorNodeUrl,
      mockValidMirrorNodeUrlWeb3
    );
  });

  describe('categorizeERCContracts', () => {
    it('should categorize contracts into ERC20 and ERC721', async () => {
      const expectedErc20Object = {
        contractId: mockContracts[0].contract_id,
        address: mockContracts[0].evm_address,
        name: mockContractCallResponse.erc20.name.decodedValue,
        symbol: mockContractCallResponse.erc20.symbol.decodedValue,
        decimals: mockContractCallResponse.erc20.decimals.decodedValue,
        totalSupply: mockContractCallResponse.erc20.totalSupply.decodedValue,
      };
      const expectedErc721Object = {
        contractId: mockContracts[1].contract_id,
        address: mockContracts[1].evm_address,
        name: mockContractCallResponse.erc721.name.decodedValue,
        symbol: mockContractCallResponse.erc721.symbol.decodedValue,
      };

      jest
        .spyOn(contractScannerService, 'fetchContractObject')
        .mockImplementation(async (contractId) => {
          if (contractId === '0.0.1013') {
            return {
              ...mockContracts[0],
              bytecode: testConstants.ERC_20_BYTECODE_EXAMPLE,
              runtime_bytecode: testConstants.ERC_20_BYTECODE_EXAMPLE,
            };
          } else if (contractId === '0.0.1014') {
            return {
              ...mockContracts[1],
              bytecode: testConstants.ERC_721_BYTECODE_EXAMPLE,
              runtime_bytecode: testConstants.ERC_721_BYTECODE_EXAMPLE,
            };
          }
          return null;
        });

      jest
        .spyOn(byteCodeAnalyzer, 'analyzeErcContract' as any)
        .mockImplementation(async (ercId) => {
          if (ercId === 'ERC20') {
            return expectedErc20Object;
          } else if (ercId === 'ERC721') {
            return expectedErc721Object;
          }
          return null;
        });

      const result = await byteCodeAnalyzer.categorizeERCContracts(
        contractScannerService,
        mockContracts
      );

      expect(result.erc20Contracts).toHaveLength(1);
      expect(result.erc721Contracts).toHaveLength(1);
      expect(result.erc20Contracts[0]).toEqual(expectedErc20Object);
      expect(result.erc721Contracts[0]).toEqual(expectedErc721Object);
    });

    it('should skip contracts with missing data', async () => {
      // Mock the fetchContractObject method to return null
      jest
        .spyOn(contractScannerService, 'fetchContractObject')
        .mockResolvedValue(null);
      const result = await byteCodeAnalyzer.categorizeERCContracts(
        contractScannerService,
        mockContracts
      );
      expect(result.erc20Contracts).toHaveLength(0);
      expect(result.erc721Contracts).toHaveLength(0);
    });

    it('should handle errors gracefully', async () => {
      jest
        .spyOn(contractScannerService, 'fetchContractObject')
        .mockImplementation(async () => {
          throw new Error('Fetch error');
        });
      const result = await byteCodeAnalyzer.categorizeERCContracts(
        contractScannerService,
        mockContracts
      );
      expect(result.erc20Contracts).toHaveLength(0);
      expect(result.erc721Contracts).toHaveLength(0);
    });
  });

  describe('analyzeErcContract', () => {
    it('should return ERC20 token info for ERC20 contracts', async () => {
      const expectedTokenInfoObject = {
        contractId: mockContracts[0].contract_id,
        address: mockContracts[0].evm_address,
        name: mockContractCallResponse.erc20.name.decodedValue,
        symbol: mockContractCallResponse.erc20.symbol.decodedValue,
        decimals: mockContractCallResponse.erc20.decimals.decodedValue,
        totalSupply: mockContractCallResponse.erc20.totalSupply.decodedValue,
      };

      jest
        .spyOn(byteCodeAnalyzer, 'getErcTokenInfo' as any)
        .mockResolvedValueOnce(expectedTokenInfoObject);

      const mockContractResponse: MirrorNodeContractResponse = {
        ...mockContracts[0],
        bytecode: testConstants.ERC_20_BYTECODE_EXAMPLE,
        runtime_bytecode: testConstants.ERC_20_BYTECODE_EXAMPLE,
      };

      const result = await (byteCodeAnalyzer as any).analyzeErcContract(
        'ERC20',
        mockContractResponse,
        contractScannerService,
        constants.ERC20_TOKEN_INFO_SELECTORS
      );

      expect(result).toEqual(expectedTokenInfoObject);
    });

    it('should return ERC721 token info for ERC721 contracts', async () => {
      const expectedTokenInfoObject = {
        contractId: mockContracts[1].contract_id,
        address: mockContracts[1].evm_address,
        name: mockContractCallResponse.erc721.name.decodedValue,
        symbol: mockContractCallResponse.erc721.symbol.decodedValue,
      };

      jest
        .spyOn(byteCodeAnalyzer, 'getErcTokenInfo' as any)
        .mockResolvedValueOnce(expectedTokenInfoObject);

      const mockContractResponse: MirrorNodeContractResponse = {
        ...mockContracts[1],
        bytecode: testConstants.ERC_721_BYTECODE_EXAMPLE,
        runtime_bytecode: testConstants.ERC_721_BYTECODE_EXAMPLE,
      };

      const result = await (byteCodeAnalyzer as any).analyzeErcContract(
        'ERC721',
        mockContractResponse,
        contractScannerService,
        constants.ERC721_TOKEN_INFO_SELECTORS
      );

      expect(result).toEqual(expectedTokenInfoObject);
    });

    it('should return null if the fails to get token info', async () => {
      jest
        .spyOn(byteCodeAnalyzer, 'getErcTokenInfo' as any)
        .mockRejectedValue(new Error('Mocked Error'));

      const mockContractResponse: MirrorNodeContractResponse = {
        ...mockContracts[1],
        bytecode: testConstants.ERC_721_BYTECODE_EXAMPLE,
        runtime_bytecode: testConstants.ERC_721_BYTECODE_EXAMPLE,
      };

      const result = await (byteCodeAnalyzer as any).analyzeErcContract(
        'ERC721',
        mockContractResponse,
        contractScannerService,
        constants.ERC721_TOKEN_INFO_SELECTORS
      );

      expect(result).toBeNull();
    });
  });

  describe('getErcTokenInfo', () => {
    it('should return ERC20 token info for ERC20 contracts', async () => {
      jest
        .spyOn(contractScannerService, 'contractCallRequest')
        .mockImplementation(async (callData: ContractCallData) => {
          for (const field of [
            'name',
            'symbol',
            'decimals',
            'totalSupply',
          ] as const) {
            if (
              callData.data === mockContractCallResponse.erc20[field].sighash
            ) {
              return mockContractCallResponse.erc20[field].value;
            }
          }

          return null;
        });

      const mockContractResponse: MirrorNodeContractResponse = {
        ...mockContracts[0],
        bytecode: testConstants.ERC_20_BYTECODE_EXAMPLE,
        runtime_bytecode: testConstants.ERC_20_BYTECODE_EXAMPLE,
      };

      const result = await (byteCodeAnalyzer as any).getErcTokenInfo(
        contractScannerService,
        mockContractResponse,
        constants.ERC20_TOKEN_INFO_SELECTORS
      );

      expect(result).toEqual({
        contractId: mockContracts[0].contract_id,
        address: mockContracts[0].evm_address,
        name: mockContractCallResponse.erc20.name.decodedValue,
        symbol: mockContractCallResponse.erc20.symbol.decodedValue,
        decimals: mockContractCallResponse.erc20.decimals.decodedValue,
        totalSupply: mockContractCallResponse.erc20.totalSupply.decodedValue,
      });
    });

    it('should return ERC721 token info for ERC721 contracts', async () => {
      jest
        .spyOn(contractScannerService, 'contractCallRequest')
        .mockImplementation(async (callData: ContractCallData) => {
          for (const field of ['name', 'symbol'] as const) {
            if (
              callData.data === mockContractCallResponse.erc721[field].sighash
            ) {
              return mockContractCallResponse.erc721[field].value;
            }
          }
          return null;
        });

      const mockContractResponse: MirrorNodeContractResponse = {
        ...mockContracts[1],
        bytecode: testConstants.ERC_721_BYTECODE_EXAMPLE,
        runtime_bytecode: testConstants.ERC_721_BYTECODE_EXAMPLE,
      };

      const result = await (byteCodeAnalyzer as any).getErcTokenInfo(
        contractScannerService,
        mockContractResponse,
        constants.ERC721_TOKEN_INFO_SELECTORS
      );

      expect(result).toEqual({
        contractId: mockContracts[1].contract_id,
        address: mockContracts[1].evm_address,
        name: mockContractCallResponse.erc721.name.decodedValue,
        symbol: mockContractCallResponse.erc721.symbol.decodedValue,
      });
    });

    it('should throw error if the contractCallRequest return null tokenInfoResponse', async () => {
      jest
        .spyOn(contractScannerService, 'contractCallRequest')
        .mockResolvedValue(null);

      const mockContractResponse: MirrorNodeContractResponse = {
        ...mockContracts[1],
        bytecode: testConstants.ERC_721_BYTECODE_EXAMPLE,
        runtime_bytecode: testConstants.ERC_721_BYTECODE_EXAMPLE,
      };

      try {
        await (byteCodeAnalyzer as any).getErcTokenInfo(
          contractScannerService,
          mockContractResponse,
          constants.ERC721_TOKEN_INFO_SELECTORS
        );
        throw new Error('should have thrown an error');
      } catch (error: any) {
        const expectedErrMessage = `ERC contract passes signature matching but fails contract call: contractId=${mockContracts[1].contract_id}, contractAddress=${mockContracts[1].evm_address}, function_selector=${mockContractCallResponse.erc721.name.sighash}`;
        expect(error.errMessage).toEqual(expectedErrMessage);
      }
    });
  });
});
