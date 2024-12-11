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

import axios, { AxiosInstance } from 'axios';
import path from 'path';
import constants from './constants';

export class Helper {
  /**
   * Constructs the file path for the specified file name based on the current Hedera network.
   * The network is determined by the HEDERA_NETWORK environment variable, defaulting to 'previewnet'.
   *
   * @param {string} fileName - The name of the file for which to build the path.
   * @returns {string} The constructed file path.
   */
  static buildFilePath(fileName: string): string {
    const network = process.env.HEDERA_NETWORK || 'local-node';
    return path.join(__dirname, '../../erc-registry', network, fileName);
  }

  /**
   * Constructs a URL based on the provided `next` parameter. If `next` is null,
   * it returns a default URL with query parameters for fetching contracts.
   *
   * @param {string | null} next - The pagination token for the next set of results, or null to use default endpoint
   * @returns {string} The complete URL to query the mirror node API
   */
  static buildUrl(next: string | null): string {
    return next
      ? next
      : `${constants.GET_CONTRACT_ENDPOINT}?limit=100&order=asc`;
  }

  /**
   * Creates a promise that resolves after the specified delay
   * @param {number} ms - The delay in milliseconds
   * @returns {Promise<void>} A promise that resolves after the specified delay
   */
  static wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Builds a starting point URL for fetching contracts from the mirror node API.
   * The URL is constructed to retrieve contracts with IDs greater than or equal to the specified contract ID.
   *
   * @param {string} contractId - The contract ID to use as a reference for the starting point.
   * @returns {string} The constructed starting point URL for the mirror node API.
   */
  static buildStartingPoint(contractId: string): string {
    return `/api/v1/contracts?limit=100&order=asc&contract.id=gte:${contractId}`;
  }

  /**
   * Creates and returns Axios client instances for interacting with the Hedera Mirror Node REST API
   * and Web3-compatible API.
   *
   * @param {string} mirrorNodeUrl - The base URL for the Hedera Mirror Node REST API.
   * @param {string} mirrorNodeUrlWeb3 - The base URL for the Hedera Mirror Node Web3-compatible API.
   *                                     If not provided, defaults to the value of `mirrorNodeUrl`.
   * @returns {{ mirrorNodeRestClient: AxiosInstance, mirrorNodeWeb3Client: AxiosInstance }}
   */
  static buildAxiosClient(
    mirrorNodeUrl: string,
    mirrorNodeUrlWeb3: string
  ): {
    mirrorNodeRestClient: AxiosInstance;
    mirrorNodeWeb3Client: AxiosInstance;
  } {
    return {
      mirrorNodeRestClient: axios.create({ baseURL: mirrorNodeUrl }),
      mirrorNodeWeb3Client: axios.create({
        baseURL: mirrorNodeUrlWeb3 || mirrorNodeUrl,
      }),
    };
  }
}
