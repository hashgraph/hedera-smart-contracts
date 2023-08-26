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

import {
  CommonKeyObject,
  TransactionResult,
  IHederaTokenServiceKeyType,
} from '@/types/contract-interactions/HTS';
import { Dispatch, SetStateAction, useEffect } from 'react';
import { HederaTokenKeyTypes, TRANSACTION_PAGE_SIZE } from '../states/commonStates';

interface HookProps {
  toaster: any;
  setMetadata?: any;
  toastTitle: string;
  isSuccessful: boolean;
  resetParamValues: any;
  toastDescription?: string;
  setParamValues: Dispatch<any>;
  transactionResults: TransactionResult[];
  setIsSuccessful: Dispatch<SetStateAction<boolean>>;
  setWithCustomFee?: Dispatch<SetStateAction<boolean>>;
  setKeys?: Dispatch<SetStateAction<CommonKeyObject[]>>;
  setCurrentTransactionPage: Dispatch<SetStateAction<number>>;
  setChosenKeys?: Dispatch<SetStateAction<Set<IHederaTokenServiceKeyType>>>;
  setKeyTypesToShow?: Dispatch<SetStateAction<Set<IHederaTokenServiceKeyType>>>;
}

export const useToastSuccessful = ({
  toaster,
  setKeys,
  toastTitle,
  setMetadata,
  isSuccessful,
  setChosenKeys,
  setParamValues,
  setIsSuccessful,
  toastDescription,
  resetParamValues,
  setWithCustomFee,
  setKeyTypesToShow,
  transactionResults,
  setCurrentTransactionPage,
}: HookProps) => {
  useEffect(() => {
    if (isSuccessful) {
      toaster({
        title: `🎉 ${toastTitle} 🎉`,
        description: toastDescription,
        status: 'success',
        position: 'top',
      });

      // reset values
      setIsSuccessful(false);
      if (setKeys) setKeys([]);
      if (setMetadata) setMetadata([]);
      setParamValues(resetParamValues);
      if (setWithCustomFee) setWithCustomFee(false);
      if (setKeyTypesToShow) setKeyTypesToShow(new Set(HederaTokenKeyTypes));
      if (setChosenKeys) setChosenKeys(new Set<IHederaTokenServiceKeyType>());
      // set the current page to the last page so it can show the newly created transaction
      const maxPageNum = Math.ceil(transactionResults.length / TRANSACTION_PAGE_SIZE);
      setCurrentTransactionPage(maxPageNum === 0 ? 1 : maxPageNum);
    }
  }, [isSuccessful, toaster, transactionResults.length, HederaTokenKeyTypes]);
};
