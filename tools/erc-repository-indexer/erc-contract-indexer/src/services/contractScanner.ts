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

import axios, { AxiosError } from 'axios';
import constants from '../utils/constants';
import { Helper } from '../utils/helper';
import { Contract, Links } from '../schemas/MirrorNodeSchemas';

export class ContractScannerService {
  /**
   * @private
   * @readonly
   * @property {string} mirrorNodeBaseUrl - The base URL of the Hedera Mirror Node API used for retrieving contract data.
   */
  private readonly mirrorNodeBaseUrl: string;

  constructor() {
    this.mirrorNodeBaseUrl =
      process.env.MIRROR_NODE_URL || constants.MIRROR_NODE_FALL_BACK_BASE_URL;
  }

  /**
   * Fetches contracts from the mirror node API.
   * @param {string | null} next - The pagination token for the next set of results. If null, fetches from the beginning.
   * @returns {Promise<Contract[] | null>} A promise that resolves to an array of contract data, or null if the request fails.
   * @throws {AxiosError} When there is a network or API error. Rate limit errors (429) are automatically retried.
   */
  async fetchContracts(
    next: string | null = null
  ): Promise<{ contracts: Contract[]; links: Links } | null> {
    const url = Helper.buildUrl(this.mirrorNodeBaseUrl, next);
    console.log('Fetching contracts from URL:', url);

    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      return this.handleAxiosError(error, this.fetchContracts, next);
    }
  }

  /**
   * Handles Axios errors, specifically dealing with rate limiting (429) errors by implementing retry logic.
   * @param {unknown} error - The error thrown by Axios
   * @param {(param: string | null) => any} retryMethod - The method to retry if rate limited
   * @param {string | null} param - Parameter to pass to the retry method
   * @returns {Promise<any>} Returns the result of the retry method if successful, null otherwise
   */
  private async handleAxiosError(
    error: unknown,
    retryMethod: (param: string | null) => any,
    param: string | null
  ): Promise<any> {
    const isRateLimitError = (error as AxiosError).response?.status === 429;
    if (isRateLimitError) {
      console.log(
        `Rate limit exceeded. Retrying in ${constants.RETRY_DELAY_MS}ms...`
      );
      await Helper.wait(constants.RETRY_DELAY_MS);
      return retryMethod.call(this, param);
    }

    console.error('Error fetching contracts:', error);
    return null;
  }
}
