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

import { Dispatch, SetStateAction, useEffect } from 'react';
import {
  HederaTokenKeyTypes,
  TRANSACTION_PAGE_SIZE,
} from '../components/contract-interaction/hts/shared/states/commonStates';
import {
  generateInitialFungibleParamValue,
  generateInitialNonFungibleParamValue,
} from '../components/contract-interaction/hts/token-transfer-contract/method/transferMultipleTokens/helpers/generateInitialValues';
import { ITransactionResult } from '@/types/contract-interactions/shared';

interface HookProps {
  toaster: any;
  setMetadata?: any;
  toastTitle: string;
  isSuccessful: boolean;
  resetParamValues?: any;
  setTokenAddresses?: any;
  toastDescription?: string;
  setFungibleParamValues?: any;
  setParamValues?: Dispatch<any>;
  setNonFungibleParamValues?: any;
  initialTokenAddressesValues?: any;
  setTokenTransferParamValues?: any;
  setCryptoTransferParamValues?: any;
  initialKeyValues?: ICommonKeyObject[];
  transactionResults: ITransactionResult[];
  setIsSuccessful: Dispatch<SetStateAction<boolean>>;
  setWithCustomFee?: Dispatch<SetStateAction<boolean>>;
  setKeys?: Dispatch<SetStateAction<ICommonKeyObject[]>>;
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
  initialKeyValues,
  toastDescription,
  resetParamValues,
  setWithCustomFee,
  setTokenAddresses,
  setKeyTypesToShow,
  transactionResults,
  setFungibleParamValues,
  setCurrentTransactionPage,
  setNonFungibleParamValues,
  setTokenTransferParamValues,
  initialTokenAddressesValues,
  setCryptoTransferParamValues,
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
      if (setWithCustomFee) setWithCustomFee(false);
      if (setParamValues) setParamValues(resetParamValues);
      if (initialKeyValues && setKeys) setKeys(initialKeyValues);
      if (setTokenTransferParamValues) setTokenTransferParamValues([]);
      if (setCryptoTransferParamValues) setCryptoTransferParamValues([]);
      if (setKeyTypesToShow) setKeyTypesToShow(new Set(HederaTokenKeyTypes));
      if (setTokenAddresses) setTokenAddresses([initialTokenAddressesValues]);
      if (setChosenKeys) setChosenKeys(new Set<IHederaTokenServiceKeyType>());
      if (setFungibleParamValues) setFungibleParamValues(generateInitialFungibleParamValue);
      if (setNonFungibleParamValues) setFungibleParamValues(generateInitialNonFungibleParamValue);
      // set the current page to the last page so it can show the newly created transaction
      const maxPageNum = Math.ceil(transactionResults.length / TRANSACTION_PAGE_SIZE);
      setCurrentTransactionPage(maxPageNum === 0 ? 1 : maxPageNum);
    }
  }, [
    toaster,
    setKeys,
    toastTitle,
    setMetadata,
    isSuccessful,
    setChosenKeys,
    setParamValues,
    setIsSuccessful,
    initialKeyValues,
    setWithCustomFee,
    toastDescription,
    resetParamValues,
    setKeyTypesToShow,
    setTokenAddresses,
    setFungibleParamValues,
    transactionResults.length,
    setCurrentTransactionPage,
    setNonFungibleParamValues,
    initialTokenAddressesValues,
    setTokenTransferParamValues,
    setCryptoTransferParamValues,
  ]);
};
