// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import path from 'path';
import constants from '../utils/constants';
import { ERCOutputInterface } from '../schemas/ERCRegistrySchemas';
import { Helper } from '../utils/helper';
import _ from 'lodash';

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
   * @property {string} erc1155JsonFilePath - The file path where ERC1155 contract registry data will be stored
   */
  private readonly erc1155JsonFilePath: string;

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
    this.erc1155JsonFilePath = Helper.buildFilePath(
      constants.ERC_1155_JSON_FILE_NAME
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
   * Generates registry files for ERC20, ERC721, and ERC1155 contracts by updating existing registries with new contracts.
   * @param {ERCOutputInterface[]} erc20Contracts - Array of ERC20 contract interfaces to add to registry
   * @param {ERCOutputInterface[]} erc721Contracts - Array of ERC721 contract interfaces to add to registry
   * @param {ERCOutputInterface[]} erc1155Contracts - Array of ERC1155 contract interfaces to add to registry
   * @returns {Promise<void>} Promise that resolves when registry files are updated
   */
  async generateErcRegistry(
    erc20Contracts: ERCOutputInterface[],
    erc721Contracts: ERCOutputInterface[],
    erc1155Contracts: ERCOutputInterface[]
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

    if (erc1155Contracts.length) {
      updatePromises.push(
        this.updateRegistry(this.erc1155JsonFilePath, erc1155Contracts)
      );
    }

    // Wait for all updates to complete in parallel
    await Promise.all(updatePromises);
  }

  /**
   * Updates a registry file with new contracts by merging them with existing contracts,
   * ensuring the registry remains sorted and free of duplicates.
   *
   * @param {string} filePath - The file path to the registry file.
   * @param {ERCOutputInterface[]} newContracts - The new contracts to add to the registry.
   * @returns {Promise<void>} - A promise that resolves once the registry is successfully updated.
   *
   * @private
   */
  private async updateRegistry(
    filePath: string,
    newContracts: ERCOutputInterface[]
  ): Promise<void> {
    let uniqueContracts: ERCOutputInterface[] = [];
    const fileContent = this.readContentsFromFile(filePath);
    const existingContracts = fileContent
      ? (JSON.parse(fileContent) as ERCOutputInterface[])
      : [];

    if (!existingContracts.length) {
      uniqueContracts = newContracts;
    } else if (
      // Since both arrays are sorted in ascending order, if the `contractId` of the last item in `existingContracts`
      // is less than the `contractId` of the first item in `newContracts`, just merged the contracts and remove dups without sorting.
      existingContracts[existingContracts.length - 1].contractId <
      newContracts[0].contractId
    ) {
      uniqueContracts = _.chain([...existingContracts, ...newContracts]) // merge contracts
        .uniqBy('contractId') // Remove duplicates based on contractId
        .value(); // Extract the final array
    } else {
      uniqueContracts = _.chain([...existingContracts, ...newContracts]) // merge contracts
        .uniqBy('contractId') // Remove duplicates based on contractId
        .sortBy((contract) => Number(contract.contractId.split('.')[2])) // Sort by the numeric value of contractId
        .value(); // Extract the final array
    }

    await this.writeContentsToFile(filePath, uniqueContracts);

    // Convert Map values back to array for file writing

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
