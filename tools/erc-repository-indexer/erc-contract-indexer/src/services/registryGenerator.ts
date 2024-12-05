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

import fs from 'fs';
import path from 'path';
import constants from '../utils/constants';
import { ERCOutputInterface } from '../schemas/ERCRegistrySchemas';
import { Helper } from '../utils/helper';

export class RegistryGenerator {
  /**
   * @private
   * @readonly
   * @property {string} erc20JsonFilePath - The file path where ERC20 contract registry data will be stored
   */
  private readonly erc20JsonFilePath: string;

  /**
   * @private
   * @readonly
   * @property {string} erc721JsonFilePath - The file path where ERC721 contract registry data will be stored
   */
  private readonly erc721JsonFilePath: string;

  constructor() {
    this.erc20JsonFilePath = Helper.buildFilePath(
      constants.ERC_20_JSON_FILE_NAME
    );
    this.erc721JsonFilePath = Helper.buildFilePath(
      constants.ERC_721_JSON_FILE_NAME
    );
  }

  /**
   * Generates registry files for ERC20 and ERC721 contracts by updating existing registries with new contracts.
   * @param {ERCOutputInterface[]} erc20Contracts - Array of ERC20 contract interfaces to add to registry
   * @param {ERCOutputInterface[]} erc721Contracts - Array of ERC721 contract interfaces to add to registry
   * @returns {Promise<void>} Promise that resolves when registry files are updated
   */
  async generateErcRegistry(
    erc20Contracts: ERCOutputInterface[],
    erc721Contracts: ERCOutputInterface[]
  ): Promise<void> {
    const updatePromises = [];

    if (erc20Contracts.length > 0) {
      updatePromises.push(
        this.updateRegistry(this.erc20JsonFilePath, erc20Contracts)
      );
    }

    if (erc721Contracts.length > 0) {
      updatePromises.push(
        this.updateRegistry(this.erc721JsonFilePath, erc721Contracts)
      );
    }

    // Wait for all updates to complete in parallel
    await Promise.all(updatePromises);
  }

  /**
   * Updates a registry file with new contracts, removing duplicates if any.
   * @param {string} filePath - Path to the registry file
   * @param {ERCOutputInterface[]} newContracts - New contracts to add to registry
   * @returns {Promise<void>} Promise that resolves when registry is updated
   * @private
   */
  private async updateRegistry(
    filePath: string,
    newContracts: ERCOutputInterface[]
  ): Promise<void> {
    console.log('Pushing new ERC token contracts to registry...');

    const existingContracts = this.readExistingContracts(filePath);

    // Create a Map to deduplicate contracts by contractId
    const contractMap = new Map(
      [...existingContracts, ...newContracts].map((contract) => [
        contract.contractId,
        contract,
      ])
    );

    // Convert Map values back to array for file writing
    const uniqueContracts = Array.from(contractMap.values());

    await this.writeContractsToFile(filePath, uniqueContracts);
  }

  /**
   * Reads existing contracts from a registry file.
   * @param {string} filePath - Path to the registry file
   * @returns {ERCOutputInterface[]} Array of existing contracts, or empty array if file doesn't exist
   * @private
   */
  private readExistingContracts(filePath: string): ERCOutputInterface[] {
    // Cache file read result to avoid multiple disk reads
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return fileContent ? JSON.parse(fileContent) : [];
  }

  /**
   * Writes contracts to a registry file.
   * @param {string} filePath - Path to the registry file
   * @param {ERCOutputInterface[]} contracts - Contracts to write to file
   * @returns {Promise<void>} Promise that resolves when file is written
   * @private
   */
  private async writeContractsToFile(
    filePath: string,
    contracts: ERCOutputInterface[]
  ): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(filePath, JSON.stringify(contracts, null, 2));
    console.log('Finish pushing new ERC token contracts to registry.');
  }
}
