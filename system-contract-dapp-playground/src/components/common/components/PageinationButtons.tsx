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
