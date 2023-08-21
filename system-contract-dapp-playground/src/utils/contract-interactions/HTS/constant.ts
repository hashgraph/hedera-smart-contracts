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

/**
 * @notice an object to map key type to the specific bit value
 *
 * @see https://github.com/hashgraph/hedera-smart-contracts/blob/main/contracts/hts-precompile/IHederaTokenService.sol#L128C22-L128C22
 */
export const KEY_TYPE_MAP: Record<IHederaTokenServiceKeyType, IHederaTokenServiceKeyTypeBitValue> =
  {
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

export const htsFungibleTokenCreateParamFields = {
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
    inputPlaceholder: 'A memo associated with the token...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'memo',
    explanation: 'represents an optional note that can be attached to a token transfer',
  },
  initSupply: {
    inputType: 'number',
    inputPlaceholder: 'Initial supply...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'initSupply',
    explanation: 'represents the starting amount of tokens available when the token is deployed',
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
  decimals: {
    inputType: 'number',
    inputPlaceholder: 'Decimal places...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'decimals',
    explanation: 'Determines token divisibility and decimal precision',
  },
  treasury: {
    inputType: 'text',
    inputPlaceholder: 'The token treasury account ID...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'treasury',
    limited_explanation: 'Currently, the treasury is limited to the ID of the base contract.',
    explanation:
      'represents the account will receive the specified initial supply or the newly minted NFTs',
  },
  feeTokenAddress: {
    inputType: 'text',
    inputPlaceholder: 'The denomination token ID...',
    inputSize: 'md',
    inputFocusBorderColor: '#A98DF4',
    inputClassname: 'w-full border-white/30',
    paramKey: 'feeTokenAddress',
    explanation: 'represents the ID of token that is used for fixed fee denomination',
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
