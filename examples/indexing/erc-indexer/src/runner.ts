// SPDX-License-Identifier: Apache-2.0

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
    configService.getMirrorNodeUrlWeb3(),
    configService.getScanContractLimit()
  );
  const byteCodeAnalyzer = new ByteCodeAnalyzer();

  try {
    let next = await configService.resolveStartingPoint(registryGenerator);
    await processContracts(
      next,
      contractScannerService,
      byteCodeAnalyzer,
      registryGenerator,
      configService
    );
  } catch (error) {
    console.error('Error during the indexing process:', error);
  }
};

const processContracts = async (
  next: string | null,
  contractScannerService: ContractScannerService,
  byteCodeAnalyzer: ByteCodeAnalyzer,
  registryGenerator: RegistryGenerator,
  configService: ConfigService
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

    // only update registry if detectionOnly is off
    if (!configService.getDetectionOnly()) {
      // let the registry update process to run asynchronously in the background
      registryGenerator.generateErcRegistry(
        ercContracts.erc20Contracts,
        ercContracts.erc721Contracts,
        ercContracts.erc1155Contracts
      );

      registryGenerator.updateNextPointer(next);
    }
  } while (next);
};
