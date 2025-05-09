// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import { TRANSACTION_PAGE_SIZE } from '../components/contract-interaction/hts/shared/states/commonStates';

/** @dev custom hook which declares a paginatedTransactionResults array */
export const usePaginatedTxResults = (
  currentTransactionPage: number,
  transactionResults: ITransactionResult[],
  customePageSize?: number,
  order?: any
) => {
  const pageSize = customePageSize ? customePageSize : TRANSACTION_PAGE_SIZE;
  const paginatedTransactionResults = useMemo(() => {
    const startIndex = (currentTransactionPage - 1) * pageSize;
    const endIndex = (currentTransactionPage - 1) * pageSize + pageSize;
    return transactionResults.slice(startIndex, endIndex);

    // @notice "eslint-disable-next-line" is used to disable the warning for the dependencies array
    // as `order` is not used within the callback function but is necessary to be included for the
    // /activity page to update `transactionList` based on filter conditions.
    // eslint-disable-next-line
  }, [currentTransactionPage, transactionResults, pageSize, order]);

  return paginatedTransactionResults;
};
