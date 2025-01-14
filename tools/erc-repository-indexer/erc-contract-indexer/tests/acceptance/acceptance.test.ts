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
import dotenv from 'dotenv';
dotenv.config();
import testHelper from './utils/helper';
import testConstants from './utils/constants';
import { ercRegistryRunner } from '../../src/runner';
import { Helper } from '../../src/utils/helper';
import constants from '../../src/utils/constants';
import NodeClient from '@hashgraph/sdk/lib/client/NodeClient';

describe('ERC Registry Acceptance Test', () => {
  // production networks take more time to finish deployments
  jest.setTimeout(60000);

  const totalExpectedDeploymentsForEachContractType = 1;

  const erc20JsonFilePath = Helper.buildFilePath(
    constants.ERC_20_JSON_FILE_NAME
  );
  const erc721JsonFilePath = Helper.buildFilePath(
    constants.ERC_721_JSON_FILE_NAME
  );
  const erc1155JsonFilePath = Helper.buildFilePath(
    constants.ERC_1155_JSON_FILE_NAME
  );

  let deployedAddresses = {
    erc20: [] as string[],
    erc721: [] as string[],
    erc1155: [] as string[],
    nonErc: [] as string[],
    minimalErc20: [] as string[],
    minimalErc721: [] as string[],
  };
  let sdkClient: NodeClient | null = null;

  beforeEach(async () => {
    const contractDeploymentRequirements =
      testHelper.prepareContractDeployRequirements(
        totalExpectedDeploymentsForEachContractType
      );
    sdkClient = testHelper.buildSdkClient();
    deployedAddresses = await testHelper.deployRequiredContracts(
      sdkClient,
      contractDeploymentRequirements
    );

    // Sort all contract addresses to identify the earliest deployed contract
    const allDeployedAddresses = testHelper.sortAddresses([
      ...deployedAddresses.erc20,
      ...deployedAddresses.minimalErc20,
      ...deployedAddresses.erc721,
      ...deployedAddresses.minimalErc721,
      ...deployedAddresses.nonErc,
      ...deployedAddresses.erc1155,
    ]);

    const totalExpectedDeployments =
      totalExpectedDeploymentsForEachContractType *
      contractDeploymentRequirements.length;

    expect(allDeployedAddresses.length).toEqual(totalExpectedDeployments);

    // Start the indexing process from the earliest contract in the batch, avoiding indexing from genesis.
    process.env.STARTING_POINT = allDeployedAddresses[0];
  });

  afterEach(() => {
    // Close or clean up any resources after all test
    if (sdkClient) {
      sdkClient.close(); // Or any appropriate cleanup method
    }
  });

  it('should execute the main ERC registry runner method and correctly record the number of detected ERC contracts in registry', async () => {
    // run the actual tool to start indexing the network and write to registry
    await ercRegistryRunner().then();

    // wait for 500ms for all the asynchronous tasks to finish
    await new Promise((resolve) => setTimeout(resolve, 500));

    // retrieve the newest erc contracts added to the registry
    const latestErc20sWrittenToRegistry = JSON.parse(
      testHelper.readContentsFromFile(erc20JsonFilePath)
    ).slice(totalExpectedDeploymentsForEachContractType * 2 * -1);
    const latestErc721sWrittenToRegistry = JSON.parse(
      testHelper.readContentsFromFile(erc721JsonFilePath)
    ).slice(totalExpectedDeploymentsForEachContractType * 2 * -1);

    const latestErc1155sWrittenToRegistry = JSON.parse(
      testHelper.readContentsFromFile(erc1155JsonFilePath)
    ).slice(totalExpectedDeploymentsForEachContractType * -1);

    // assertion
    latestErc20sWrittenToRegistry.forEach((object: any) => {
      expect(
        deployedAddresses.erc20.includes(object.address) ||
          deployedAddresses.minimalErc20.includes(object.address)
      ).toBe(true);

      if (deployedAddresses.erc20.includes(object.address)) {
        expect(object.name).toEqual(
          testConstants.ERC_CONSTRUCTOR_PARAMS.erc20.tokenName
        );
        expect(object.symbol).toEqual(
          testConstants.ERC_CONSTRUCTOR_PARAMS.erc20.tokenSymbol
        );
      }

      if (deployedAddresses.minimalErc20.includes(object.address)) {
        expect(object.name).toBeNull;
        expect(object.symbol).toBeNull;
        expect(object.decimals).toBeNull;
        expect(object.totalSupply).toBeNull;
      }
    });

    latestErc721sWrittenToRegistry.forEach((object: any) => {
      expect(
        deployedAddresses.erc721.includes(object.address) ||
          deployedAddresses.minimalErc721.includes(object.address)
      ).toBe(true);

      if (deployedAddresses.erc721.includes(object.address)) {
        expect(object.name).toEqual(
          testConstants.ERC_CONSTRUCTOR_PARAMS.erc721.tokenName
        );
        expect(object.symbol).toEqual(
          testConstants.ERC_CONSTRUCTOR_PARAMS.erc721.tokenSymbol
        );
      }

      if (deployedAddresses.minimalErc721.includes(object.address)) {
        expect(object.name).toBeNull;
        expect(object.symbol).toBeNull;
      }
    });

    latestErc1155sWrittenToRegistry.forEach((object: any) => {
      expect(deployedAddresses.erc1155.includes(object.address)).toBe(true);
    });
  });

  it('should not update registry when ENABLE_DETECTION_ONLY is set to true', async () => {
    // Enable detection-only mode
    process.env.ENABLE_DETECTION_ONLY = 'true';

    // Backup current registry
    const currentErc20Registry = JSON.parse(
      testHelper.readContentsFromFile(erc20JsonFilePath) || '[]'
    );
    const currentErc721Registry = JSON.parse(
      testHelper.readContentsFromFile(erc721JsonFilePath) || '[]'
    );

    const currentErc1155Registry = JSON.parse(
      testHelper.readContentsFromFile(erc1155JsonFilePath) || '[]'
    );

    // Run the tool to index the network and potentially update the registry
    await ercRegistryRunner();

    // Wait for asynchronous tasks to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Read updated registry
    const updatedErc20Registry = JSON.parse(
      testHelper.readContentsFromFile(erc20JsonFilePath) || '[]'
    );
    const updatedErc721Registry = JSON.parse(
      testHelper.readContentsFromFile(erc721JsonFilePath) || '[]'
    );

    const updatedErc1155Registry = JSON.parse(
      testHelper.readContentsFromFile(erc1155JsonFilePath) || '[]'
    );

    // Verify that the registry was not updated
    expect(updatedErc20Registry).toEqual(currentErc20Registry);
    expect(updatedErc721Registry).toEqual(currentErc721Registry);
    expect(updatedErc1155Registry).toEqual(currentErc1155Registry);
  });
});
