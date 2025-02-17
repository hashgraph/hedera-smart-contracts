// SPDX-License-Identifier: Apache-2.0

import { HEDERA_SHARED_PARAM_INPUT_FIELDS } from '@/utils/common/constants';

/** @notice an object holding information for the tokenRelation's input fields */
export const htsQueryTokenInfoParamFields = {
  hederaTokenAddress: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'hederaTokenAddress',
    inputPlaceholder: 'Token address...',
    explanation: 'represents the Hedera Token for querying',
  },
  serialNumber: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'number',
    paramKey: 'serialNumber',
    inputPlaceholder: 'Serial number...',
    explanation: "represents the NFT's serial number to be queried",
  },
};

/** @notice an object holding information for the queryTokenPermission's input fields */
export const htsQueryTokenPermissionParamFields = {
  hederaTokenAddress: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'hederaTokenAddress',
    inputPlaceholder: 'Token address...',
    explanation: 'represents the Hedera Token for querying',
  },
  serialNumber: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'number',
    paramKey: 'serialNumber',
    inputPlaceholder: 'Serial number...',
    explanation: "represents the NFT's serial number to be queried",
  },
  ownerAddress: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'string',
    paramKey: 'ownerAddress',
    inputPlaceholder: 'Owner address...',
    explanation: "represents the address of the token's owner",
  },
  spenderAddress: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'string',
    paramKey: 'spenderAddress',
    inputPlaceholder: 'Spender/Operator address...',
    explanation: 'represents the spender or operator address',
  },
};

/** @notice an object holding information for the queryTokenInfo's input fields */
export const htsQueryTokenStatusParamFields = {
  hederaTokenAddress: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'hederaTokenAddress',
    inputPlaceholder: 'Token address...',
    explanation: 'represents the Hedera Token for querying',
  },
  accountAddress: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'accountAddress',
    inputPlaceholder: 'Account address...',
    explanation: 'represents the account address to check status against',
  },
};

export const TOKEN_INFO_BASIC_KEYS = [
  'name',
  'symbol',
  'treasury',
  'memo',
  'tokenSupplyType',
  'maxSupply',
  'freezeDefault',
];
export const TOKEN_INFO_ADVANCED_KEYS = [
  'totalSupply',
  'deleted',
  'defaultKycStatus',
  'pauseStatus',
  'ledgerId',
];
export const TOKEN_INFO_NFT_KEYS = ['serialNumber', 'ownerId', 'creationTime', 'metadata', 'spenderId'];

type CustomFeeKeys = 'fixedFees' | 'fractionalFees' | 'royaltyFees';
export const CUSTOM_FEES_KEYS: CustomFeeKeys[] = ['fixedFees', 'fractionalFees', 'royaltyFees'];

export const FIXED_FEES_KEYS = [
  'amount',
  'tokenId',
  'useHbarsForPayment',
  'useCurrentTokenForPayment',
  'feeCollector',
];
export const FRACTIONAL_FEES_KEYS = [
  'numerator',
  'denominator',
  'minimumAmount',
  'maximumAmount',
  'netOfTransfers',
  'feeCollector',
];
export const ROYALTY_FEES_KEYS = [
  'numerator',
  'denominator',
  'amount',
  'tokenId',
  'useHbarsForPayment',
  'feeCollector',
];
export const KEY_VALUE_KEYS = [
  'inheritAccountKey',
  'contractId',
  'ed25519',
  'ECDSA_secp256k1',
  'delegatableContractId',
];
export const EXPIRY_KEYS = ['second', 'autoRenewAccount', 'autoRenewPeriod'];
