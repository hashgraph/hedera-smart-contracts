// SPDX-License-Identifier: Apache-2.0

// Page Size
export const TRANSACTION_PAGE_SIZE = 10;

// keys states
export const HederaTokenKeyTypes: IHederaTokenServiceKeyType[] = [
  'ADMIN',
  'KYC',
  'FREEZE',
  'WIPE',
  'SUPPLY',
  'FEE',
  'PAUSE',
];

// key value types
export const HederaTokenKeyValueType: IHederaTokenServiceKeyValueType[] = [
  'inheritAccountKey',
  'contractId',
  'ed25519',
  'ECDSA_secp256k1',
  'delegatableContractId',
];
