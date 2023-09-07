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
  second?: string;
  treasury?: string;
  decimals?: string;
  feeValue?: string;
  maxSupply?: string;
  initSupply?: string;
  serialNumber?: string;
  ownerAddress?: string;
  spenderAddress?: string;
  withCustomFee?: boolean;
  accountAddress?: string;
  feeTokenAddress?: string;
  keys?: CommonKeyObject[];
  autoRenewPeriod?: string;
  autoRenewAccount?: string;
  tokenAddresses?: string[];
  recipientAddress?: string;
  associatingAddress?: string;
  tokenAddressToMint?: string;
  hederaTokenAddress?: string;
  grantingKYCAccountAddress?: string;
  API:
    | 'TokenCreate'
    | 'Mint'
    | 'Associate'
    | 'GrantKYC'
    | 'UpdateTokenInfo'
    | 'UpdateTokenExpiry'
    | 'APPROVED_FUNGIBLE'
    | 'APPROVED_NON_FUNGIBLE'
    | 'SET_APPROVAL'
    | 'UpdateTokenRelation'
    | 'WIPE_FUNGIBLE'
    | 'WIPE_NON_FUNGIBLE'
    | 'BURN'
    | 'DELETE'
    | 'QueryTokenInfo'
    | 'QueryTokenInfo'
    | 'ALLOWANCE'
    | 'GET_APPROVED'
    | 'IS_APPROVAL'
    | 'QueryTokenStatus';
}
/** @dev handle sanitizing Hedera token form inputs */
export const handleSanitizeHederaFormInputs = ({
  API,
  name,
  keys,
  amount,
  symbol,
  second,
  decimals,
  treasury,
  feeValue,
  maxSupply,
  initSupply,
  ownerAddress,
  serialNumber,
  withCustomFee,
  spenderAddress,
  accountAddress,
  feeTokenAddress,
  autoRenewPeriod,
  recipientAddress,
  autoRenewAccount,
  tokenAddressToMint,
  associatingAddress,
  hederaTokenAddress,
  tokenAddresses,
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
    if (!sanitizeErr && feeValue === '') {
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
      tokenAddresses?.some((tokenAddress) => {
        if (tokenAddress.trim() === '') {
          sanitizeErr = `Token address cannot be empty.`;
          return true;
        } else if (!isAddress(tokenAddress)) {
          sanitizeErr = `${tokenAddress} is not a valid token address`;
          return true;
        }
      });
    }

    if (!sanitizeErr && typeof feeValue !== 'undefined' && feeValue === '') {
      sanitizeErr = 'Gas limit should be set for this transaction';
    }
  } else if (API === 'GrantKYC') {
    if (!isAddress(hederaTokenAddress)) {
      sanitizeErr = 'Invalid token address';
    } else if (!isAddress(grantingKYCAccountAddress)) {
      sanitizeErr = 'Invalid token address';
    }
  } else if (API === 'UpdateTokenInfo') {
    if (!isAddress(hederaTokenAddress)) {
      sanitizeErr = 'Invalid token address';
    } else if (name === '') {
      sanitizeErr = "Token name can't be empty";
    } else if (symbol === '') {
      sanitizeErr = "Token symbol can't be empty";
    } else if (!isAddress(treasury)) {
      sanitizeErr = 'Invalid treasury address';
    } else if (maxSupply === '' || Number(maxSupply) < 0) {
      sanitizeErr = 'Max supply cannot be negative';
    } else if (feeValue === '') {
      sanitizeErr = 'Gas limit should be set for this transaction';
    }
  } else if (API === 'UpdateTokenExpiry') {
    if (!isAddress(hederaTokenAddress)) {
      sanitizeErr = 'Invalid token address';
    } else if (second === '' || Number(second) < 0) {
      sanitizeErr = 'Invalid expiry time';
    } else if (!isAddress(autoRenewAccount)) {
      sanitizeErr = 'Invalid auto renew account address';
    } else if (autoRenewPeriod === '' || Number(autoRenewPeriod) < 0) {
      sanitizeErr = 'Invalid auto renew period';
    } else if (feeValue === '') {
      sanitizeErr = 'Gas limit should be set for this transaction';
    }
  } else if (API === 'APPROVED_FUNGIBLE') {
    if (!isAddress(hederaTokenAddress)) {
      sanitizeErr = 'Invalid token address';
    } else if (!isAddress(accountAddress)) {
      sanitizeErr = 'Invalid account address';
    } else if (amount === '' || Number(amount) < 0) {
      sanitizeErr = 'Invalid amount';
    } else if (feeValue === '') {
      sanitizeErr = 'Gas limit should be set for this transaction';
    }
  } else if (API === 'APPROVED_NON_FUNGIBLE') {
    if (!isAddress(hederaTokenAddress)) {
      sanitizeErr = 'Invalid token address';
    } else if (!isAddress(accountAddress)) {
      sanitizeErr = 'Invalid account address';
    } else if (serialNumber === '' || Number(serialNumber) < 0) {
      sanitizeErr = 'Invalid serial number approved';
    } else if (feeValue === '') {
      sanitizeErr = 'Gas limit should be set for this transaction';
    }
  } else if (API === 'SET_APPROVAL') {
    if (!isAddress(hederaTokenAddress)) {
      sanitizeErr = 'Invalid token address';
    } else if (!isAddress(accountAddress)) {
      sanitizeErr = 'Invalid account address';
    } else if (feeValue === '') {
      sanitizeErr = 'Gas limit should be set for this transaction';
    }
  } else if (API === 'UpdateTokenRelation') {
    if (!isAddress(hederaTokenAddress)) {
      sanitizeErr = 'Invalid token address';
    } else if (!isAddress(accountAddress)) {
      sanitizeErr = 'Invalid account address';
    } else if (feeValue === '') {
      sanitizeErr = 'Gas limit should be set for this transaction';
    }
  } else if (API === 'WIPE_FUNGIBLE') {
    if (!isAddress(hederaTokenAddress)) {
      sanitizeErr = 'Invalid token address';
    } else if (!isAddress(accountAddress)) {
      sanitizeErr = 'Invalid account address';
    } else if (amount === '' || Number(amount) < 0) {
      sanitizeErr = 'Invalid amount of token';
    } else if (feeValue === '') {
      sanitizeErr = 'Gas limit should be set for this transaction';
    }
  } else if (API === 'WIPE_NON_FUNGIBLE') {
    if (!isAddress(hederaTokenAddress)) {
      sanitizeErr = 'Invalid token address';
    } else if (!isAddress(accountAddress)) {
      sanitizeErr = 'Invalid account address';
    } else if (serialNumber === '') {
      sanitizeErr = "Serial numbers can't be empty";
    } else if (serialNumber) {
      serialNumber.split(',').some((serialNum) => {
        if (Number(serialNum) < 0 || Number.isNaN(Number(serialNum))) {
          sanitizeErr = `${serialNum} is not a valid serial number`;
          return true;
        }
      });
    }
    if (!sanitizeErr && feeValue === '') {
      sanitizeErr = 'Gas limit should be set for this transaction';
    }
  } else if (API === 'BURN') {
    if (!isAddress(hederaTokenAddress)) {
      sanitizeErr = 'Invalid token address';
    } else if (Number(amount) < 0) {
      sanitizeErr = 'Invalid amount of token';
    } else if (serialNumber) {
      serialNumber.split(',').some((serialNum) => {
        if (Number(serialNum) < 0 || Number.isNaN(Number(serialNum))) {
          sanitizeErr = `${serialNum} is not a valid serial number`;
          return true;
        }
      });
    }

    if (!sanitizeErr && feeValue === '') {
      sanitizeErr = 'Gas limit should be set for this transaction';
    }
  } else if (API === 'DELETE') {
    if (!isAddress(hederaTokenAddress)) {
      sanitizeErr = 'Invalid token address';
    } else if (feeValue === '') {
      sanitizeErr = 'Gas limit should be set for this transaction';
    }
  } else if (API === 'QueryTokenInfo') {
    if (!isAddress(hederaTokenAddress)) {
      sanitizeErr = 'Invalid token address';
    }
  } else if (API === 'ALLOWANCE' || API === 'IS_APPROVAL') {
    if (!isAddress(hederaTokenAddress)) {
      sanitizeErr = 'Invalid token address';
    } else if (!isAddress(ownerAddress)) {
      sanitizeErr = 'Invalid owner address';
    } else if (!isAddress(spenderAddress)) {
      sanitizeErr = 'Invalid spender address';
    }
  } else if (API === 'GET_APPROVED') {
    if (!isAddress(hederaTokenAddress)) {
      sanitizeErr = 'Invalid token address';
    } else if (serialNumber === '' || Number(serialNumber) < 0) {
      sanitizeErr = 'Invalid serial number';
    }
  } else if (API === 'QueryTokenStatus') {
    if (!isAddress(hederaTokenAddress)) {
      sanitizeErr = 'Invalid token address';
    } else if (!isAddress(accountAddress)) {
      sanitizeErr = 'Invalid account address';
    }
  }

  return sanitizeErr;
};
