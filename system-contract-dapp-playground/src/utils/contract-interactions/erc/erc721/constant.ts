// SPDX-License-Identifier: Apache-2.0

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
