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

import constants from '../utils/constants';
import { ContractScannerService } from './contractScanner';
import { Helper } from '../utils/helper';

export class ConfigService {
  /**
   * @private
   * @readonly
   * @property {string} network - The network identifier for the Hedera network (e.g., previewnet, testnet, mainnet).
   */
  private readonly network: string;

  /**
   * @private
   * @readonly
   * @property {string} mirrorNodeUrl - The URL for the Hedera Mirror Node API.
   */
  private readonly mirrorNodeUrl: string;

  /**
   * @private
   * @readonly
   * @property {string} startingPoint - The starting point for indexing, which can be a contract ID or a pagination pointer.
   */
  private readonly startingPoint: string;

  constructor() {
    this.network = process.env.HEDERA_NETWORK || '';
    this.mirrorNodeUrl = process.env.MIRROR_NODE_URL || '';
    this.startingPoint = process.env.STARTING_POINT || '';
    this.validateConfigs();

    console.log(`Indexing process initiated. Target network: ${this.network}`);
  }

  /**
   * Validates the configuration values for network and starting point.
   * Throws an error if the configurations are invalid.
   * @throws {Error} If HEDERA_NETWORK or STARTING_POINT is not properly configured.
   */
  private validateConfigs(): void {
    if (!this.network || !constants.NETWORK_REGEX.test(this.network)) {
      throw new Error(
        `HEDERA_NETWORK Is Not Properly Configured: network=${this.network}`
      );
    }

    if (
      !this.mirrorNodeUrl ||
      !constants.MIRROR_NODE_URL_REGEX.test(this.mirrorNodeUrl)
    ) {
      throw new Error(
        `MIRROR_NODE_URL Is Not Properly Configured: mirrorNodeUrl=${this.mirrorNodeUrl}`
      );
    }

    if (
      this.startingPoint &&
      !constants.STARTING_POINT_REGEX.test(this.startingPoint)
    ) {
      throw new Error(
        `STARTING_POINT Is Not Properly Configured: startingPoint=${this.startingPoint}`
      );
    }
  }

  /**
   * Resolves the starting point for indexing based on the configuration.
   * @returns {Promise<string | null>} A promise that resolves to the starting point string or null if not set.
   */
  async resolveStartingPoint(): Promise<string | null> {
    if (constants.NEXT_POINTER_REGEX.test(this.startingPoint)) {
      console.log(
        `Start indexing the network from next_pointer=${this.startingPoint}`
      );
      return this.startingPoint;
    }

    if (constants.HEDERA_CONTRACT_ID_REGEX.test(this.startingPoint)) {
      console.log(
        `Start indexing the network from contractId=${this.startingPoint}`
      );
      return Helper.buildStartingPoint(this.startingPoint);
    }

    if (constants.EVM_ADDRESS_REGEX.test(this.startingPoint)) {
      return this.resolveFromEvmAddress();
    }

    console.log('Start indexing the network from genesis');
    return null;
  }

  /**
   * Resolves the starting point from an EVM address by fetching the detailed contract object.
   * @returns {Promise<string>} A promise that resolves to the starting point string.
   * @throws {Error} If the contract is not found.
   */
  private async resolveFromEvmAddress(): Promise<string> {
    const contractScanner = new ContractScannerService(this.network);
    const contractResponse = await contractScanner.fetchContractObject(
      this.startingPoint
    );

    if (!contractResponse?.contract_id) {
      throw new Error(
        `Resource Not Found: startingPoint=${this.startingPoint}`
      );
    }

    console.log(
      `Start indexing the network from contractAddress=${this.startingPoint} (${contractResponse.contract_id})`
    );
    return Helper.buildStartingPoint(contractResponse.contract_id);
  }

  /**
   * Gets the configured network.
   * @returns {string} The network string.
   */
  getNetwork(): string {
    return this.network;
  }

  /**
   * Gets the URL of the mirror node.
   * @returns {string} The mirror node URL.
   */
  getMirrorNodeUrl(): string {
    return this.mirrorNodeUrl;
  }
}
