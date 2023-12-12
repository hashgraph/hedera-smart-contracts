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
