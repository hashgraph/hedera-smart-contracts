/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
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

import Cookies from 'js-cookie';

/**
 * @dev store the connected accounts array and network info to client cookies
 *
 * @notice for logging in purpose
 *
 * @params accounts string[]
 *
 * @params network string
 *
 * @return error
 */
export const storeAccountInfoInCookies = (accounts: string[], network: string) => {
  try {
    Cookies.set('_isConnected', true.toString());
    Cookies.set('_connectedAccounts', JSON.stringify(accounts));
    Cookies.set('_network', JSON.stringify(network));
  } catch (error: any) {
    console.error(error);
    return error;
  }
};

/**
 * @dev load the connected accounts array from client Cookies
 *
 * @return isConnected?: string | null;
 *
 * @return accounts?: string | null;
 *
 * @return error?: any;
 */
export const loadAccountInfoFromCookies = (): {
  isConnected?: string | null;
  accounts?: string | null;
  network?: string | null;
  error?: any;
} => {
  try {
    return {
      network: Cookies.get('_network'),
      isConnected: Cookies.get('_isConnected'),
      accounts: Cookies.get('_connectedAccounts'),
    };
  } catch (error) {
    console.error(error);
    return { error };
  }
};

/**
 * @dev store customize data to Cookies
 *
 * @params key: string
 *
 * @params value: string
 *
 * @return error
 */
export const storeInfoInCookies = (key: string, value: string) => {
  try {
    Cookies.set(key, value);
  } catch (error) {
    console.error(error);
    return error;
  }
};

/**
 * @dev store customize data to Cookies
 *
 * @params key: string
 *
 * @returns value: string
 *
 * @return error
 */
export const getInfoFromCookies = (
  key: string
): {
  value?: string | null;
  error?: any;
} => {
  try {
    return { value: Cookies.get(key) };
  } catch (error) {
    console.error(error);
    return { error };
  }
};

/**
 * @dev remove specific cookie
 *
 * @param key: string
 */
export const removeCookieAt = (key: string) => {
  Cookies.remove(key);
};

/**
 * @dev clear account information stored in cookies
 */
export const clearCookies = async () => {
  const cookies = Cookies.get();

  for (let key in cookies) {
    Cookies.remove(key);
  }
};
