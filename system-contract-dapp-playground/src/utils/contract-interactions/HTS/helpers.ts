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
import {
  CommonKeyObject,
  IHederaTokenServiceKeyType,
  IHederaTokenServiceTokenKey,
  IHederaTokenServiceKeyValueType,
  TokenManagementSmartContractResult,
} from '@/types/contract-interactions/HTS';
import { KEY_TYPE_MAP, DEFAULT_IHTS_KEY_VALUE } from './token-create-custom/constant';

/**
 * @dev tests if the input conforms to the common compressed public key standard
 *
 * @param compressedPublicKey: string
 *
 * @return boolean
 */
export const isCompressedPublicKey = (compressedPublicKey: string): boolean => {
  const compressedPublicKeyPattern = /^0x(02|03)[0-9a-fA-F]{64}$/;
  return compressedPublicKeyPattern.test(compressedPublicKey);
};

/**
 * @dev Constructs a key conforming to the IHederaTokenService.TokenKey type
 *
 * @param keyType: IHederaTokenServiceKeyType
 *
 * @param keyValueType: IHederaTokenServiceKeyValueType
 *
 * @param keyValue: string | boolean
 *
 * @return IHederaTokenServiceTokenKey
 */
export const constructIHederaTokenKey = (
  inputKeyType: IHederaTokenServiceKeyType,
  inputKeyValueType: IHederaTokenServiceKeyValueType,
  inputKeyValue: string | boolean
): IHederaTokenServiceTokenKey | null => {
  // sanitize params and prepare keyValue
  let keyValue;
  if (inputKeyValueType === 'inheritAccountKey') {
    keyValue = inputKeyValue as boolean;
  } else if (inputKeyValueType === 'contractId' || inputKeyValueType === 'delegatableContractId') {
    if (!isAddress(inputKeyValue as string)) {
      return null;
    } else {
      keyValue = inputKeyValue as string;
    }
  } else {
    if (!isCompressedPublicKey(inputKeyValue as string)) {
      return null;
    } else {
      keyValue = Buffer.from((inputKeyValue as string).replace('0x', ''), 'hex');
    }
  }

  return {
    keyType: KEY_TYPE_MAP[inputKeyType],
    key: { ...DEFAULT_IHTS_KEY_VALUE, [inputKeyValueType]: keyValue },
  };
};

/**
 * @dev prepares a list of IHederaTokenService.TokenKey typed keys with a CommonKeyObject[] input
 *
 * @param inputKeys: CommonKeyObject[]
 *
 * @return IHederaTokenServiceTokenKey[]
 *
 * @return err: CommonKeyObject[]
 */
export const prepareHederaTokenKeyArray = (inputKeys: CommonKeyObject[]) => {
  let constructingKeyError: CommonKeyObject[] = [];
  const hederaTokenKeys = inputKeys.map((inputKey) => {
    // construct IHederaTokenKey
    const hederaTokenKey = constructIHederaTokenKey(
      inputKey.keyType,
      inputKey.keyValueType,
      inputKey.keyValue
    );

    // push the invalid keys to the error list
    if (!hederaTokenKey) {
      constructingKeyError.push({
        keyType: inputKey.keyType,
        keyValueType: inputKey.keyValueType,
        keyValue: inputKey.keyValue,
        err: 'Invalid key value',
      });
    }

    // return the new token key
    return hederaTokenKey;
  });

  if (constructingKeyError.length > 0) {
    return { err: constructingKeyError };
  } else {
    return { hederaTokenKeys: hederaTokenKeys as IHederaTokenServiceTokenKey[] };
  }
};

/**
 * @dev handle responses while interacting with contract APIs
 *
 * @param transactionResult: any,
 *
 * @param errMsg: string
 */
export const handleContractResponse = async (
  transactionResult: any,
  errMsg?: any
): Promise<TokenManagementSmartContractResult> => {
  // return err if any
  if (errMsg) {
    console.error(errMsg);
    return { err: errMsg };
  } else if (!transactionResult) {
    console.error('Cannot execute contract methods');
    return { err: 'Cannot execute contract methods' };
  }

  // get transaction receipt
  const txReceipt = await transactionResult.wait();

  // retrieve responseCode from event
  const { data } = txReceipt.logs.filter((event: any) => event.fragment.name === 'ResponseCode')[0];

  // @notice: 22 represents the predefined response code from the Hedera system contracts, indicating a successful transaction.
  return { result: Number(data) === 22, transactionHash: txReceipt.hash };
};
