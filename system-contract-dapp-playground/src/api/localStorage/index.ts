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

/**
 * @dev get balances from LocalStorage
 *
 * @return balances?: Map<string, number>
 *
 * @return err?
 */
export const getBalancesFromLocalStorage = () => {
  try {
    const storageBalances = localStorage.getItem('hedera_erc20_balances');
    if (storageBalances) {
      return {
        storageBalances: new Map(Object.entries(JSON.parse(storageBalances))) as Map<
          string,
          number
        >,
      };
    } else {
      return { storageBalances: new Map() };
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
