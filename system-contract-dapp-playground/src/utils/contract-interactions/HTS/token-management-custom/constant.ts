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

import {
  IHederaTokenServiceExpiry,
  IHederaTokenServiceHederaToken,
} from '@/types/contract-interactions/HTS';
import { ethers } from 'ethers';

/**
 * @notice an object for the IhederaTokenService.Expiry
 */
export const DEFAULT_TOKEN_EXIPIRY_VALUE: IHederaTokenServiceExpiry = {
  second: 0,
  autoRenewPeriod: 0,
  autoRenewAccount: ethers.ZeroAddress,
};

/**
 * @notice an object for the IHederaTokenService.HederaToken default values
 */
export const DEFAULT_HEDERA_TOKEN_INFO_VALUE: IHederaTokenServiceHederaToken = {
  memo: '',
  name: '',
  symbol: '',
  treasury: '',
  maxSupply: 0,
  tokenKeys: [],
  freezeDefault: false,
  tokenSupplyType: false,
  expiry: DEFAULT_TOKEN_EXIPIRY_VALUE,
};

/** @notice an object holding information for the updateTokenInfo's input fields */
export const htsUpdateTokenInfoParamFields = {
  hederaTokenAddress: {
    inputType: 'text',
    inputPlaceholder: 'Token address...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'hederaTokenAddress',
    explanation: 'represents the Hedera Token for updating',
  },
  name: {
    inputType: 'text',
    inputPlaceholder: 'Name of the token...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'name',
    explanation: 'represents the name by which the token should be known',
  },
  symbol: {
    inputType: 'text',
    inputPlaceholder: 'Ticket symbol of the token...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'symbol',
    explanation: 'represents the ticket symbol of the token',
  },
  memo: {
    inputType: 'text',
    inputPlaceholder: 'A memo for the token...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'memo',
    explanation: 'represents an optional note that can be attached to a token transfer',
  },
  maxSupply: {
    inputType: 'number',
    inputPlaceholder: 'Max supply...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'maxSupply',
    explanation: 'defines the maximum number of tokens that can ever exist for the token',
  },
  treasury: {
    inputType: 'text',
    inputPlaceholder: 'The token treasury account ID...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'treasury',
    explanation:
      'represents the account will receive the specified initial supply or the newly minted NFTs',
  },
  tokenSupplyType: {
    paramKey: 'tokenSupplyType',
    explanation: {
      infinite: 'Indicates that tokens of that type have an upper bound of Long.MAX_VALUE.',
      finite:
        'Indicates that tokens of that type have an upper bound of maxSupply, provided on token creation.',
    },
  },
  freezeStatus: {
    paramKey: 'freezeStatus',
    explanation: {
      off: 'Accounts can receive the token without needing to be unfrozen',
      on: ' Accounts must be unfrozen before they can receive the token ',
    },
  },
};

