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
  IHederaTokenServiceKeyType,
  TokenQuerySmartContractResult,
} from '@/types/contract-interactions/HTS';
import { Contract, isAddress } from 'ethers';
import { KEY_TYPE_MAP } from '@/utils/contract-interactions/HTS/token-create-custom/constant';
import { handleContractResponseWithDynamicEventNames } from '@/utils/contract-interactions/HTS/helpers';

/**
 * @dev queries token validity
 *
 * @dev integrates TokenQueryContract.isTokenPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param hederaTokenAddress: string
 *
 * @return Promise<TokenQuerySmartContractResult>
 */
export const queryTokenValidity = async (
  baseContract: Contract,
  hederaTokenAddress: string
): Promise<TokenQuerySmartContractResult> => {
  // sanitize param
  if (!isAddress(hederaTokenAddress)) {
    console.error('Invalid token address');
    return { err: 'Invalid token address' };
  }

  try {
    const transactionResult = await baseContract.isTokenPublic(hederaTokenAddress);
    // get transaction receipt
    const txReceipt = await transactionResult.wait();

    // retrieve information from event
    const { data } = txReceipt.logs.filter((event: any) => event.fragment.name === 'IsToken')[0];
    return { IsToken: data, transactionHash: txReceipt.hash };
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};

/**
 * @dev queries token general information
 *
 * @dev integrates TokenQueryContract.getTokenInfoPublic()
 *
 * @dev integrates TokenQueryContract.getFungibleTokenInfoPublic()
 *
 * @dev integrates TokenQueryContract.getNonFungibleTokenInfoPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param API: "TOKEN_INFO" | "FUNGIBLE_INFO" | "NON_FUNFIBLE_INFO"
 *
 * @param hederaTokenAddress: string
 *
 * @param serialNumber?: number
 *
 * @return Promise<TokenQuerySmartContractResult>
 */
export const queryTokenGeneralInfomation = async (
  baseContract: Contract,
  API: 'TOKEN_INFO' | 'FUNGIBLE_INFO' | 'NON_FUNFIBLE_INFO',
  hederaTokenAddress: string,
  serialNumber?: number
): Promise<TokenQuerySmartContractResult> => {
  // sanitize param
  if (!isAddress(hederaTokenAddress)) {
    console.error('Invalid token address');
    return { err: 'Invalid token address' };
  } else if (serialNumber && serialNumber < 0) {
    console.error('Invalid serial number');
    return { err: 'Invalid serial number' };
  }

  // prepare events map
  const eventMaps = {
    TOKEN_INFO: 'TokenInfo',
    FUNGIBLE_INFO: 'FungibleTokenInfo',
    NON_FUNFIBLE_INFO: 'NonFungibleTokenInfo',
  };

  // invoking contract methods
  try {
    let transactionResult;
    switch (API) {
      case 'TOKEN_INFO':
        // prepare transaction
        transactionResult = await baseContract.getTokenInfoPublic(hederaTokenAddress);
        break;
      case 'FUNGIBLE_INFO':
        // prepare transaction
        transactionResult = await baseContract.getFungibleTokenInfoPublic(hederaTokenAddress);
        break;
      case 'NON_FUNFIBLE_INFO':
        if (!serialNumber) {
          console.error('Serial number is needed for querying NON_FUNGIBLE_INFO');
          return { err: 'Serial number is needed for querying NON_FUNGIBLE_INFO' };
        } else {
          // prepare transaction
          transactionResult = await baseContract.getNonFungibleTokenInfoPublic(
            hederaTokenAddress,
            serialNumber
          );
        }
        break;
    }

    return await handleContractResponseWithDynamicEventNames(transactionResult, eventMaps, API);
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};

/**
 * @dev queries token's certain information fields
 *
 * @dev integrates TokenQueryContract.getTokenDefaultFreezeStatusPublic()
 *
 * @dev integrates TokenQueryContract.getTokenDefaultKycStatusPublic()
 *
 * @dev integrates TokenQueryContract.getTokenCustomFeesPublic()
 *
 * @dev integrates TokenQueryContract.getTokenExpiryInfoPublic()
 *
 * @dev integrates TokenQueryContract.getTokenTypePublic()
 *
 * @dev integrates TokenQueryContract.getTokenKeyPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param API: "DEFAULT_FREEZE_STATUS" | "DEFAULT_KYC_STATUS" | "CUSTOM_FEES" | "TOKEN_EXPIRY" | "TOKEN_TYPE" | "TOKEN_KEYS"
 *
 * @param hederaTokenAddress: string
 *
 * @param keyType?: IHederaTokenServiceKeyType
 *
 * @return Promise<TokenQuerySmartContractResult>
 */
export const queryTokenSpecificInfomation = async (
  baseContract: Contract,
  API:
    | 'TOKEN_TYPE'
    | 'TOKEN_KEYS'
    | 'CUSTOM_FEES'
    | 'TOKEN_EXPIRY'
    | 'DEFAULT_KYC_STATUS'
    | 'DEFAULT_FREEZE_STATUS',
  hederaTokenAddress: string,
  keyType?: IHederaTokenServiceKeyType
): Promise<TokenQuerySmartContractResult> => {
  // sanitize param
  if (!isAddress(hederaTokenAddress)) {
    console.error('Invalid token address');
    return { err: 'Invalid token address' };
  }

  // prepare events map
  const eventMaps = {
    TOKEN_TYPE: 'TokenType',
    TOKEN_KEYS: 'TokenKey',
    CUSTOM_FEES: 'TokenCustomFees',
    TOKEN_EXPIRY: 'TokenExpiryInfo',
    DEFAULT_KYC_STATUS: 'TokenDefaultKycStatus',
    DEFAULT_FREEZE_STATUS: 'TokenDefaultFreezeStatus',
  };

  // invoking contract methods
  try {
    let transactionResult;
    switch (API) {
      case 'DEFAULT_FREEZE_STATUS':
        transactionResult = await baseContract.getTokenDefaultFreezeStatusPublic(
          hederaTokenAddress
        );
        break;

      case 'DEFAULT_KYC_STATUS':
        transactionResult = await baseContract.getTokenDefaultKycStatusPublic(hederaTokenAddress);
        break;

      case 'CUSTOM_FEES':
        transactionResult = await baseContract.getTokenCustomFeesPublic(hederaTokenAddress);
        break;

      case 'TOKEN_EXPIRY':
        transactionResult = await baseContract.getTokenExpiryInfoPublic(hederaTokenAddress);
        break;
      case 'TOKEN_TYPE':
        transactionResult = await baseContract.getTokenTypePublic(hederaTokenAddress);
        break;
      case 'TOKEN_KEYS':
        if (!keyType) {
          console.error('Key Type is needed for querying NON_FUNGIBLE_INFO');
          return { err: 'Key Type is needed for querying NON_FUNGIBLE_INFO' };
        } else {
          transactionResult = await baseContract.getTokenKeyPublic(
            hederaTokenAddress,
            KEY_TYPE_MAP[keyType]
          );
        }
        break;
    }

    return await handleContractResponseWithDynamicEventNames(transactionResult, eventMaps, API);
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};

/**
 * @dev queries token's permission information
 *
 * @dev integrates TokenQueryContract.allowancePublic()
 *
 * @dev integrates TokenQueryContract.getApprovedPublic()
 *
 * @dev integrates TokenQueryContract.isApprovedForAllPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param API: "ALLOWANCE" | "GET_APPROVED" | "IS_APPROVAL"
 *
 * @param hederaTokenAddress: string
 *
 * @param ownerAddress?: string
 *
 * @param spenderAddress?: string
 *
 * @param serialNumber?: number
 *
 * @return Promise<TokenQuerySmartContractResult>
 */
export const queryTokenPermissionInformation = async (
  baseContract: Contract,
  API: 'ALLOWANCE' | 'GET_APPROVED' | 'IS_APPROVAL',
  hederaTokenAddress: string,
  ownerAddress?: string,
  spenderAddress?: string,
  serialNumber?: number
): Promise<TokenQuerySmartContractResult> => {
  // sanitize param
  if (!isAddress(hederaTokenAddress)) {
    console.error('Invalid token address');
    return { err: 'Invalid token address' };
  } else if (ownerAddress && !isAddress(ownerAddress)) {
    console.error('Invalid owner address');
    return { err: 'Invalid owner address' };
  } else if (spenderAddress && !isAddress(spenderAddress)) {
    console.error('Invalid spender address');
    return { err: 'Invalid spender address' };
  } else if (serialNumber && serialNumber < 0) {
    console.error('Invalid serial number');
    return { err: 'Invalid serial number' };
  }

  // prepare events map
  const eventMaps = {
    IS_APPROVAL: 'Approved',
    ALLOWANCE: 'AllowanceValue',
    GET_APPROVED: 'ApprovedAddress',
  };

  let transactionResult, errMsg;
  // invoking contract methods
  try {
    switch (API) {
      case 'ALLOWANCE':
        if (!ownerAddress) {
          errMsg = 'Owner address is needed for ALLOWANCE API';
        } else if (!spenderAddress) {
          errMsg = 'Spender address is needed for ALLOWANCE API';
        } else {
          transactionResult = await baseContract.allowancePublic(
            hederaTokenAddress,
            ownerAddress,
            spenderAddress
          );
        }
        break;
      case 'GET_APPROVED':
        if (!serialNumber) {
          errMsg = 'Serial number is needed for GET_APPROVED API';
        } else {
          transactionResult = await baseContract.getApprovedPublic(
            hederaTokenAddress,
            serialNumber
          );
        }
        break;
      case 'IS_APPROVAL':
        if (!ownerAddress) {
          errMsg = 'Owner address is needed for IS_APPROVAL API';
        } else if (!spenderAddress) {
          errMsg = 'Spender address is needed for IS_APPROVAL API';
        } else {
          transactionResult = await baseContract.isApprovedForAllPublic(
            hederaTokenAddress,
            ownerAddress,
            spenderAddress
          );
        }
        break;
    }

    // return err if any
    if (errMsg) {
      console.error(errMsg);
      return { err: errMsg };
    } else if (!transactionResult) {
      console.error('Cannot execute contract methods');
      return { err: 'Cannot execute contract methods' };
    }

    return await handleContractResponseWithDynamicEventNames(transactionResult, eventMaps, API);
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};

/**
 * @dev queries token's relation information
 *
 * @dev integrates TokenQueryContract.isKycPublic()
 *
 * @dev integrates TokenQueryContract.isFrozenPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param API: "IS_KYC" | "IS_FROZEN"
 *
 * @param hederaTokenAddress: string
 *
 * @param ownerAddress?: string
 *
 * @param spenderAddress?: string
 *
 * @param serialNumber?: number
 *
 * @return Promise<TokenQuerySmartContractResult>
 */
export const queryTokenRelationInformation = async (
  baseContract: Contract,
  API: 'IS_KYC' | 'IS_FROZEN',
  hederaTokenAddress: string,
  accountAddress: string
): Promise<TokenQuerySmartContractResult> => {
  // sanitize param
  if (!isAddress(hederaTokenAddress)) {
    console.error('Invalid token address');
    return { err: 'Invalid token address' };
  } else if (accountAddress && !isAddress(accountAddress)) {
    console.error('Invalid owner address');
    return { err: 'Invalid owner address' };
  }

  // prepare events map
  const eventMaps = {
    IS_KYC: 'KycGranted',
    IS_FROZEN: 'Frozen',
  };

  // invoking contract methods
  try {
    let transactionResult;
    switch (API) {
      case 'IS_KYC':
        transactionResult = await baseContract.isKycPublic(hederaTokenAddress, accountAddress);
        break;

      case 'IS_FROZEN':
        transactionResult = await baseContract.isFrozenPublic(hederaTokenAddress, accountAddress);
        break;
    }

    return await handleContractResponseWithDynamicEventNames(transactionResult, eventMaps, API);
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};
