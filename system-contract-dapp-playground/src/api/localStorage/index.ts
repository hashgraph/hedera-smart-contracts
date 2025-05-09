// SPDX-License-Identifier: Apache-2.0

import { OFFCIAL_NETWORK_NAME } from '@/utils/common/constants';

/**
 * @dev get map typed value from LocalStorage
 */
export const getMapValuesFromLocalStorage = (transactionResultStorageKey: string) => {
  try {
    const storagedValue = localStorage.getItem(transactionResultStorageKey);
    if (storagedValue) {
      return {
        storagedValue: new Map(Object.entries(JSON.parse(storagedValue))) as Map<string, number>,
      };
    } else {
      return { storagedValue: new Map() };
    }
  } catch (err) {
    console.error(err);
    return { err };
  }
};

/**
 * @dev get allowances from LocalStorage
 *
 * @param key string
 *
 * @return storageResult?: []
 *
 * @return err?
 */
export const getArrayTypedValuesFromLocalStorage = (key: string) => {
  try {
    const storageResult = localStorage.getItem(key);
    return {
      storageResult: storageResult ? JSON.parse(storageResult) : [],
    };
  } catch (err) {
    console.error(err);
    return { err };
  }
};

/**
 * @dev clear HEDERA transaction results cached in localStorage
 *
 * @param contractKey?: string
 *
 * @param readonly?: boolean
 */
export const clearCachedTransactions = (contractKey?: string, readonly?: boolean) => {
  // prepare key
  const targetKey = contractKey ? contractKey : OFFCIAL_NETWORK_NAME;

  // loop through localStorage items
  if (localStorage) {
    for (let i = 0; i < localStorage.length; i++) {
      // get key
      const key = localStorage.key(i);

      // remove items that have keys include `contractKey`
      if (key?.includes(targetKey)) {
        if (readonly) {
          if (key?.includes('READONLY')) {
            localStorage.removeItem(key);
            i--;
          }
        } else {
          localStorage.removeItem(key);
          i--;
        }
      }
    }
  }
};
