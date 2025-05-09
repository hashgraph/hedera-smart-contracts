// SPDX-License-Identifier: Apache-2.0

import { Dispatch, SetStateAction } from 'react';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import { HEDERA_COMMON_WALLET_REVERT_REASONS } from '@/utils/common/constants';

/** @dev handle error returned back from invoking method APIs*/
export const handleAPIErrors = ({
  err,
  tokenID,
  toaster,
  APICalled,
  tokenAddress,
  keyTypeCalled,
  initialAmount,
  transferAmount,
  tokenAddresses,
  accountAddress,
  transactionType,
  transactionHash,
  receiverAddress,
  setTransactionResults,
  sessionedContractAddress,
  transactionResultStorageKey,
}: {
  err: any;
  toaster: any;
  tokenID?: string;
  APICalled?: string;
  tokenAddress?: string;
  initialAmount?: string;
  transferAmount?: string;
  accountAddress?: string;
  transactionType: string;
  receiverAddress?: string;
  tokenAddresses?: string[];
  sessionedContractAddress: string;
  transactionResultStorageKey: string;
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
        transactionResultStorageKey,
        tokenID: tokenID ? tokenID : '',
        transactionTimeStamp: Date.now(),
        tokenAddress: tokenAddress ? tokenAddress : '',
        initialAmount: initialAmount ? initialAmount : '',
        accountAddress: accountAddress ? accountAddress : '',
        transferAmount: transferAmount ? transferAmount : '',
        tokenAddresses: tokenAddresses ? tokenAddresses : [''],
        receiverAddress: receiverAddress ? receiverAddress : '',
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
