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

import { getMapValuesFromLocalStorage } from '@/api/localStorage';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { useEffect } from 'react';

const useRetrieveMapValueFromLocalStorage = (
  toaster: any,
  transactionResultStorageKey: string,
  setMapState: any
) => {
  useEffect(() => {
    const { storagedValue, err: localStorageBalanceErr } = getMapValuesFromLocalStorage(
      transactionResultStorageKey
    );
    // handle err
    if (localStorageBalanceErr) {
      CommonErrorToast({
        toaster,
        title: 'Cannot retrieve balances from local storage',
        description: "See client's console for more information",
      });
      return;
    }

    // update map state
    if (storagedValue) {
      setMapState(storagedValue);
    }
  }, [toaster, setMapState, transactionResultStorageKey]);
};

export default useRetrieveMapValueFromLocalStorage;