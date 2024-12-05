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

import { Contract } from 'sevm';
import { ContractScannerService } from './contractScanner';
import { MirrorNodeContract } from '../schemas/MirrorNodeSchemas';
import { ERCOutputInterface } from '../schemas/ERCRegistrySchemas';

export enum ERCID {
  ERC20 = 'ERC20',
  ERC721 = 'ERC721',
}

export class ByteCodeAnalyzer {
  /**
   * Analyzes bytecode, detects and categorizes contracts into ERC20 and ERC721 types based on their bytecode.
   * @param {ContractScannerService} contractScannerService - The service used to fetch contract bytecode.
   * @param {MirrorNodeContract[]} contractObject - An array of contract objects to categorize.
   * @returns {Promise<{erc20Contracts: ERCOutputInterface[], erc721Contracts: ERCOutputInterface[]}>} An object containing arrays of categorized ERC20 and ERC721 contracts.
   * @throws {Error} If there's an error while analyzing contract bytecode.
   */
  async categorizeERCContracts(
    contractScannerService: ContractScannerService,
    contractObject: MirrorNodeContract[]
  ): Promise<{
    erc20Contracts: ERCOutputInterface[];
    erc721Contracts: ERCOutputInterface[];
  }> {
    const erc20Contracts: ERCOutputInterface[] = [];
    const erc721Contracts: ERCOutputInterface[] = [];

    try {
      const contractResponses = await Promise.all(
        contractObject.map(({ contract_id }) =>
          contract_id
            ? contractScannerService.fetchContractObject(contract_id)
            : null
        )
      );

      contractResponses.forEach((contract) => {
        if (
          !contract ||
          !contract.bytecode ||
          !contract.contract_id ||
          !contract.evm_address ||
          !contract.runtime_bytecode
        ) {
          console.warn('Skipping contract due to missing data:', {
            contractId: contract?.contract_id,
            hasBytecode: !!contract?.bytecode,
            hasContractId: !!contract?.contract_id,
            hasEvmAddress: !!contract?.evm_address,
            hasRuntimeBytecode: !!contract?.runtime_bytecode,
          });
          return;
        }
        const contractBytecode =
          contract.runtime_bytecode === '0x'
            ? contract.bytecode
            : contract.runtime_bytecode;

        console.log(`Analyzing contract: contractId=${contract.contract_id}`);

        const sevmContract = new Contract(contractBytecode);
        const ercOutput: ERCOutputInterface = {
          address: contract.evm_address,
          contractId: contract.contract_id,
        };

        if (sevmContract.isERC(ERCID.ERC20)) {
          console.log(
            `New ERC contract detected: contractId=${contract.contract_id}, ercID: ${ERCID.ERC20}`
          );
          erc20Contracts.push(ercOutput);

          // TODO: Make calls to MN to retrieve name, symbol, decimals, totalSuply, etc.
        }
        if (sevmContract.isERC(ERCID.ERC721)) {
          console.log(
            `New ERC contract detected: contractId=${contract.contract_id}, ercID: ${ERCID.ERC721}`
          );
          erc721Contracts.push(ercOutput);

          // TODO: Make calls to MN to retrieve name, symbol, etc.
        }
      });
    } catch (error) {
      console.error('Error while analyzing contract bytecode:', error);
    }

    return { erc20Contracts, erc721Contracts };
  }
}
