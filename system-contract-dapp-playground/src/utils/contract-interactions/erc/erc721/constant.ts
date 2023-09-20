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

export const mintParamFields = [
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'recipient',
    inputPlaceholder: 'Recipient address..',
  },
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'number',
    paramKey: 'tokenId',
    inputPlaceholder: 'Token ID..',
  },
];

export const mintERC721ParamFields = [
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'recipient',
    inputPlaceholder: 'Recipient address..',
  },
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'number',
    paramKey: 'tokenId',
    inputPlaceholder: 'Token ID..',
  },
];

export const approveERC721ParamFields = [
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'spenderAddress',
    inputPlaceholder: 'Spender address..',
  },
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'number',
    paramKey: 'tokenId',
    inputPlaceholder: 'Token ID..',
  },
];

export const isApprovalERC721ParamFields = [
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'owner',
    inputPlaceholder: 'Owner address..',
  },
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'operator',
    inputPlaceholder: 'Operator address..',
  },
];

export const transferFromERC721ParamFields = [
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'sender',
    inputPlaceholder: 'Sender address..',
  },
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'recipient',
    inputPlaceholder: 'Recipient address..',
  },
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    paramKey: 'tokenId',
    inputType: 'number',
    inputPlaceholder: 'Token ID..',
  },
];

export const safeTransferFromERC721ParamFields = [
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'sender',
    inputPlaceholder: 'Sender address..',
  },
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'recipient',
    inputPlaceholder: 'Recipient address..',
  },
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    paramKey: 'tokenId',
    inputType: 'number',
    inputPlaceholder: 'Token ID..',
  },
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    paramKey: 'data',
    inputType: 'text',
    inputPlaceholder: 'Data..',
  },
];
