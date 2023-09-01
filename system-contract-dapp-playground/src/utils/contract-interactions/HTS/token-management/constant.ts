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

/** @notice an object holding information for the updateTokenExpiry's input fields */
export const htsUpdateTokenExpiryParamFields = {
  hederaTokenAddress: {
    inputType: 'text',
    inputPlaceholder: 'Token address...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'hederaTokenAddress',
    explanation: 'represents the Hedera Token for updating',
  },
  second: {
    inputType: 'number',
    inputPlaceholder: 'The new expiry time of the token...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'second',
    explanation: 'represents the epoch second at which the token should expire',
  },
  autoRenewAccount: {
    inputType: 'text',
    inputPlaceholder: 'Account address...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'autoRenewAccount',
    explanation:
      "represents the new account which will be automatically charged to renew the token's expiration",
  },
  autoRenewPeriod: {
    inputType: 'number',
    inputPlaceholder: 'Expiry interval...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'autoRenewPeriod',
    explanation:
      "represents the new interval at which the auto-renew account will be charged to extend the token's expiry. The default auto-renew period is 131,500 minutes.",
  },
};

/** @notice an object holding information for the tokenPermission's input fields */
export const htsTokenPermissionParamFields = {
  hederaTokenAddress: {
    inputType: 'text',
    inputPlaceholder: 'Token address...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'hederaTokenAddress',
    explanation: 'represents the Hedera Token for updating',
  },
  targetApprovedAddress: {
    inputType: 'text',
    inputPlaceholder: 'Account address...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'targetApprovedAddress',
    explanation: 'represents the operator of the update transaction',
  },
  amountToApprove: {
    inputType: 'number',
    inputPlaceholder: 'Amount...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'amountToApprove',
    explanation: 'represents the allocated allowance for the operator',
  },
  serialNumber: {
    inputType: 'number',
    inputPlaceholder: 'Serial number...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'serialNumber',
    explanation: "represents the NFT's serial number to be approved for the operator",
  },
  approvedStatus: {
    paramKey: 'approvedStatus',
    explanation: {
      on: 'authorize the operator to utilize the allowance on behalf of the token owner.',
      off: "revoke the operator's authorization to utilize the allowance on behalf of the token owner",
    },
  },
};

/** @notice an object holding information for the tokenStatus's input fields */
export const htsTokenStatusParamFields = {
  hederaTokenAddress: {
    inputType: 'text',
    inputPlaceholder: 'Token address...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'hederaTokenAddress',
    explanation: 'represents the Hedera Token for updating',
  },
};

/** @notice an object holding information for the tokenRelation's input fields */
export const htsTokenRelationParamFields = {
  hederaTokenAddress: {
    inputType: 'text',
    inputPlaceholder: 'Token address...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'hederaTokenAddress',
    explanation: 'represents the Hedera Token for updating',
  },
  hederaTokenAddresses: {
    inputType: 'text',
    inputPlaceholder: 'Token addresses (comma-separated)...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'hederaTokenAddresses',
    explanation: 'represents the tokens to be dissociated with the provided account',
  },
  accountAddress: {
    inputType: 'text',
    inputPlaceholder: 'Account address...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'accountAddress',
    explanation: 'represents the account address of the update transaction',
  },
};

/** @notice an object holding information for the tokenDeduction's input fields */
export const htsTokenDeductionParamFields = {
  hederaTokenAddress: {
    inputType: 'text',
    inputPlaceholder: 'Token address...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'hederaTokenAddress',
    explanation: 'represents the Hedera Token for updating',
  },
  accountAddress: {
    inputType: 'text',
    inputPlaceholder: 'Account address...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'accountAddress',
    explanation: 'represents the account address of the update transaction',
  },
  amount: {
    inputType: 'number',
    inputPlaceholder: 'The amount of token...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'amount',
    explanation: 'represents the amount of token to be deducted from the transaction',
  },
  serialNumbers: {
    inputType: 'text',
    inputPlaceholder: 'Serial numbers (comma-separated)...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'serialNumbers',
    explanation: "represents the NFT's serial numbers to be deducted from the transaction",
  },
};
