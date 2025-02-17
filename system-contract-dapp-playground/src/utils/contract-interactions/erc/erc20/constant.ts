// SPDX-License-Identifier: Apache-2.0
import { HEDERA_SHARED_PARAM_INPUT_FIELDS } from '@/utils/common/constants';

export const mintParamFields = [
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    inputPlaceholder: 'Recipient address..',
    paramKey: 'recipient',
  },
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'number',
    inputPlaceholder: 'Token amount..',
    paramKey: 'amount',
  },
];

export const approveParamFields = [
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'spender',
    inputPlaceholder: 'Spender address..',
  },
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    paramKey: 'amount',
    inputType: 'number',
    inputPlaceholder: 'Allowance amount..',
  },
];

export const allowanceParamFields = [
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    paramKey: 'owner',
    inputType: 'text',
    inputPlaceholder: 'Owner address..',
  },
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'spender',
    inputPlaceholder: 'Spender address..',
  },
];

export const increaseAllowanceParamFields = [
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'spender',
    inputPlaceholder: 'Spender address..',
  },
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    paramKey: 'amount',
    inputType: 'number',
    inputPlaceholder: 'Allowance amount..',
  },
];

export const decreaseAllowanceParamFields = [
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'spender',
    inputPlaceholder: 'Spender address..',
  },
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    paramKey: 'amount',
    inputType: 'number',
    inputPlaceholder: 'Allowance amount..',
  },
];

export const transferParamFields = [
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'recipient',
    inputPlaceholder: 'Recipient address..',
  },
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    paramKey: 'amount',
    inputType: 'number',
    inputPlaceholder: 'Token amount..',
  },
];

export const transferFromParamFields = [
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    paramKey: 'owner',
    inputType: 'text',
    inputPlaceholder: 'Token owner address..',
  },
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'recipient',
    inputPlaceholder: 'Recipient address..',
  },
  {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    paramKey: 'amount',
    inputType: 'number',
    inputPlaceholder: 'Token amount..',
  },
];
