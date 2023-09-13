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

import { HEDERA_SHARED_PARAM_INPUT_FIELDS } from '@/utils/common/constants';

/** @notice an object holding information for the queryTokenInfo's input fields */
export const htsCryptoTransferParamFields = {
  accountID: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'accountID',
    inputPlaceholder: 'Account ID...',
    explanation: 'represents the accountID that sends/receives cryptocurrency or tokens',
  },
  amount: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    paramKey: 'amount',
    inputType: 'number',
    inputPlaceholder: 'Amount...',
    explanation:
      'represents the the amount of tinybars (for Crypto transfers) or in the lowest denomination (for Token transfers) that the account sends(negative) or receives(positive)',
  },
  isApprovalA: {
    paramKey: 'isApprovalA',
    explanation:
      'If true then the transfer is expected to be an approved allowance and the accountID is expected to be the owner. The default is false (omitted).',
  },
  hederaTokenAddress: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'hederaTokenAddress',
    inputPlaceholder: 'Token address...',
    explanation: 'represents the Hedera Token address',
  },
  senderAccountID: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'senderAccountID',
    inputPlaceholder: 'Sender ID...',
    explanation: 'represents the accountID of the sender',
  },
  receiverAccountID: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'receiverAccountID',
    inputPlaceholder: 'Receiver ID...',
    explanation: 'represents the accountID of the receiver',
  },
  serialNumber: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'serialNumber',
    inputPlaceholder: 'Serial number...',
    explanation: 'represents the serial number of the NFT',
  },
  isApprovalB: {
    paramKey: 'isApprovalB',
    explanation:
      'If true then the transfer is expected to be an approved allowance and the senderAccountID is expected to be the owner. The default is false (omitted).',
  },
};

/** @notice an object holding information for the tokenTransfer's input fields */
export const htsTokenTransferParamFields = {
  hederaTokenAddress: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'hederaTokenAddress',
    inputPlaceholder: 'Token address...',
    explanation: 'represents the Hedera token to be transfered',
  },
  senderAddress: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'senderAddress',
    inputPlaceholder: 'Sender address...',
    explanation: 'represents the sender address',
  },
  receiverAddress: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'receiverAddress',
    inputPlaceholder: 'Receiver address...',
    explanation: 'represents the receiver address',
  },
  quantity: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'number',
    paramKey: 'quantity',
    inputPlaceholder: 'Amount | Serial number...',
    explanation:
      'represents the amount for type FUNGIBLE_COMMON and serial number for type NON_FUNGIBLE_COMMON',
  },
  feeValue: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'number',
    paramKey: 'feeValue',
    inputPlaceholder: 'Gas limit...',
    explanation: 'represents the gas limit for the transaction',
  },
};

/** @notice an object holding information for the tokenTransfer's input fields */
export const htsMultiTokensTransferParamFields = {
  hederaTokenAddress: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'hederaTokenAddress',
    inputPlaceholder: 'Token address...',
    explanation: 'represents the Hedera token to be transfered',
  },
  senderAddress: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'senderAddress',
    inputPlaceholder: 'Sender address...',
    explanation: 'represents the sender address',
  },
  receiverAddress: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'receiverAddress',
    inputPlaceholder: 'Receiver address...',
    explanation: 'represents the receiver address',
  },
  amount: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    paramKey: 'amount',
    inputType: 'number',
    inputPlaceholder: 'Amount...',
    explanation: 'represents the amount for to transfer',
  },
  serialNumber: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'number',
    paramKey: 'serialNumber',
    inputPlaceholder: 'Serial number...',
    explanation: "represents the token's serialNumber to transfer",
  },
  feeValue: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'number',
    paramKey: 'feeValue',
    inputPlaceholder: 'Gas limit...',
    explanation: 'represents the gas limit for the transaction',
  },
};
