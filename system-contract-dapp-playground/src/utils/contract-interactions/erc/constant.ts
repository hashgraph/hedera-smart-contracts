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
import { HEDERA_BRANDING_COLORS } from '@/utils/common/constants';

export const mintParamFields = [
  {
    inputType: 'text',
    inputPlaceholder: 'Recipient address..',
    inputSize: 'md',
    inputFocusBorderColor: HEDERA_BRANDING_COLORS.purple,
    inputClassname: 'w-full border-white/30',
    paramKey: 'recipient',
  },
  {
    inputType: 'number',
    inputPlaceholder: 'Token amount..',
    inputSize: 'md',
    inputFocusBorderColor: HEDERA_BRANDING_COLORS.purple,
    inputClassname: 'w-full border-white/30',
    paramKey: 'amount',
  },
];

export const approveParamFields = [
  {
    inputType: 'text',
    inputPlaceholder: 'Spender address..',
    inputSize: 'md',
    inputFocusBorderColor: HEDERA_BRANDING_COLORS.purple,
    inputClassname: 'w-full border-white/30',
    paramKey: 'spender',
  },
  {
    inputType: 'number',
    inputPlaceholder: 'Allowance amount..',
    inputSize: 'md',
    inputFocusBorderColor: HEDERA_BRANDING_COLORS.purple,
    inputClassname: 'w-full border-white/30',
    paramKey: 'amount',
  },
];

export const allowanceParamFields = [
  {
    inputType: 'text',
    inputPlaceholder: 'Owner address..',
    inputSize: 'md',
    inputFocusBorderColor: HEDERA_BRANDING_COLORS.purple,
    inputClassname: 'w-full border-white/30',
    paramKey: 'owner',
  },
  {
    inputType: 'text',
    inputPlaceholder: 'Spender address..',
    inputSize: 'md',
    inputFocusBorderColor: HEDERA_BRANDING_COLORS.purple,
    inputClassname: 'w-full border-white/30',
    paramKey: 'spender',
  },
];

export const increaseAllowanceParamFields = [
  {
    inputType: 'text',
    inputPlaceholder: 'Spender address..',
    inputSize: 'md',
    inputFocusBorderColor: HEDERA_BRANDING_COLORS.purple,
    inputClassname: 'w-full border-white/30',
    paramKey: 'spender',
  },
  {
    inputType: 'number',
    inputPlaceholder: 'Allowance amount..',
    inputSize: 'md',
    inputFocusBorderColor: HEDERA_BRANDING_COLORS.purple,
    inputClassname: 'w-full border-white/30',
    paramKey: 'amount',
  },
];

export const decreaseAllowanceParamFields = [
  {
    inputType: 'text',
    inputPlaceholder: 'Spender address..',
    inputSize: 'md',
    inputFocusBorderColor: HEDERA_BRANDING_COLORS.purple,
    inputClassname: 'w-full border-white/30',
    paramKey: 'spender',
  },
  {
    inputType: 'number',
    inputPlaceholder: 'Allowance amount..',
    inputSize: 'md',
    inputFocusBorderColor: HEDERA_BRANDING_COLORS.purple,
    inputClassname: 'w-full border-white/30',
    paramKey: 'amount',
  },
];

export const transferParamFields = [
  {
    inputType: 'text',
    inputPlaceholder: 'Recipient address..',
    inputSize: 'md',
    inputFocusBorderColor: HEDERA_BRANDING_COLORS.purple,
    inputClassname: 'w-full border-white/30',
    paramKey: 'recipient',
  },
  {
    inputType: 'number',
    inputPlaceholder: 'Token amount..',
    inputSize: 'md',
    inputFocusBorderColor: HEDERA_BRANDING_COLORS.purple,
    inputClassname: 'w-full border-white/30',
    paramKey: 'amount',
  },
];

export const transferFromParamFields = [
  {
    inputType: 'text',
    inputPlaceholder: 'Token owner address..',
    inputSize: 'md',
    inputFocusBorderColor: HEDERA_BRANDING_COLORS.purple,
    inputClassname: 'w-full border-white/30',
    paramKey: 'owner',
  },
  {
    inputType: 'text',
    inputPlaceholder: 'Recipient address..',
    inputSize: 'md',
    inputFocusBorderColor: HEDERA_BRANDING_COLORS.purple,
    inputClassname: 'w-full border-white/30',
    paramKey: 'recipient',
  },
  {
    inputType: 'number',
    inputPlaceholder: 'Token amount..',
    inputSize: 'md',
    inputFocusBorderColor: HEDERA_BRANDING_COLORS.purple,
    inputClassname: 'w-full border-white/30',
    paramKey: 'amount',
  },
];
