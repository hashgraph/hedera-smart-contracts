// SPDX-License-Identifier: Apache-2.0

import { useEffect } from 'react';
import { ITransactionResult } from '@/types/contract-interactions/shared';

/** @dev listen to change event on transactionResults state => load to localStorage */
export const useUpdateTransactionResultsToLocalStorage = (
  transactionResults: ITransactionResult[],
  transactionResultStorageKey: string
) => {
  useEffect(() => {
    if (transactionResults.length > 0) {
      localStorage.setItem(transactionResultStorageKey, JSON.stringify(transactionResults));
    }
  }, [transactionResults, transactionResultStorageKey]);
};
