// SPDX-License-Identifier: Apache-2.0

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
