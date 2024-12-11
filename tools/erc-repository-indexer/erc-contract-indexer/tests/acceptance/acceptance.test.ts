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

  const totalExpectedNonERCContracts = 3;
  const totalExpectedERC20Contracts = 6;
  const totalExpectedERC721Contracts = 9;
  const erc20JsonFilePath = Helper.buildFilePath(
    constants.ERC_20_JSON_FILE_NAME
  );
  const erc721JsonFilePath = Helper.buildFilePath(
    constants.ERC_721_JSON_FILE_NAME
  );

  let deployedAddresses = {
    erc20: [] as string[],
    erc721: [] as string[],
    nonErc: [] as string[],
  };
  let sdkClient: NodeClient | null = null;

  beforeAll(async () => {
    const contractDeploymentRequirements =
      testHelper.prepareContractDeployRequirements(
        totalExpectedERC20Contracts,
        totalExpectedERC721Contracts,
        totalExpectedNonERCContracts
      );
    sdkClient = testHelper.buildSdkClient();
    deployedAddresses = await testHelper.deployRequiredContracts(
      sdkClient,
      contractDeploymentRequirements
    );
    // Sort all contract addresses to identify the earliest deployed contract
    const allDeployedAddresses = testHelper.sortAddresses([
      ...deployedAddresses.erc20,
      ...deployedAddresses.erc721,
      ...deployedAddresses.nonErc,
    ]);
    const totalExpectedDeployments =
      totalExpectedNonERCContracts +
      totalExpectedERC20Contracts +
      totalExpectedERC721Contracts;
    expect(allDeployedAddresses.length).toEqual(totalExpectedDeployments);
    // Start the indexing process from the earliest contract in the batch, avoiding indexing from genesis.
    process.env.STARTING_POINT = allDeployedAddresses[0];
  });

  afterAll(() => {
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
    ).slice(totalExpectedERC20Contracts * -1);
    const latestErc721sWrittenToRegistry = JSON.parse(
      testHelper.readContentsFromFile(erc721JsonFilePath)
    ).slice(totalExpectedERC721Contracts * -1);
    // assertion
    latestErc20sWrittenToRegistry.forEach((object: any, index: number) => {
      expect(object.address).toEqual(deployedAddresses.erc20[index]);
      expect(object.name).toEqual(
        testConstants.ERC_CONSTRUCTOR_PARAMS.erc20.tokenName
      );
      expect(object.symbol).toEqual(
        testConstants.ERC_CONSTRUCTOR_PARAMS.erc20.tokenSymbol
      );
    });
    latestErc721sWrittenToRegistry.forEach((object: any, index: number) => {
      expect(object.address).toEqual(deployedAddresses.erc721[index]);
      expect(object.name).toEqual(
        testConstants.ERC_CONSTRUCTOR_PARAMS.erc721.tokenName
      );
      expect(object.symbol).toEqual(
        testConstants.ERC_CONSTRUCTOR_PARAMS.erc721.tokenSymbol
      );
    });
  });
});
