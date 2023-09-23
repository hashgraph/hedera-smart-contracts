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

import { Dispatch, SetStateAction } from 'react';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { getArrayTypedValuesFromLocalStorage } from '@/api/localStorage';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import { HEDERA_COMMON_WALLET_REVERT_REASONS } from '@/utils/common/constants';
import { TRANSACTION_PAGE_SIZE } from '../../contract-interaction/hts/shared/states/commonStates';

export const handleRetrievingTransactionResultsFromLocalStorage = (
  toaster: any,
  transactionResultStorageKey: string,
  setCurrentTransactionPage: any,
  setTransactionResults: Dispatch<SetStateAction<ITransactionResult[]>>
) => {
  const { storageResult, err: storagedErr } =
    getArrayTypedValuesFromLocalStorage(transactionResultStorageKey);
  // handle err
  if (storagedErr) {
    CommonErrorToast({
      toaster,
      title: 'Cannot retrieve transaction results from local storage',
      description: HEDERA_COMMON_WALLET_REVERT_REASONS.DEFAULT.description,
    });
    return;
  }

  // update states if storageResult is found
  if (storageResult) {
    setTransactionResults(storageResult as ITransactionResult[]);

    // set the current page to the last page so it can show the latest transactions
    const maxPageNum = Math.ceil(storageResult.length / TRANSACTION_PAGE_SIZE);
    if (setCurrentTransactionPage) setCurrentTransactionPage(maxPageNum === 0 ? 1 : maxPageNum);
  }
};
