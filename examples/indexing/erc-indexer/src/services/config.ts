// SPDX-License-Identifier: Apache-2.0

import constants from '../utils/constants';
import { ContractScannerService } from './contractScanner';
import { Helper } from '../utils/helper';
import { RegistryGenerator } from './registryGenerator';

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
   * @property {string} mirrorNodeUrlWeb3 - The URL for the Hedera Mirror Node Web3Module API.
   */
  private readonly mirrorNodeUrlWeb3: string;

  /**
   * @private
   * @readonly
   * @property {string} startingPoint - The starting point for indexing, which can be a contract ID or a pagination pointer.
   */
  private readonly startingPoint: string;

  /**
   * @private
   * @readonly
   * @property {boolean} detectionOnly - A flag indicating whether detection-only mode is enabled.
   * If `true`, only contract detection occurs; if `false`, registry updates are also performed.
   */
  private readonly detectionOnly: boolean;

  /**
   * @private
   * @readonly
   * @property {number} scanContractLimit - The maximum number of contracts to scan per operation.
   */
  private readonly scanContractLimit: number;

  constructor() {
    this.network = process.env.HEDERA_NETWORK || '';
    this.mirrorNodeUrl = process.env.MIRROR_NODE_URL || '';
    this.mirrorNodeUrlWeb3 = process.env.MIRROR_NODE_URL_WEB3 || '';
    this.startingPoint = process.env.STARTING_POINT || '';
    this.detectionOnly = process.env.ENABLE_DETECTION_ONLY === 'true';
    this.scanContractLimit = process.env.SCAN_CONTRACT_LIMIT
      ? parseInt(process.env.SCAN_CONTRACT_LIMIT)
      : 100;
    this.validateConfigs();

    console.log(
      `Indexing process initiated: network=${this.network}, mirrorNodeUrl=${this.mirrorNodeUrl}, mirrorNodeUrlWeb3=${this.mirrorNodeUrlWeb3}, detectionOnly=${this.detectionOnly}, scanContractLimit=${this.scanContractLimit}`
    );
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

    if (constants.PRODUCTION_NETWORKS.includes(this.network)) {
      if (
        !this.mirrorNodeUrl ||
        !constants.MIRROR_NODE_URL_REGEX.test(this.mirrorNodeUrl)
      ) {
        throw new Error(
          `MIRROR_NODE_URL Is Not Properly Configured: mirrorNodeUrl=${this.mirrorNodeUrl}`
        );
      }
    }

    if (
      this.startingPoint &&
      !constants.STARTING_POINT_REGEX.test(this.startingPoint)
    ) {
      throw new Error(
        `STARTING_POINT Is Not Properly Configured: startingPoint=${this.startingPoint}`
      );
    }

    if (
      isNaN(this.scanContractLimit) ||
      this.scanContractLimit <= 0 ||
      this.scanContractLimit > 100
    ) {
      throw new Error(
        `SCAN_CONTRACT_LIMIT Is Not Properly Configured (should be a number from 1-100): scanContractLimit=${this.scanContractLimit}`
      );
    }
  }

  /**
   * Determines the starting point for indexing based on the configuration settings.
   * The method prioritizes the STARTING_POINT if it is defined in the configuration.
   * If STARTING_POINT is not defined, it checks for a stored next pointer on disk; if found, it uses that.
   * If neither is available, the indexing will start from the genesis block.
   *
   * @param {RegistryGenerator} registryGenerator - An instance of the RegistryGenerator used to retrieve the next pointer from storage.
   * @returns {Promise<string | null>} A promise that resolves to the starting point string, or null if no valid starting point is set.
   */
  async resolveStartingPoint(
    registryGenerator: RegistryGenerator
  ): Promise<string | null> {
    if (constants.GET_CONTRACTS_LISTS_NEXT_REGEX.test(this.startingPoint)) {
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

    const startingPointFromStorage =
      await registryGenerator.retrieveNextPointer();

    if (startingPointFromStorage) {
      console.log(
        `Start indexing the network from storage next pointer=${startingPointFromStorage}`
      );
      return startingPointFromStorage;
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
    const contractScanner = new ContractScannerService(
      this.mirrorNodeUrl,
      this.mirrorNodeUrlWeb3,
      this.scanContractLimit
    );
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

  /**
   * Gets the URL of the mirror node web3module.
   * @returns {string} The mirror node URL web3module.
   */
  getMirrorNodeUrlWeb3(): string {
    return this.mirrorNodeUrlWeb3;
  }

  /**
   * Gets the current status of the detection-only mode.
   * @returns {boolean} `true` if detection-only mode is enabled, `false` otherwise.
   */
  getDetectionOnly(): boolean {
    return this.detectionOnly;
  }

  /**
   * Retrieves the maximum number of contracts to scan per operation.
   * @returns {number} The configured contract scan limit.
   */
  getScanContractLimit(): number {
    return this.scanContractLimit;
  }
}
