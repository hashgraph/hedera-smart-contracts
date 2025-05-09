// SPDX-License-Identifier: Apache-2.0

import {
  Client,
  ContractCreateFlow,
  ContractFunctionParameters,
} from '@hashgraph/sdk';
import fs from 'fs';
import testConstants from '../utils/constants';
import OZERC20Artifacts from '../contracts/erc-20/OZERC20Mock.json';
import MinimalOZERC20Artifacts from '../contracts/erc-20/MinimalERC20.json';
import OZERC721Artifacts from '../contracts/erc-721/OZERC721Mock.json';
import MinimalOZERC721Artifacts from '../contracts/erc-721/MinimalERC721.json';
import OZERC1155Artifacts from '../contracts/erc-1155/ERC1155Mock.json';
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
    params: ContractFunctionParameters | null,
    contractType: string
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
      `New contract successfully deployed: contractId=${receipt.contractId}, contractType=${contractType}, contractEvmAddress=0x${receipt.contractId?.toSolidityAddress()}, contractEvmAddress=0x${receipt.contractId?.toSolidityAddress()}`
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
   * @param {number} totalExpectedDeploymentsForEachContractType - The total expected deployments for each contract type
   * @returns {ContractDeploymentRequirements[]} An array of contract deployment requirements.
   */
  static prepareContractDeployRequirements(
    totalExpectedDeploymentsForEachContractType: number
  ): ContractDeploymentRequirements[] {
    return [
      {
        contractType: 'erc20',
        totalDeployments: totalExpectedDeploymentsForEachContractType,
        bytecode: OZERC20Artifacts.bytecode,
        ercConstructorParams: new ContractFunctionParameters()
          .addString(testConstants.ERC_CONSTRUCTOR_PARAMS.erc20.tokenName)
          .addString(testConstants.ERC_CONSTRUCTOR_PARAMS.erc20.tokenSymbol),
      },
      {
        contractType: 'erc721',
        totalDeployments: totalExpectedDeploymentsForEachContractType,
        bytecode: OZERC721Artifacts.bytecode,
        ercConstructorParams: new ContractFunctionParameters()
          .addString(testConstants.ERC_CONSTRUCTOR_PARAMS.erc721.tokenName)
          .addString(testConstants.ERC_CONSTRUCTOR_PARAMS.erc721.tokenSymbol),
      },
      {
        contractType: 'minimalErc20',
        totalDeployments: totalExpectedDeploymentsForEachContractType,
        bytecode: MinimalOZERC20Artifacts.bytecode,
        ercConstructorParams: null,
      },
      {
        contractType: 'minimalErc721',
        totalDeployments: totalExpectedDeploymentsForEachContractType,
        bytecode: MinimalOZERC721Artifacts.bytecode,
        ercConstructorParams: null,
      },
      {
        contractType: 'erc1155',
        totalDeployments: totalExpectedDeploymentsForEachContractType,
        bytecode: OZERC1155Artifacts.bytecode,
        ercConstructorParams: new ContractFunctionParameters().addString(
          testConstants.ERC_CONSTRUCTOR_PARAMS.erc1155.tokenUri
        ),
      },
      {
        contractType: 'nonErc',
        totalDeployments: totalExpectedDeploymentsForEachContractType,
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
    erc1155: string[];
    nonErc: string[];
    minimalErc20: string[];
    minimalErc721: string[];
  }> {
    const deployedAddresses = {
      erc20: [] as any,
      minimalErc20: [] as any,
      erc721: [] as any,
      minimalErc721: [] as any,
      nonErc: [] as any,
      erc1155: [] as any,
    };

    for (const contractObject of contractDeploymentRequirements) {
      for (let i = 0; i < contractObject.totalDeployments; i++) {
        deployedAddresses[
          contractObject.contractType as
            | 'erc20'
            | 'minimalErc20'
            | 'erc721'
            | 'minimalErc721'
            | 'nonErc'
            | 'erc1155'
        ].push(
          Helper.deploySmartContractsViaSdk(
            sdkClient,
            contractObject.bytecode,
            contractObject.ercConstructorParams,
            contractObject.contractType
          )
        );
      }
    }

    deployedAddresses.erc20 = await Promise.all(deployedAddresses.erc20);
    deployedAddresses.erc721 = await Promise.all(deployedAddresses.erc721);
    deployedAddresses.erc1155 = await Promise.all(deployedAddresses.erc1155);
    deployedAddresses.nonErc = await Promise.all(deployedAddresses.nonErc);
    deployedAddresses.minimalErc20 = await Promise.all(
      deployedAddresses.minimalErc20
    );
    deployedAddresses.minimalErc721 = await Promise.all(
      deployedAddresses.minimalErc721
    );

    await new Promise((r) => setTimeout(r, 500));

    return deployedAddresses;
  }
}
