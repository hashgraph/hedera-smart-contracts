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
  Client,
  ContractCreateFlow,
  ContractFunctionParameters,
} from '@hashgraph/sdk';
import fs from 'fs';
import testConstants from '../utils/constants';
import OZERC20Artifacts from '../contracts/erc-20/OZERC20Mock.json';
import OZERC721Artifacts from '../contracts/erc-721/OZERC721Mock.json';
import BasicArtifacts from '../contracts/non-ercs/Basic.json';
import NodeClient from '@hashgraph/sdk/lib/client/NodeClient';

export interface ContractDeploymentRequirements {
  contractType: string;
  totalDeployments: number;
  bytecode: string;
  ercConstructorParams: ContractFunctionParameters | null;
}

export default class Helper {
  /**
   * Builds and returns an SDK client configured with the Hedera network and operator credentials.
   * @returns {Client} The configured Hedera SDK client.
   */
  static buildSdkClient(): Client {
    const HEDERA_NETWORK = process.env.HEDERA_NETWORK || '';
    const SDK_OPERATOR_ID = process.env.SDK_OPERATOR_ID || '';
    const SDK_OPERATOR_KEY = process.env.SDK_OPERATOR_KEY || '';

    const sdkClient = Client.forName(HEDERA_NETWORK).setOperator(
      SDK_OPERATOR_ID,
      SDK_OPERATOR_KEY
    );

    console.log(
      `SDK Client succesfully setup for acceptance test: network=${HEDERA_NETWORK}, operatorAccountId=${SDK_OPERATOR_ID}`
    );
    return sdkClient;
  }

  /**
   * Deploys a smart contract to the Hedera network using the provided SDK client.
   * @param {Client} sdkClient - The Hedera SDK client.
   * @param {string} bytecode - The bytecode of the smart contract to deploy.
   * @param {ContractFunctionParameters|null} params - Constructor parameters for the smart contract (optional).
   * @returns {Promise<string>} The deployed contract's Ethereum address.
   */
  static async deploySmartContractsViaSdk(
    sdkClient: Client,
    bytecode: string,
    params: ContractFunctionParameters | null
  ): Promise<string> {
    const contractCreateFlow = new ContractCreateFlow()
      .setGas(1_000_000)
      .setBytecode(bytecode);

    if (params) {
      contractCreateFlow.setConstructorParameters(params);
    }

    const txResponse = await contractCreateFlow.execute(sdkClient);
    const receipt = await txResponse.getReceipt(sdkClient);

    console.log(
      `New contract successfully deployed: contractId=${receipt.contractId}, contractEvmAddress=0x${receipt.contractId?.toSolidityAddress()}, contractEvmAddress=0x${receipt.contractId?.toSolidityAddress()}`
    );

    return `0x${receipt.contractId!.toSolidityAddress()}`;
  }

  /**
   * Reads the contents of a file from the given file path.
   * @param {string} filePath - The path to the file.
   * @returns {string} The file contents, or an empty string if the file does not exist.
   */
  static readContentsFromFile(filePath: string): string {
    if (!fs.existsSync(filePath)) {
      return '';
    }
    return fs.readFileSync(filePath, 'utf8');
  }

  /**
   * Sorts an array of Ethereum addresses in ascending order.
   * @param {string[]} addresses - An array of Ethereum addresses to sort.
   * @returns {string[]} The sorted array of addresses.
   */
  static sortAddresses(addresses: string[]): string[] {
    return addresses.sort((a, b) => {
      const diff = BigInt(a) - BigInt(b);
      return diff < 0n ? -1 : 1;
    });
  }

  /**
   * Prepares contract deployment requirements for ERC20, ERC721, and non-ERC contracts.
   * @param {number} totalErc20s - The total number of ERC20 contracts to deploy.
   * @param {number} totalErc721s - The total number of ERC721 contracts to deploy.
   * @param {number} totalNonErcs - The total number of non-ERC contracts to deploy.
   * @returns {ContractDeploymentRequirements[]} An array of contract deployment requirements.
   */
  static prepareContractDeployRequirements(
    totalErc20s: number,
    totalErc721s: number,
    totalNonErcs: number
  ): ContractDeploymentRequirements[] {
    return [
      {
        contractType: 'erc20',
        totalDeployments: totalErc20s,
        bytecode: OZERC20Artifacts.bytecode,
        ercConstructorParams: new ContractFunctionParameters()
          .addString(testConstants.ERC_CONSTRUCTOR_PARAMS.erc20.tokenName)
          .addString(testConstants.ERC_CONSTRUCTOR_PARAMS.erc20.tokenSymbol),
      },
      {
        contractType: 'erc721',
        totalDeployments: totalErc721s,
        bytecode: OZERC721Artifacts.bytecode,
        ercConstructorParams: new ContractFunctionParameters()
          .addString(testConstants.ERC_CONSTRUCTOR_PARAMS.erc721.tokenName)
          .addString(testConstants.ERC_CONSTRUCTOR_PARAMS.erc721.tokenSymbol),
      },
      {
        contractType: 'nonErc',
        totalDeployments: totalNonErcs,
        bytecode: BasicArtifacts.bytecode,
        ercConstructorParams: null,
      },
    ];
  }

  /**
   * Deploys the required contracts to the Hedera network.
   * @param {NodeClient} sdkClient - The Hedera SDK client.
   * @param {ContractDeploymentRequirements[]} contractDeploymentRequirements - An array of contract deployment requirements.
   * @returns {Promise<{erc20: string[], erc721: string[], nonErc: string[]}>} An object containing arrays of deployed contract addresses categorized by type.
   */
  static async deployRequiredContracts(
    sdkClient: NodeClient,
    contractDeploymentRequirements: ContractDeploymentRequirements[]
  ): Promise<{
    erc20: string[];
    erc721: string[];
    nonErc: string[];
  }> {
    const deployedAddresses = {
      erc20: [] as any,
      erc721: [] as any,
      nonErc: [] as any,
    };

    for (const contractObject of contractDeploymentRequirements) {
      for (let i = 0; i < contractObject.totalDeployments; i++) {
        deployedAddresses[
          contractObject.contractType as 'erc20' | 'erc721' | 'nonErc'
        ].push(
          Helper.deploySmartContractsViaSdk(
            sdkClient,
            contractObject.bytecode,
            contractObject.ercConstructorParams
          )
        );
      }
    }

    deployedAddresses.erc20 = await Promise.all(deployedAddresses.erc20);
    deployedAddresses.erc721 = await Promise.all(deployedAddresses.erc721);
    deployedAddresses.nonErc = await Promise.all(deployedAddresses.nonErc);

    deployedAddresses.erc20 = Helper.sortAddresses(deployedAddresses.erc20);
    deployedAddresses.erc721 = Helper.sortAddresses(deployedAddresses.erc721);

    return deployedAddresses;
  }
}
