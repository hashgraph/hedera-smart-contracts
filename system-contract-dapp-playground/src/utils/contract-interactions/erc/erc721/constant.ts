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

export const mintParamFields = [
  {
    inputType: 'text',
    inputPlaceholder: 'Recipient address..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'recipient',
  },
  {
    inputType: 'number',
    inputPlaceholder: 'Token ID..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'tokenId',
  },
];

export const mintERC721ParamFields = [
  {
    inputType: 'text',
    inputPlaceholder: 'Recipient address..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'recipient',
  },
  {
    inputType: 'number',
    inputPlaceholder: 'Token ID..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'tokenId',
  },
];

export const approveERC721ParamFields = [
  {
    inputType: 'text',
    inputPlaceholder: 'Spender address..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'spenderAddress',
  },
  {
    inputType: 'number',
    inputPlaceholder: 'Token ID..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'tokenId',
  },
];

export const isApprovalERC721ParamFields = [
  {
    inputType: 'text',
    inputPlaceholder: 'Owner address..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'owner',
  },
  {
    inputType: 'text',
    inputPlaceholder: 'Operator address..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'operator',
  },
];

export const transferFromERC721ParamFields = [
  {
    inputType: 'text',
    inputPlaceholder: 'Sender address..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'sender',
  },
  {
    inputType: 'text',
    inputPlaceholder: 'Recipient address..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'recipient',
  },
  {
    inputType: 'number',
    inputPlaceholder: 'Token ID..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'tokenId',
  },
];

export const safeTransferFromERC721ParamFields = [
  {
    inputType: 'text',
    inputPlaceholder: 'Sender address..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'sender',
  },
  {
    inputType: 'text',
    inputPlaceholder: 'Recipient address..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'recipient',
  },
  {
    inputType: 'number',
    inputPlaceholder: 'Token ID..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'tokenId',
  },
  {
    inputType: 'text',
    inputPlaceholder: 'Data..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'data',
  },
];