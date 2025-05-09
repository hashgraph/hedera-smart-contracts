// SPDX-License-Identifier: Apache-2.0

import { Tooltip } from '@chakra-ui/react';
import { Dispatch, SetStateAction } from 'react';
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md';
import { ITransactionResult } from '@/types/contract-interactions/shared';

interface PageProps {
  TRANSACTION_PAGE_SIZE: number;
  currentTransactionPage: number;
  transactionList: ITransactionResult[];
  setCurrentTransactionPage: Dispatch<SetStateAction<number>>;
}

const PageinationButtons = ({
  transactionList,
  TRANSACTION_PAGE_SIZE,
  currentTransactionPage,
  setCurrentTransactionPage,
}: PageProps) => {
  return (
    <div className="flex gap-3 justify-center items-center">
      <Tooltip label="Return to the previous page">
        <button
          onClick={() => setCurrentTransactionPage((prev) => prev - 1)}
          disabled={currentTransactionPage === 1}
          className={`border rounded-lg border-white/30 text-2xl ${
            currentTransactionPage === 1
              ? 'hover:cursor-not-allowed text-white/30'
              : 'hover:cursor-pointer text-white'
          }`}
        >
          <MdNavigateBefore />
        </button>
      </Tooltip>
      <p className="text-base">{currentTransactionPage}</p>
      <Tooltip label="Proceed to the next page">
        <button
          onClick={() => setCurrentTransactionPage((prev) => prev + 1)}
          disabled={transactionList.length <= TRANSACTION_PAGE_SIZE * currentTransactionPage}
          className={`border border-white/30 rounded-lg text-2xl cursor-pointer ${
            transactionList.length <= TRANSACTION_PAGE_SIZE * currentTransactionPage
              ? 'hover:cursor-not-allowed text-white/30'
              : 'hover:cursor-pointer text-white'
          }`}
        >
          <MdNavigateNext />
        </button>
      </Tooltip>
    </div>
  );
};

export default PageinationButtons;
