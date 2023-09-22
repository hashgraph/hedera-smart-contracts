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
  EXPIRY_KEYS,
  KEY_VALUE_KEYS,
  FIXED_FEES_KEYS,
  CUSTOM_FEES_KEYS,
  TOKEN_INFO_NFT_KEYS,
  FRACTIONAL_FEES_KEYS,
  TOKEN_INFO_BASIC_KEYS,
  TOKEN_INFO_ADVANCED_KEYS,
} from './token-query/constant';
import { isAddress } from 'ethers';
import { ISmartContractExecutionResult } from '@/types/contract-interactions/shared';
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
 * @dev prepares a list of IHederaTokenService.TokenKey typed keys with a ICommonKeyObject[] input
 *
 * @param inputKeys: ICommonKeyObject[]
 *
 * @return IHederaTokenServiceTokenKey[]
 *
 * @return err: ICommonKeyObject[]
 */
export const prepareHederaTokenKeyArray = (inputKeys: ICommonKeyObject[]) => {
  let constructingKeyError: ICommonKeyObject[] = [];
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
): Promise<ISmartContractExecutionResult> => {
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

/**
 * @dev handle responses while interacting with contract APIs
 *
 * @param transactionResult: any,
 *
 * @param errMsg: string
 */
export const handleContractResponseWithDynamicEventNames = async (
  transactionResult: any,
  eventMaps?: any,
  API?: any
): Promise<ISmartContractExecutionResult> => {
  // get transaction receipt
  const txReceipt = await transactionResult.wait();

  // retrieve information from event
  const { data } = txReceipt.logs.filter((event: any) => event.fragment.name === eventMaps[API])[0];
  return { [eventMaps[API]]: data, transactionHash: txReceipt.hash };
};

/**
 * @dev convert an `args` Proxy object returned from events to HTS Token Info object
 *
 * @notice applicable for QueryGeneralInfo APIs
 */
export const convertsArgsProxyToHTSTokenInfo = (
  proxyObj: any,
  API: 'TOKEN' | 'FUNGIBLE' | 'NON_FUNFIBLE'
) => {
  // prepare states
  const htsTokenInfoKeys = ['token', ...TOKEN_INFO_ADVANCED_KEYS];
  const htsNFTTokenInfoKeys = ['tokenInfo', ...TOKEN_INFO_NFT_KEYS];
  const commonProxyObject = API === 'TOKEN' ? proxyObj : proxyObj.tokenInfo;
  const htsTokenInfo = {} as any;
  htsTokenInfoKeys.forEach((key) => {
    if (key === 'token') {
      const htsHederaToken = {} as any;
      TOKEN_INFO_BASIC_KEYS.forEach((key) => {
        const value = commonProxyObject.token[key];
        htsHederaToken[key] = typeof value === 'bigint' ? value.toString() : value;
      });
      htsTokenInfo[key] = htsHederaToken;
    } else {
      const value = commonProxyObject[key];
      htsTokenInfo[key] = typeof value === 'bigint' ? value.toString() : value;
    }
  });

  switch (API) {
    case 'TOKEN': {
      return htsTokenInfo as IHederaTokenServiceTokenInfo;
    }
    case 'FUNGIBLE': {
      const htsFungibleTokenInfo = {
        tokenInfo: htsTokenInfo as IHederaTokenServiceTokenInfo,
        decimals: Number(proxyObj.decimals.toString()),
      };

      return htsFungibleTokenInfo as IHederaTokenServiceFungibleTokenInfo;
    }
    case 'NON_FUNFIBLE': {
      const htsNonFungibleTokenInfo = {} as any;
      htsNFTTokenInfoKeys.forEach((key) => {
        if (key === 'tokenInfo') {
          htsNonFungibleTokenInfo[key] = htsTokenInfo as IHederaTokenServiceTokenInfo;
        } else {
          const value = proxyObj[key];
          htsNonFungibleTokenInfo[key] = typeof value === 'bigint' ? value.toString() : value;
        }
      });
      return htsNonFungibleTokenInfo as IHederaTokenServiceNonFungibleTokenInfo;
    }
  }
};

/**
 * @dev convert an `args` Proxy object returned from events to HTS FEES/KEYS/EXPIRY info
 *
 * @notice applicable for QuerySpecificInfo APIs
 */
export const convertsArgsProxyToHTSSpecificInfo = (
  proxyObj: any,
  API: 'CUSTOM_FEES' | 'TOKEN_EXPIRY' | 'TOKEN_KEYS'
) => {
  // prepare states

  switch (API) {
    case 'CUSTOM_FEES':
      let htsFeesInfo = {
        fixedFees: [] as IHederaTokenServiceFixedFee[],
        fractionalFees: [] as IHederaTokenServiceFractionalFee[],
        royaltyFees: [] as IHederaTokenServiceRoyaltyFee[],
      };

      CUSTOM_FEES_KEYS.forEach((customFeesKey) => {
        proxyObj[customFeesKey].forEach((fee: any) => {
          const customFee = {} as any;
          let keysArray = [];
          if (customFeesKey === 'fixedFees') {
            keysArray = FIXED_FEES_KEYS;
          } else if (customFeesKey === 'fractionalFees') {
            keysArray = FRACTIONAL_FEES_KEYS;
          } else {
            keysArray = FRACTIONAL_FEES_KEYS;
          }
          keysArray.forEach((key: any) => {
            const value = fee[key];
            customFee[key] = typeof value === 'bigint' ? value.toString() : value;
          });
          htsFeesInfo[customFeesKey].push(customFee);
        });
      });
      return htsFeesInfo;

    case 'TOKEN_EXPIRY': {
      let htsExpiryInfo = {} as any;
      EXPIRY_KEYS.forEach((key) => {
        const value = proxyObj.expiryInfo[key];
        htsExpiryInfo[key] = typeof value === 'bigint' ? value.toString() : value;
      });
      return htsExpiryInfo as IHederaTokenServiceExpiry;
    }

    case 'TOKEN_KEYS': {
      let htsKeysInfo = {} as any;
      KEY_VALUE_KEYS.forEach((key) => {
        const value = proxyObj.key[key];
        htsKeysInfo[key] = typeof value === 'bigint' ? value.toString() : value;
      });
      return htsKeysInfo as IHederaTokenServiceKeyValueType;
    }
  }
};
