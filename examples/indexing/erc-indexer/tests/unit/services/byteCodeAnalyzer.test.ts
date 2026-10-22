// SPDX-License-Identifier: Apache-2.0

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
  const mockScanningLimit = 39;

  beforeEach(() => {
    byteCodeAnalyzer = new ByteCodeAnalyzer();
    contractScannerService = new ContractScannerService(
      mockValidMirrorNodeUrl,
      mockValidMirrorNodeUrlWeb3,
      mockScanningLimit
    );
  });

  describe('categorizeERCContracts', () => {
    it('should categorize contracts into ERC20, ERC721, and ERC1155', async () => {
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
      const expectedErc1155Object = {
        contractId: mockContracts[2].contract_id,
        address: mockContracts[2].evm_address,
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
          } else if (contractId === '0.0.1015') {
            return {
              ...mockContracts[2],
              bytecode: testConstants.ERC_1155_BYTECODE_EXAMPLE,
              runtime_bytecode: testConstants.ERC_1155_BYTECODE_EXAMPLE,
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
          } else if (ercId === 'ERC1155') {
            return expectedErc1155Object;
          }
          return null;
        });

      const result = await byteCodeAnalyzer.categorizeERCContracts(
        contractScannerService,
        mockContracts
      );

      expect(result.erc20Contracts).toHaveLength(1);
      expect(result.erc721Contracts).toHaveLength(1);
      expect(result.erc1155Contracts).toHaveLength(1);
      expect(result.erc20Contracts[0]).toEqual(expectedErc20Object);
      expect(result.erc721Contracts[0]).toEqual(expectedErc721Object);
      expect(result.erc1155Contracts[0]).toEqual(expectedErc1155Object);
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

    it('should return ERC1155 token info for ERC1155 contracts', async () => {
      const expectedTokenInfoObject = {
        contractId: mockContracts[2].contract_id,
        address: mockContracts[2].evm_address,
      };

      jest
        .spyOn(byteCodeAnalyzer, 'getErcTokenInfo' as any)
        .mockResolvedValueOnce(expectedTokenInfoObject);

      const mockContractResponse: MirrorNodeContractResponse = {
        ...mockContracts[2],
        bytecode: testConstants.ERC_1155_BYTECODE_EXAMPLE,
        runtime_bytecode: testConstants.ERC_1155_BYTECODE_EXAMPLE,
      };

      const result = await (byteCodeAnalyzer as any).analyzeErcContract(
        'ERC1155',
        mockContractResponse,
        contractScannerService,
        []
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

    it('should NOT throw an error if the contractCallRequest return null tokenInfoResponse', async () => {
      jest
        .spyOn(contractScannerService, 'contractCallRequest')
        .mockResolvedValue(null);

      const mockContractResponse: MirrorNodeContractResponse = {
        ...mockContracts[1],
        bytecode: testConstants.ERC_721_BYTECODE_EXAMPLE,
        runtime_bytecode: testConstants.ERC_721_BYTECODE_EXAMPLE,
      };

      const tokenInfo = await (byteCodeAnalyzer as any).getErcTokenInfo(
        contractScannerService,
        mockContractResponse,
        constants.ERC721_TOKEN_INFO_SELECTORS
      );

      expect(tokenInfo).toEqual({
        contractId: mockContracts[1].contract_id,
        address: mockContracts[1].evm_address,
        name: null,
        symbol: null,
      });
    });
  });

  describe('isErc', () => {
    enum ERCID {
      ERC20 = 'ERC20',
      ERC721 = 'ERC721',
      ERC1155 = 'ERC1155',
    }
    const legitimateErc20Bytecode = testConstants.ERC_20_BYTECODE_EXAMPLE;
    const legitimateErc721Bytecode = testConstants.ERC_721_BYTECODE_EXAMPLE;
    const legitimateErc1155Bytecode = testConstants.ERC_1155_BYTECODE_EXAMPLE;
    const nonErcBytecode =
      '0x6080604081815260048036101561001557600080fd5b600092833560e01c90816301';

    it('should correctly identify ERC-20 contract bytecode based on the presence of the required ERC-20 selectors and events', () => {
      const shouldBeErc20 = (byteCodeAnalyzer as any).isErc(
        ERCID.ERC20,
        legitimateErc20Bytecode
      );

      const shouldNotBeErc20WithErc721Bytecode = (
        byteCodeAnalyzer as any
      ).isErc(ERCID.ERC20, legitimateErc721Bytecode);

      const shouldNotBeErc20WithNonErcBytecode = (
        byteCodeAnalyzer as any
      ).isErc(ERCID.ERC20, nonErcBytecode);

      expect(shouldBeErc20).toBe(true);
      expect(shouldNotBeErc20WithErc721Bytecode).toBe(false);
      expect(shouldNotBeErc20WithNonErcBytecode).toBe(false);
    });

    it('should correctly identify ERC-721 contract bytecode based on the presence of the required ERC-721 selectors and events', () => {
      const shouldBeErc721 = (byteCodeAnalyzer as any).isErc(
        ERCID.ERC721,
        legitimateErc721Bytecode
      );

      const shouldNotBeErc20WithErc20Bytecode = (byteCodeAnalyzer as any).isErc(
        ERCID.ERC721,
        legitimateErc20Bytecode
      );

      const shouldNotBeErc721WithNonErcBytecode = (
        byteCodeAnalyzer as any
      ).isErc(ERCID.ERC721, nonErcBytecode);

      expect(shouldBeErc721).toBe(true);
      expect(shouldNotBeErc20WithErc20Bytecode).toBe(false);
      expect(shouldNotBeErc721WithNonErcBytecode).toBe(false);
    });

    it('should correctly identify ERC-1155 contract bytecode based on the presence of the required ERC-1155 selectors and events', () => {
      const shouldBeErc1155 = (byteCodeAnalyzer as any).isErc(
        ERCID.ERC1155,
        legitimateErc1155Bytecode
      );

      const shouldNotBeErc721WithNonErcBytecode = (
        byteCodeAnalyzer as any
      ).isErc(ERCID.ERC1155, nonErcBytecode);

      expect(shouldBeErc1155).toBe(true);
      expect(shouldNotBeErc721WithNonErcBytecode).toBe(false);
    });

    it('should perform isErc method within a very small time threshold compared to regular regex-based searching', () => {
      // official isErc() method with Aho-Corasick algorithm
      const startTime = performance.now();
      const largeByteCode = '0x' + '00'.repeat(41120); // ~20KB

      // perform signature matching through official isErc() method
      (byteCodeAnalyzer as any).isErc(ERCID.ERC20, largeByteCode);

      const endTime = performance.now();
      const elapsedTime = endTime - startTime;
      const performanceThreshold = 3; // 3 milliseconds
      expect(elapsedTime).toBeLessThan(performanceThreshold);

      // regex-based approach
      const startTimeRegex = performance.now();
      const exampleErc721RegexPattern =
        /(?=.*dd62ed3e)(?=.*095ea7b3)(?=.*70a08231)(?=.*18160ddd)(?=.*a9059cbb)(?=.*23b872dd)(?=.*8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925)(?=.*ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef)/;
      exampleErc721RegexPattern.test(largeByteCode);
      const endTimeRegex = performance.now();
      const elapsedTimeRegex = endTimeRegex - startTimeRegex;
      const performanceThresholdRegex = 3600; // 3600 milliseconds
      expect(elapsedTimeRegex).toBeGreaterThan(performanceThresholdRegex);
    });
  });
});
