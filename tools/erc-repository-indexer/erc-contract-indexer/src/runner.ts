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
import { ByteCodeAnalyzer } from './services/byteCodeAnalyzer';
import { ConfigService } from './services/config';
import { ContractScannerService } from './services/contractScanner';
import { RegistryGenerator } from './services/registryGenerator';

dotenv.config();

export const ercRegistryRunner = async () => {
  const configService = new ConfigService();
  const registryGenerator = new RegistryGenerator();
  const contractScannerService = new ContractScannerService(
    configService.getMirrorNodeUrl(),
    configService.getMirrorNodeUrlWeb3()
  );
  const byteCodeAnalyzer = new ByteCodeAnalyzer();

  try {
    let next = await configService.resolveStartingPoint(registryGenerator);
    await processContracts(
      next,
      contractScannerService,
      byteCodeAnalyzer,
      registryGenerator
    );
  } catch (error) {
    console.error('Error during the indexing process:', error);
  }
};

const processContracts = async (
  next: string | null,
  contractScannerService: ContractScannerService,
  byteCodeAnalyzer: ByteCodeAnalyzer,
  registryGenerator: RegistryGenerator
) => {
  do {
    const fetchContractsResponse =
      await contractScannerService.fetchContracts(next);

    if (!fetchContractsResponse || !fetchContractsResponse.contracts.length) {
      console.warn('No contracts found.');
      return;
    }

    next = fetchContractsResponse.links.next;

    const ercContracts = await byteCodeAnalyzer.categorizeERCContracts(
      contractScannerService,
      fetchContractsResponse.contracts
    );

    // let the registry update process to run asynchronously in the background
    registryGenerator.generateErcRegistry(
      ercContracts.erc20Contracts,
      ercContracts.erc721Contracts
    );
    registryGenerator.updateNextPointer(next);
  } while (next);
};
