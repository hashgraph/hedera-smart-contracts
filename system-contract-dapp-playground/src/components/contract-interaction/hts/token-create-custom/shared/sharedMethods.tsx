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
import { Dispatch, SetStateAction } from 'react';
import { CommonErrorToast } from '@/components/toast/CommonToast';
import { isCompressedPublicKey } from '@/utils/contract-interactions/HTS/helpers';

/** @dev the type for transaction results */
export type TransactionResult = {
  status: 'sucess' | 'fail';
  txHash: string;
  tokenAddress: string;
};

/** @dev handle updating number of keys*/
export const handleAddingOrRemovingKeys = (
  type: 'ADD' | 'REMOVE',
  chosenKeys: Set<IHederaTokenServiceKeyType>,
  HederaTokenKeyTypes: IHederaTokenServiceKeyType[],
  setKeys: Dispatch<SetStateAction<CommonKeyObject[]>>,
  setChosenKeys: Dispatch<SetStateAction<Set<IHederaTokenServiceKeyType>>>,
  setKeyTypesToShow: Dispatch<SetStateAction<Set<IHederaTokenServiceKeyType>>>,
  removingKeyType?: IHederaTokenServiceKeyType
) => {
  if (type === 'ADD') {
    HederaTokenKeyTypes.some((keyType) => {
      if (!chosenKeys.has(keyType)) {
        setKeys((prev) => [
          ...prev,
          { keyType: keyType, keyValueType: 'inheritAccountKey', keyValue: '' },
        ]);

        setChosenKeys((prev) => new Set(prev).add(keyType));

        setKeyTypesToShow((prev) => {
          prev.delete(keyType);
          return prev;
        });
        return true; // Exit the loop after the first condition is met
      }
    });
  } else {
    // removing case
    setKeys((prev) => prev.filter((deleteKey) => deleteKey.keyType !== removingKeyType));
    setChosenKeys((prev) => {
      prev.delete(removingKeyType!);
      return new Set(prev);
    });
    setKeyTypesToShow((prev) => new Set(prev).add(removingKeyType!));
  }
};

/** @dev handle key type on change by selecting an option from drop-down*/
export const handleKeyTypeOnChange = (
  e: any,
  currentKey: CommonKeyObject,
  setKeys: Dispatch<SetStateAction<CommonKeyObject[]>>,
  setChosenKeys: Dispatch<SetStateAction<Set<IHederaTokenServiceKeyType>>>,
  setKeyTypesToShow: Dispatch<SetStateAction<Set<IHederaTokenServiceKeyType>>>
) => {
  let newKeyType = e.target.value;
  // @notice as the currentKey is based on `keys` array, must reserve the currentKey first
  let currentKeyType = currentKey.keyType;

  setKeys((prev) =>
    prev.map((key) => {
      if (key.keyType === currentKey.keyType) {
        key.keyType = newKeyType;
        key.keyValue = '';
      }
      return key;
    })
  );

  setChosenKeys((prev) => {
    prev.delete(currentKeyType);
    prev.add(newKeyType);
    return prev;
  });

  setKeyTypesToShow((prev) => {
    prev.delete(newKeyType);
    prev.add(currentKeyType);
    return prev;
  });
};

/** @dev handle key value type on change by selecting an option from drop-down */
export const handleKeyValueTypeOnChange = (
  e: any,
  currentKey: CommonKeyObject,
  setKeys: Dispatch<SetStateAction<CommonKeyObject[]>>
) => {
  setKeys((prev) =>
    prev.map((key) => {
      if (key.keyType === currentKey.keyType) {
        key.keyValueType = e.target.value;
        key.keyValue = '';
      }
      return key;
    })
  );
};

/** @dev handle updating key values */
export const handleUpdateKeyValue = (
  e: any,
  currentKey: CommonKeyObject,
  setKeys: Dispatch<SetStateAction<CommonKeyObject[]>>
) => {
  setKeys((prev) =>
    prev.map((key) => {
      if (key.keyType === currentKey.keyType) {
        key.keyValue =
          currentKey.keyValueType === 'inheritAccountKey'
            ? e.target.value === ''
              ? ''
              : JSON.parse(e.target.value)
            : e.target.value;
      }
      return key;
    })
  );
};

/** @dev handle sanitizing Hedera token form inputs */
export const handleSanitizeHederaFormInputs = (
  name?: string,
  symbol?: string,
  maxSupply?: string,
  decimals?: string,
  withCustomFee?: boolean,
  feeTokenAddress?: string,
  treasury?: string,
  keys?: CommonKeyObject[]
) => {
  // sanitize params
  let sanitizeErr;
  if (name === '') {
    sanitizeErr = "Token name can't be empty";
  } else if (symbol === '') {
    sanitizeErr = "Token symbol can't be empty";
  } else if (maxSupply === '') {
    sanitizeErr = "Max supply can't be empty";
  } else if (decimals === '') {
    sanitizeErr = "Decimals can't be empty";
  } else if (withCustomFee && !isAddress(feeTokenAddress)) {
    sanitizeErr = 'Invalid denomination token ID';
  } else if (!isAddress(treasury)) {
    sanitizeErr = 'Invalid treasury account address';
  }

  // sanitize keys
  if (keys) {
    keys.forEach((key) => {
      if (key.keyValue === '') {
        sanitizeErr = `${key.keyType} key cannot be empty. If you do not intend to set up this key, kindly remove it.`;
      } else if (
        (key.keyValueType === 'contractId' || key.keyValueType === 'delegatableContractId') &&
        !isAddress(key.keyValue)
      ) {
        sanitizeErr = `${key.keyType} key lacks a valid account ID.`;
      } else if (
        (key.keyValueType === 'ECDSA_secp256k1' || key.keyValueType === 'ed25519') &&
        !isCompressedPublicKey(key.keyValue as string)
      ) {
        sanitizeErr = `The provided key value for ${key.keyType} key does not constitute a valid compressed public key.`;
      }
    });
  }

  return sanitizeErr;
};

/** @dev handle error returned back from invoking method APIs*/
export const handleAPIErrors = (
  err: any,
  toaster: any,
  transactionHash: string | undefined,
  setTransactionResults: Dispatch<SetStateAction<TransactionResult[]>>
) => {
  const errorMessage = JSON.stringify(err);
  let errorDescription = "See client's console for more information";
  // @notice 4001 error code is returned when a metamask wallet request is rejected by the user
  // @notice See https://docs.metamask.io/wallet/reference/provider-api/#errors for more information on the error returned by Metamask.
  if (errorMessage.indexOf('4001') !== -1) {
    errorDescription = 'You have rejected the request.';
  } else if (errorMessage.indexOf('nonce has already been used') !== -1) {
    errorDescription = 'Nonce has already been used. Please try again!';
  }

  // @notice if a transaction hash is returned, that means the transaction did make to the system contract but got reverted
  if (transactionHash) {
    setTransactionResults((prev) => [
      ...prev,
      { txHash: transactionHash, tokenAddress: '', status: 'fail' },
    ]);

    CommonErrorToast({
      toaster,
      title: `Create fungible token transaction got reverted`,
      description: errorDescription,
    });
  } else {
    CommonErrorToast({
      toaster,
      title: `Cannot execute create fungible token function`,
      description: errorDescription,
    });
  }
};
