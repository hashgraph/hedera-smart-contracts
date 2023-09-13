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
import { IHederaTokenServiceKeyType, TransactionResult } from '@/types/contract-interactions/HTS';

/** @dev handle error returned back from invoking method APIs*/
export const handleAPIErrors = ({
  err,
  toaster,
  APICalled,
  tokenAddress,
  keyTypeCalled,
  tokenAddresses,
  accountAddress,
  transactionType,
  transactionHash,
  receiverAddress,
  setTransactionResults,
}: {
  err: any;
  toaster: any;
  APICalled?: string;
  tokenAddress?: string;
  accountAddress?: string;
  transactionType: string;
  receiverAddress?: string;
  tokenAddresses?: string[];
  transactionHash: string | undefined;
  keyTypeCalled?: IHederaTokenServiceKeyType;
  setTransactionResults: Dispatch<SetStateAction<TransactionResult[]>>;
}) => {
  const errorMessage = JSON.stringify(err);

  let errorDescription = "See client's console for more information";
  // @notice 4001 error code is returned when a metamask wallet request is rejected by the user
  // @notice See https://docs.metamask.io/wallet/reference/provider-api/#errors for more information on the error returned by Metamask.
  if (errorMessage.indexOf('4001') !== -1) {
    errorDescription = 'You have rejected the request.';
  } else if (errorMessage.indexOf('nonce has already been used') !== -1) {
    errorDescription = 'Nonce has already been used. Please try again!';
  } else if (errorMessage.indexOf('decreased allowance below zero') !== -1) {
    errorDescription =
      'The transaction was reverted due to the allowance decrease falling below zero.';
  } else if (errorMessage.indexOf('transfer amount exceeds balance') !== -1) {
    errorDescription = 'Transfer amount exceeds balance';
  } else if (errorMessage.indexOf('insufficient allowance') !== -1) {
    errorDescription = 'Insufficient allowance';
  }

  // @notice if a transaction hash is returned, that means the transaction did make to the system contract but got reverted
  if (transactionHash) {
    setTransactionResults((prev) => [
      ...prev,
      {
        APICalled,
        keyTypeCalled,
        status: 'fail',
        isToken: false,
        transactionType,
        txHash: transactionHash,
        tokenAddress: tokenAddress ? tokenAddress : '',
        accountAddress: accountAddress ? accountAddress : '',
        tokenAddresses: tokenAddresses ? tokenAddresses : [''],
        receiverAddress: receiverAddress ? receiverAddress : '',
        transactionTimeStamp: Date.now(),
      },
    ]);

    CommonErrorToast({
      toaster,
      title: `Transaction got reverted`,
      description: errorDescription,
    });
  } else {
    CommonErrorToast({
      toaster,
      title: `Cannot execute transaction`,
      description: errorDescription,
    });
  }
};
