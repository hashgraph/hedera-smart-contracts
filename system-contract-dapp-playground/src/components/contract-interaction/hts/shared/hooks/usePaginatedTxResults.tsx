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

import { useMemo } from 'react';
import { TRANSACTION_PAGE_SIZE } from '../states/commonStates';
import { TransactionResult } from '@/types/contract-interactions/HTS';

/** @dev custom hook which declares a paginatedTransactionResults array */
export const usePaginatedTxResults = (
  currentTransactionPage: number,
  transactionResults: TransactionResult[],
  customePageSize?: number
) => {
  const pageSize = customePageSize ? customePageSize : TRANSACTION_PAGE_SIZE;
  const paginatedTransactionResults = useMemo(() => {
    const startIndex = (currentTransactionPage - 1) * pageSize;
    const endIndex = (currentTransactionPage - 1) * pageSize + pageSize;
    return transactionResults.slice(startIndex, endIndex);
  }, [currentTransactionPage, transactionResults, pageSize]);

  return paginatedTransactionResults;
};
