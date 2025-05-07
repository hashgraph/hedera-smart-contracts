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

  /**
   * @private
   * @readonly
   * @property {string} nextPointerFilePath - The file path where the next pointer for indexing will be stored.
   */
  private readonly nextPointerFilePath: string;

  constructor() {
    this.erc20JsonFilePath = Helper.buildFilePath(
      constants.ERC_20_JSON_FILE_NAME
    );
    this.erc721JsonFilePath = Helper.buildFilePath(
      constants.ERC_721_JSON_FILE_NAME
    );
    this.nextPointerFilePath = Helper.buildFilePath(
      constants.GET_CONTRACTS_LIST_NEXT_POINTER_JSON_FILE_NAME
    );
  }

  /**
   * Updates the next pointer in a file if it is not null.
   * @param {string | null} next - The next pointer to be written to the file. If null, the file will not be updated.
   * @returns {Promise<void>} A promise that resolves when the next pointer has been successfully written to the file.
   */
  async updateNextPointer(next: string | null): Promise<void> {
    if (next) {
      await this.writeContentsToFile(this.nextPointerFilePath, next);
      console.log('Next pointer has been successfully updated to:', next);
    }
  }

  /**
   * Retrieves the next pointer from nextPointerFilePath.
   * @returns {Promise<string | null>} A promise that resolves to the next pointer if it exists, or null if the file is empty or does not exist.
   */
  async retrieveNextPointer(): Promise<string | null> {
    const fileContent = this.readContentsFromFile(this.nextPointerFilePath);
    return fileContent ? JSON.parse(fileContent) : null;
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

    if (erc20Contracts.length) {
      updatePromises.push(
        this.updateRegistry(this.erc20JsonFilePath, erc20Contracts)
      );
    }

    if (erc721Contracts.length) {
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
    const fileContent = this.readContentsFromFile(filePath);
    const existingContracts = fileContent
      ? (JSON.parse(fileContent) as ERCOutputInterface[])
      : [];

    // Create a Map to deduplicate contracts by contractId
    const contractMap = new Map(
      [...existingContracts, ...newContracts].map((contract) => [
        contract.contractId,
        contract,
      ])
    );

    // Convert Map values back to array for file writing
    const uniqueContracts = Array.from(contractMap.values());

    await this.writeContentsToFile(filePath, uniqueContracts);
    console.log(
      `Finished writing ${newContracts.length} new ERC token contracts to registry.`
    );
  }

  /**
   * Reads the contents of a registry file and returns the existing contracts.
   * If the file does not exist, an empty string is returned.
   * @param {string} filePath - The path to the registry file.
   * @returns {string} The contents of the registry file as a string, or an empty string if the file doesn't exist.
   * @private
   */
  private readContentsFromFile(filePath: string): string {
    if (!fs.existsSync(filePath)) {
      return '';
    }
    return fs.readFileSync(filePath, 'utf8');
  }

  /**
   * Writes the specified contents to a file at the given file path.
   * If the directory does not exist, it will be created recursively.
   *
   * @param {string} filePath - The path to the file where contents will be written.
   * @param {any} contents - The contents to write to the file, which will be stringified as JSON.
   * @returns {Promise<void>} A promise that resolves when the file has been successfully written.
   */
  private async writeContentsToFile(
    filePath: string,
    contents: any
  ): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(filePath, JSON.stringify(contents, null, 2));
  }
}
