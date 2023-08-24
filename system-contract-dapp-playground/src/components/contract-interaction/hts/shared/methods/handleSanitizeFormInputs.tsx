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

import { isAddress } from 'ethers';
import { CommonKeyObject } from '@/types/contract-interactions/HTS';
import { isCompressedPublicKey } from '@/utils/contract-interactions/HTS/helpers';

interface ParamsProps {
  name?: string;
  amount?: string;
  symbol?: string;
  treasury?: string;
  decimals?: string;
  msgValue?: string;
  maxSupply?: string;
  initSupply?: string;
  withCustomFee?: boolean;
  feeTokenAddress?: string;
  keys?: CommonKeyObject[];
  recipientAddress?: string;
  associatingAddress?: string;
  tokenAddressToMint?: string;
  hederaTokenAddress?: string;
  tokenAddressesArray?: string[];
  grantingKYCAccountAddress?: string;
  API: 'TokenCreate' | 'Mint' | 'Associate' | 'GrantKYC';
}
/** @dev handle sanitizing Hedera token form inputs */
export const handleSanitizeHederaFormInputs = ({
  API,
  name,
  keys,
  amount,
  symbol,
  msgValue,
  decimals,
  treasury,
  maxSupply,
  initSupply,
  withCustomFee,
  feeTokenAddress,
  recipientAddress,
  tokenAddressToMint,
  associatingAddress,
  hederaTokenAddress,
  tokenAddressesArray,
  grantingKYCAccountAddress,
}: ParamsProps) => {
  // sanitize params
  let sanitizeErr;
  if (API === 'TokenCreate') {
    if (name === '') {
      sanitizeErr = "Token name can't be empty";
    } else if (symbol === '') {
      sanitizeErr = "Token symbol can't be empty";
    } else if (Number(initSupply) < 0) {
      sanitizeErr = 'Invalid initial supply';
    } else if (maxSupply === '' || Number(maxSupply) < 0) {
      sanitizeErr = 'Invalid max supply';
    } else if (decimals === '' || Number(decimals) < 0) {
      sanitizeErr = 'Invalid decimals';
    } else if (withCustomFee && !isAddress(feeTokenAddress)) {
      sanitizeErr = 'Invalid denomination token ID';
    } else if (!isAddress(treasury)) {
      sanitizeErr = 'Invalid treasury account address';
    }
    // sanitize keys
    if (!sanitizeErr && keys) {
      keys.some((key) => {
        if (key.keyValue === '') {
          sanitizeErr = `${key.keyType} key cannot be empty. If you do not intend to set up this key, kindly remove it.`;
          return true;
        } else if (
          (key.keyValueType === 'contractId' || key.keyValueType === 'delegatableContractId') &&
          !isAddress(key.keyValue)
        ) {
          sanitizeErr = `${key.keyType} key lacks a valid account ID.`;
          return true;
        } else if (
          (key.keyValueType === 'ECDSA_secp256k1' || key.keyValueType === 'ed25519') &&
          !isCompressedPublicKey(key.keyValue as string)
        ) {
          sanitizeErr = `The provided key value for ${key.keyType} key does not constitute a valid compressed public key.`;
          return true;
        }
      });
    }

    // service fee
    if (!sanitizeErr && msgValue === '') {
      sanitizeErr = 'Service fee field cannot be empty';
    }
  } else if (API === 'Mint') {
    if (!isAddress(tokenAddressToMint)) {
      sanitizeErr = 'Invalid Hedera token address';
    } else if (Number(amount) < 0) {
      sanitizeErr = 'Invalid amount to mint';
    } else if (recipientAddress && !isAddress(recipientAddress)) {
      sanitizeErr = 'Invalid receiver address';
    }
  } else if (API === 'Associate') {
    if (!isAddress(associatingAddress)) {
      sanitizeErr = 'Invalid associating account address';
    } else {
      tokenAddressesArray?.some((tokenAddress) => {
        if (!isAddress(tokenAddress)) {
          sanitizeErr = `${tokenAddress} is not a valid token address`;
          return true;
        }
      });
    }
  } else if (API === 'GrantKYC') {
    if (!isAddress(hederaTokenAddress)) {
      sanitizeErr = 'Invalid token address';
    } else if (!isAddress(grantingKYCAccountAddress)) {
      sanitizeErr = 'Invalid token address';
    }
  }

  return sanitizeErr;
};
