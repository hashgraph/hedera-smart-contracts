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

import { ByteCodeAnalyzer } from '../../src/services/byteCodeAnalyzer';
import constants from '../utils/constants';
import { ContractScannerService } from '../../src/services/contractScanner';
import { MirrorNodeContract } from '../../src/schemas/MirrorNodeSchemas';
import { jest } from '@jest/globals';

describe('ByteCodeAnalyzer', () => {
  let byteCodeAnalyzer: ByteCodeAnalyzer;
  let contractScannerService: ContractScannerService;
  const mockContracts: MirrorNodeContract[] = constants.MOCK_MN_CONTRACTS;

  beforeEach(() => {
    byteCodeAnalyzer = new ByteCodeAnalyzer();
    contractScannerService = new ContractScannerService();
  });

  describe('categorizeERCContracts', () => {
    it('should categorize contracts into ERC20 and ERC721', async () => {
      // Mock the fetchContractByteCode method to return specific bytecode
      jest
        .spyOn(contractScannerService, 'fetchContractByteCode')
        .mockImplementation(async (contractId) => {
          if (contractId === '0.0.1013') {
            return {
              ...mockContracts[0],
              bytecode: constants.ERC_20_BYTECODE_EXAMPLE,
              runtime_bytecode: constants.ERC_20_BYTECODE_EXAMPLE,
            };
          } else if (contractId === '0.0.1014') {
            return {
              ...mockContracts[1],
              bytecode: constants.ERC_721_BYTECODE_EXAMPLE,
              runtime_bytecode: constants.ERC_721_BYTECODE_EXAMPLE,
            };
          }
          return null;
        });

      const result = await byteCodeAnalyzer.categorizeERCContracts(
        contractScannerService,
        mockContracts
      );

      expect(result.erc20Contracts).toHaveLength(1);
      expect(result.erc721Contracts).toHaveLength(1);
      expect(result.erc20Contracts[0]).toEqual({
        address: mockContracts[0].evm_address,
        contractId: mockContracts[0].contract_id,
      });
      expect(result.erc721Contracts[0]).toEqual({
        address: mockContracts[1].evm_address,
        contractId: mockContracts[1].contract_id,
      });
    });

    it('should skip contracts with missing data', async () => {
      // Mock the fetchContractByteCode method to return null
      jest
        .spyOn(contractScannerService, 'fetchContractByteCode')
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
        .spyOn(contractScannerService, 'fetchContractByteCode')
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
});
