// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';
import { ITransactionResult } from '@/types/contract-interactions/shared';

/** @dev custom hook to filter transactions by contract address */

const useFilterTransactionsByContractAddress = (
  transactionResults: ITransactionResult[],
  contractAddress: string
) => {
  return useMemo(
    () => transactionResults.filter((result) => result.sessionedContractAddress === contractAddress),
    [transactionResults, contractAddress]
  );
};

export default useFilterTransactionsByContractAddress;
