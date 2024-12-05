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
    const network = process.env.HEDERA_NETWORK || 'previewnet';
    return path.join(__dirname, '../../erc-registry', network, fileName);
  }

  /**
   * Builds a URL for the mirror node API by combining the base URL with either a pagination token or the default endpoint
   * @param {string} mirrorNodeBaseUrl - The base URL of the mirror node API
   * @param {string | null} next - The pagination token for the next set of results, or null to use default endpoint
   * @returns {string} The complete URL to query the mirror node API
   */
  static buildUrl(mirrorNodeBaseUrl: string, next: string | null): string {
    return next
      ? `${mirrorNodeBaseUrl}${next}`
      : `${mirrorNodeBaseUrl}${constants.GET_CONTRACT_ENDPOINT}?limit=100&order=asc`;
  }

  /**
   * Creates a promise that resolves after the specified delay
   * @param {number} ms - The delay in milliseconds
   * @returns {Promise<void>} A promise that resolves after the specified delay
   */
  static wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
