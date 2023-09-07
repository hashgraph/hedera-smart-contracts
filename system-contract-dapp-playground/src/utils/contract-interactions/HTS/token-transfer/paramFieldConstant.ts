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

/** @notice an object holding information for the queryTokenInfo's input fields */
export const htsCryptoTransferParamFields = {
  accountID: {
    inputType: 'text',
    inputPlaceholder: 'Account ID...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'accountID',
    explanation: 'represents the accountID that sends/receives cryptocurrency or tokens',
  },
  amount: {
    inputType: 'number',
    inputPlaceholder: 'Amount...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'amount',
    explanation:
      'represents the the amount of tinybars (for Crypto transfers) or in the lowest denomination (for Token transfers) that the account sends(negative) or receives(positive)',
  },
  isApprovalA: {
    paramKey: 'isApprovalA',
    explanation:
      'If true then the transfer is expected to be an approved allowance and the accountID is expected to be the owner. The default is false (omitted).',
  },
  hederaTokenAddress: {
    inputType: 'text',
    inputPlaceholder: 'Token address...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'hederaTokenAddress',
    explanation: 'represents the Hedera Token address',
  },
  senderAccountID: {
    inputType: 'text',
    inputPlaceholder: 'Sender ID...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'senderAccountID',
    explanation: 'represents the accountID of the sender',
  },
  receiverAccountID: {
    inputType: 'text',
    inputPlaceholder: 'Receiver ID...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'receiverAccountID',
    explanation: 'represents the accountID of the receiver',
  },
  serialNumber: {
    inputType: 'text',
    inputPlaceholder: 'Serial number...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'serialNumber',
    explanation: 'represents the serial number of the NFT',
  },
  isApprovalB: {
    paramKey: 'isApprovalB',
    explanation:
      'If true then the transfer is expected to be an approved allowance and the senderAccountID is expected to be the owner. The default is false (omitted).',
  },
};
