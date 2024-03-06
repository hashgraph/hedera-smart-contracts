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

import { ethers } from 'ethers';
import { HEDERA_SHARED_PARAM_INPUT_FIELDS } from '@/utils/common/constants';

/**
 * @notice an object to map key type to the specific bit value
 *
 * @see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/IHederaTokenService.sol#L128C22-L128C22
 */
export const KEY_TYPE_MAP: Record<IHederaTokenServiceKeyType, IHederaTokenServiceKeyTypeBitValue> = {
  ADMIN: 1,
  KYC: 2,
  FREEZE: 4,
  WIPE: 8,
  SUPPLY: 16,
  FEE: 32,
  PAUSE: 64,
};

/**
 * @notice an object of the keyValue's default values which conform to IHederaTokenService.KeyValue
 */
export const DEFAULT_IHTS_KEY_VALUE: IHederaTokenServiceKeyValue = {
  inheritAccountKey: false,
  contractId: ethers.ZeroAddress,
  ed25519: Buffer.from('', 'hex'),
  ECDSA_secp256k1: Buffer.from('', 'hex'),
  delegatableContractId: ethers.ZeroAddress,
};

/**
 * @notice an object that holds constant values for the parameters used in token creation.
 */
export const htsTokenCreateParamFields = {
  name: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    inputPlaceholder: 'Name of the token...',
    paramKey: 'name',
    explanation: 'represents the name by which the token should be known',
  },
  symbol: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'symbol',
    inputPlaceholder: 'Ticket symbol of the token...',
    explanation: 'represents the ticket symbol of the token',
  },
  memo: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    paramKey: 'memo',
    inputType: 'text',
    inputPlaceholder: 'A memo associated with the token...',
    explanation: 'represents an optional note that can be attached to a token transfer',
  },
  initSupply: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'number',
    paramKey: 'initSupply',
    inputPlaceholder: 'Initial supply...',
    explanation: 'represents the starting amount of tokens available when the token is deployed',
  },
  maxSupply: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'number',
    paramKey: 'maxSupply',
    inputPlaceholder: 'Max supply...',
    explanation: 'defines the maximum number of tokens that can ever exist for the token',
  },
  decimals: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'number',
    inputPlaceholder: 'Decimal places...',
    paramKey: 'decimals',
    explanation: 'Determines token divisibility and decimal precision',
  },
  treasury: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'treasury',
    inputPlaceholder: 'The token treasury account ID...',
    explanation: 'represents the account will receive the specified initial supply or the newly minted NFTs',
  },
  feeTokenAddress: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'feeTokenAddress',
    inputPlaceholder: 'The denomination token ID...',
    explanation: 'represents the ID of token that is used for fixed fee denomination',
  },
  feeAmount: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'number',
    paramKey: 'feeAmount',
    inputPlaceholder: 'The fee amount...',
    explanation: 'represents the number of units to assess as a fee',
  },
  customFee: {
    paramKey: 'customFee',
    explanation: {
      off: 'No fixed fee will be set. Token created will be free of charge during CryptoTransfer',
      on: ' A fixed fee will be set. An additional amount of the token will be transferred to the specified collection account(s) every time a token transfer is initiated',
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

/**
 * @notice an object that holds constant values for the parameters used in token mint.
 */
export const htsTokenMintParamFields = {
  tokenAddressToMint: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'tokenAddressToMint',
    inputPlaceholder: 'Hedera token address...',
    explanation: 'represents the address of the Hedera token for which minting will be performed.',
  },
  amount: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    paramKey: 'amount',
    inputType: 'number',
    inputPlaceholder: 'Amount to mint...',
    explanation: 'represents the amount you wish to mint for the specified Hedera token.',
  },
  metadata: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'metadata',
    inputPlaceholder: 'Metadata...',
    explanation:
      'Provide additional information about the minting process if needed. Each metadata is allocated to a new NFT.',
  },
  recipientAddress: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'recipientAddress',
    inputPlaceholder: 'The receiver address (optional)...',
    explanation:
      'represents the address of the receiver who will receive the amount of newly minted tokens. If leave unset, the minted tokens will be sent to the treasury account.',
  },
};

export const htsTokenAssociateParamFields = {
  tokenAddresses: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'tokenAddresses',
    inputPlaceholder: 'Token addresses...',
    explanation: 'represents the tokens to be associated with the provided account',
  },
  associatingAddress: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'associatingAddress',
    inputPlaceholder: 'Associating account...',
    explanation: 'represents the account to be associated with the provided tokens',
  },
};

export const htsGrantTokenKYCParamFields = {
  hederaTokenAddress: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'hederaTokenAddress',
    inputPlaceholder: 'Token address...',
    explanation: 'represents the token for which this account will be granted KYC.',
  },
  grantingKYCAccountAddress: {
    ...HEDERA_SHARED_PARAM_INPUT_FIELDS,
    inputType: 'text',
    paramKey: 'grantingKYCAccountAddress',
    inputPlaceholder: 'Account to grant KYC...',
    explanation: 'represents the account to be KYCed',
  },
};
