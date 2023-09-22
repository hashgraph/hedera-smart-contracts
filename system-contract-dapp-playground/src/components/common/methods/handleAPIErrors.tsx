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
import { HEDERA_COMMON_WALLET_REVERT_REASONS } from '@/utils/common/constants';
import { IHederaTokenServiceKeyType, ITransactionResult } from '@/types/contract-interactions/HTS';

/** @dev handle error returned back from invoking method APIs*/
export const handleAPIErrors = ({
  err,
  toaster,
  APICalled,
  tokenAddress,
  keyTypeCalled,
  initialAmount,
  tokenAddresses,
  accountAddress,
  transactionType,
  transactionHash,
  receiverAddress,
  setTransactionResults,
  sessionedContractAddress,
}: {
  err: any;
  toaster: any;
  APICalled?: string;
  tokenAddress?: string;
  initialAmount?: string;
  accountAddress?: string;
  transactionType: string;
  receiverAddress?: string;
  tokenAddresses?: string[];
  sessionedContractAddress: string;
  transactionHash: string | undefined;
  keyTypeCalled?: IHederaTokenServiceKeyType;
  setTransactionResults: Dispatch<SetStateAction<ITransactionResult[]>>;
}) => {
  const errorMessage = JSON.stringify(err);

  const reasonKeys = [
    'NONCE',
    'REJECT',
    'INVALID_TOKENID',
    'UNAUTHORIZED_CALLER',
    'ALLOWANCE_BELOW_ZERO',
    'INSUFFICIENT_ALLOWANCE',
    'APPROVAL_CURRENT_CALLER',
    'TRANSFER_EXCEEDS_BALANCE',
  ];

  let errorDescription = HEDERA_COMMON_WALLET_REVERT_REASONS.DEFAULT.description;
  reasonKeys.some((reasonKey) => {
    const attributeKey = reasonKey === 'REJECT' ? 'code' : 'message';
    if (errorMessage.indexOf((HEDERA_COMMON_WALLET_REVERT_REASONS as any)[reasonKey][attributeKey]) !== -1) {
      errorDescription = (HEDERA_COMMON_WALLET_REVERT_REASONS as any)[reasonKey].description;
      return true;
    }
  });

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
        sessionedContractAddress,
        tokenAddress: tokenAddress ? tokenAddress : '',
        initialAmount: initialAmount ? initialAmount : '',
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
