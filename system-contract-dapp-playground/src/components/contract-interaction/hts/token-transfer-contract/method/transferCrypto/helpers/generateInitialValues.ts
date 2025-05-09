// SPDX-License-Identifier: Apache-2.0

import { generatedRandomUniqueKey } from '@/utils/common/helpers';

export interface CryptoTransferParam {
  fieldKey: string;
  fieldValue: {
    accountID: string;
    amount: string;
    isApprovalA: boolean;
  };
}

export interface NonFungibleTokenTransferParam {
  fieldKey: string;
  fieldValue: {
    senderAccountID: string;
    receiverAccountID: string;
    serialNumber: string;
    isApprovalB: boolean;
  };
}

export interface TokenTransferParam {
  fieldKey: string;
  fieldValue: {
    token: string;
    transfers: CryptoTransferParam[];
    tokenType: 'FUNGIBLE' | 'NON_FUNGIBLE';
    nftTransfers: NonFungibleTokenTransferParam[];
  };
}

export const generateInitialCryptoTransferParamValues = (): CryptoTransferParam => {
  return {
    fieldKey: generatedRandomUniqueKey(9),
    fieldValue: {
      accountID: '',
      amount: '',
      isApprovalA: false,
    },
  };
};

export const generateInitialFungibleTokenTransferParamValues = (): CryptoTransferParam => {
  return {
    fieldKey: generatedRandomUniqueKey(9),
    fieldValue: {
      accountID: '',
      amount: '',
      isApprovalA: false,
    },
  };
};

export const generateInitialNonFungibleTokenTransferParamValues = (): NonFungibleTokenTransferParam => {
  return {
    fieldKey: generatedRandomUniqueKey(9),
    fieldValue: {
      senderAccountID: '',
      receiverAccountID: '',
      serialNumber: '',
      isApprovalB: false,
    },
  };
};

export const generateInitialTokenTransferParamValues = (): TokenTransferParam => {
  return {
    fieldKey: generatedRandomUniqueKey(9),
    fieldValue: {
      token: '',
      transfers: [],
      nftTransfers: [],
      tokenType: 'FUNGIBLE',
    },
  };
};
