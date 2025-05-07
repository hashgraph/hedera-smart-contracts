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
import constants from '../utils/constants';
import { ethers } from 'ethers';
import {
  ERC20OutputInterface,
  ERC721OutputInterface,
  ERCOutputInterface,
  ERCTokenInfoSelectors,
} from '../schemas/ERCRegistrySchemas';
import {
  MirrorNodeContract,
  MirrorNodeContractResponse,
} from '../schemas/MirrorNodeSchemas';

enum ERCID {
  ERC20 = 'ERC20',
  ERC721 = 'ERC721',
}

export class ByteCodeAnalyzer {
  /**
   * Analyzes bytecode, detects and categorizes contracts into ERC20 and ERC721 types based on their bytecode.
   *
   * This method fetches contract bytecode for the provided contract objects and categorizes them into ERC20 and ERC721 contracts
   * based on their bytecode analysis. It returns an object containing arrays of categorized contracts.
   *
   * @param {ContractScannerService} contractScannerService - The service used to fetch contract bytecode.
   * @param {MirrorNodeContract[]} contractObject - An array of contract objects to categorize.
   * @returns {Promise<{erc20Contracts: ERCOutputInterface[], erc721Contracts: ERCOutputInterface[]}>}
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

      for (const contract of contractResponses) {
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
          continue;
        }

        const contractBytecode =
          contract.runtime_bytecode === '0x'
            ? contract.bytecode
            : contract.runtime_bytecode;

        if (contractBytecode === '0x') {
          console.log(
            `Skipping analyzing contract due to empty bytecode: contractId=${contract.contract_id}`
          );
          continue;
        }

        console.log(`Analyzing contract: contractId=${contract.contract_id}`);

        const sevmContract = new Contract(contractBytecode);

        if (sevmContract.isERC(ERCID.ERC20)) {
          const ercTokenInfoObject = await this.analyzeErcContract(
            ERCID.ERC20,
            contract,
            contractScannerService,
            constants.ERC20_TOKEN_INFO_SELECTORS
          );
          if (ercTokenInfoObject) {
            erc20Contracts.push(ercTokenInfoObject);
          }
        }

        if (sevmContract.isERC(ERCID.ERC721)) {
          const ercTokenInfoObject = await this.analyzeErcContract(
            ERCID.ERC721,
            contract,
            contractScannerService,
            constants.ERC721_TOKEN_INFO_SELECTORS
          );
          if (ercTokenInfoObject) {
            erc721Contracts.push(ercTokenInfoObject);
          }
        }
      }
    } catch (error) {
      console.error('Error while analyzing contract bytecode:', error);
    }

    return { erc20Contracts, erc721Contracts };
  }

  /**
   * Analyzes a specific ERC contract to extract token information.
   *
   * This method logs the detection of a new ERC contract and attempts to retrieve its token information
   * using the provided contract scanner service. If successful, it returns the token information object.
   *
   * @param {ERCID} ercId - The type of ERC contract (ERC20 or ERC721).
   * @param {MirrorNodeContractResponse} contract - The contract object containing relevant data.
   * @param {ContractScannerService} contractScannerService - The service used to fetch contract token information.
   * @param {ERCTokenInfoSelectors[]} ercTokenInfoSelectors - An array of selectors for token information.
   * @returns {Promise<ERC20OutputInterface | ERC721OutputInterface | null>} The token information object or null if not found.
   */
  private async analyzeErcContract(
    ercId: ERCID,
    contract: MirrorNodeContractResponse,
    contractScannerService: ContractScannerService,
    ercTokenInfoSelectors: ERCTokenInfoSelectors[]
  ): Promise<ERC20OutputInterface | ERC721OutputInterface | null> {
    console.log(
      `New ERC contract detected: contractId=${contract.contract_id}, ercID: ${ercId}`
    );

    try {
      return await this.getErcTokenInfo(
        contractScannerService,
        contract,
        ercTokenInfoSelectors
      );
    } catch (error: any) {
      console.warn(error.errMessage);
      console.log(`Skip ERC contract: contractId=${contract.contract_id}`);
      return null;
    }
  }

  /**
   * Retrieves token information for a given ERC contract by making contract call requests.
   *
   * This method constructs and sends contract call requests based on the provided token info selectors,
   * decodes the responses, and returns an object containing the token information.
   *
   * @param {ContractScannerService} contractScannerService - The service used to fetch contract token information.
   * @param {MirrorNodeContractResponse} contract - The contract object containing relevant data.
   * @param {ERCTokenInfoSelectors[]} ercTokenInfoSelectors - An array of selectors for token information.
   * @returns {Promise<ERC20OutputInterface | ERC721OutputInterface>} The token information object.
   * @throws {Error} If a contract call fails despite passing signature matching.
   */
  private async getErcTokenInfo(
    contractScannerService: ContractScannerService,
    contract: MirrorNodeContractResponse,
    ercTokenInfoSelectors: ERCTokenInfoSelectors[]
  ): Promise<ERC20OutputInterface | ERC721OutputInterface> {
    const contractCallPromises = ercTokenInfoSelectors.map(
      ({ type, field, sighash }) =>
        contractScannerService
          .contractCallRequest({
            data: sighash,
            to: contract.evm_address,
          })
          .then((tokenInfoResponse) => ({
            type,
            field,
            sighash,
            tokenInfoResponse,
          }))
    );
    const contractCallResponses = await Promise.all(contractCallPromises);

    const ercTokenInfoObject = contractCallResponses.reduce<
      Record<string, string | number>
    >((ercTokenInfoObject, { type, field, sighash, tokenInfoResponse }) => {
      if (!tokenInfoResponse) {
        const errMessage = `ERC contract passes signature matching but fails contract call: contractId=${contract.contract_id}, contractAddress=${contract.evm_address}, function_selector=${sighash}`;
        const error = new Error(errMessage);
        (error as any).errMessage = errMessage;
        throw error;
      }

      const decodedTokenInfo = ethers.AbiCoder.defaultAbiCoder().decode(
        [type],
        tokenInfoResponse
      )[0];

      // `decodedTokenInfo` can potentially be one of two types: string or BigInt.
      // Since the goal is to write the data to disk, convert BigInt to a Number,
      // as the filesystem (fs) cannot directly handle BigInt values.
      ercTokenInfoObject[field] =
        type === 'string' ? decodedTokenInfo : Number(decodedTokenInfo);

      return ercTokenInfoObject;
    }, {});

    return {
      contractId: contract.contract_id!,
      address: contract.evm_address,
      ...ercTokenInfoObject,
    } as ERC20OutputInterface | ERC721OutputInterface;
  }
}
