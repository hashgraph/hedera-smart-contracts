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

export const approveParamFields = [
  {
    title: 'spenderAddress',
    inputType: 'text',
    inputPlaceholder: 'Spender address..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
  },
  {
    title: 'amount',
    inputType: 'number',
    inputPlaceholder: 'Allowance amount..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
  },
];

export const allowanceParamFields = [
  {
    title: 'ownerAddress',
    inputType: 'text',
    inputPlaceholder: 'Owner address..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
  },
  {
    title: 'spenderAddress',
    inputType: 'text',
    inputPlaceholder: 'Spender address..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
  },
];

export const increaseAllowanceParamFields = [
  {
    title: 'spenderAddress',
    inputType: 'text',
    inputPlaceholder: 'Spender address..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
  },
  {
    title: 'amount',
    inputType: 'number',
    inputPlaceholder: 'Allowance amount to increase..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
  },
];

export const decreaseAllowanceParamFields = [
  {
    title: 'spenderAddress',
    inputType: 'text',
    inputPlaceholder: 'Spender address..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
  },
  {
    title: 'amount',
    inputType: 'number',
    inputPlaceholder: 'Allowance amount to decrease..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
  },
];

export const transferParamFields = [
  {
    title: 'recipientAddress',
    inputType: 'text',
    inputPlaceholder: 'Recipient address..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
  },
  {
    title: 'amount',
    inputType: 'number',
    inputPlaceholder: 'Token amount..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
  },
];

export const transferFromParamFields = [
  {
    title: 'senderAddress',
    inputType: 'text',
    inputPlaceholder: 'Sender address..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
  },
  {
    title: 'recipientAddress',
    inputType: 'text',
    inputPlaceholder: 'Recipient address..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
  },
  {
    title: 'amount',
    inputType: 'number',
    inputPlaceholder: 'Token amount..',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
  },
];
