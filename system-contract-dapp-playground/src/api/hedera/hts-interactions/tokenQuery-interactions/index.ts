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

import { Contract, ethers, isAddress } from 'ethers';
import { ISmartContractExecutionResult } from '@/types/contract-interactions/shared';
import { KEY_TYPE_MAP } from '@/utils/contract-interactions/HTS/token-create-custom/constant';
import {
  convertsArgsProxyToHTSSpecificInfo,
  convertsArgsProxyToHTSTokenInfo,
  handleContractResponseWithDynamicEventNames,
} from '@/utils/contract-interactions/HTS/helpers';
import { TNetworkName } from '@/types/common';
import { handleEstimateGas } from '@/utils/common/helpers';

/**
 * @dev queries token validity
 *
 * @dev integrates TokenQueryContract.isTokenPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param signerAddress: ethers.AddressLike
 *
 * @param network: TNetworkName
 *
 * @param hederaTokenAddress: ethers.AddressLike
 *
 * @param gasLimit: number
 *
 * @return Promise<ISmartContractExecutionResult>
 */
export const queryTokenValidity = async (
  baseContract: Contract,
  signerAddress: ethers.AddressLike,
  network: TNetworkName,
  hederaTokenAddress: ethers.AddressLike,
  gasLimit: number
): Promise<ISmartContractExecutionResult> => {
  // sanitize param
  if (!isAddress(hederaTokenAddress)) {
    console.error('Invalid token address');
    return { err: 'Invalid token address' };
  }

  try {
    if (gasLimit === 0) {
      const estimateGasResult = await handleEstimateGas(
        baseContract,
        signerAddress,
        network,
        'isTokenPublic',
        [hederaTokenAddress]
      );
      if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
      gasLimit = estimateGasResult.gasLimit;
    }

    const transactionResult = await baseContract.isTokenPublic(hederaTokenAddress, { gasLimit });
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
 * @param signerAddress: ethers.AddressLike
 *
 * @param network: TNetworkName
 *
 * @param API: "TOKEN_INFO" | "FUNGIBLE_INFO" | "NON_FUNFIBLE_INFO"
 *
 * @param hederaTokenAddress: ethers.AddressLike
 *
 * @param gasLimit: number
 *
 * @param serialNumber?: number
 *
 * @return Promise<ISmartContractExecutionResult>
 */
export const queryTokenGeneralInfomation = async (
  baseContract: Contract,
  signerAddress: ethers.AddressLike,
  network: TNetworkName,
  API: 'TOKEN' | 'FUNGIBLE' | 'NON_FUNFIBLE',
  hederaTokenAddress: ethers.AddressLike,
  gasLimit: number,
  serialNumber?: number
): Promise<ISmartContractExecutionResult> => {
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
    TOKEN: 'TokenInfo',
    FUNGIBLE: 'FungibleTokenInfo',
    NON_FUNFIBLE: 'NonFungibleTokenInfo',
  };

  // prepare function signagure and arguments
  const selector = {
    funcSig: '',
    args: [] as any,
  };
  switch (API) {
    case 'TOKEN':
      selector.funcSig = 'getTokenInfoPublic';
      selector.args = [hederaTokenAddress];
      break;
    case 'FUNGIBLE':
      selector.funcSig = 'getFungibleTokenInfoPublic';
      selector.args = [hederaTokenAddress];
      break;
    case 'NON_FUNFIBLE':
      if (!serialNumber) {
        console.error('Serial number is needed for querying NON_FUNGIBLE');
        return { err: 'Serial number is needed for querying NON_FUNGIBLE' };
      }
      selector.funcSig = 'getNonFungibleTokenInfoPublic';
      selector.args = [hederaTokenAddress, serialNumber];
      break;
  }

  // prepare gasLimit
  if (gasLimit === 0) {
    const estimateGasResult = await handleEstimateGas(
      baseContract,
      signerAddress,
      network,
      selector.funcSig,
      selector.args
    );
    if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
    gasLimit = estimateGasResult.gasLimit;
  }

  // invoking contract methods
  try {
    let transactionResult;
    switch (API) {
      case 'TOKEN':
        // prepare transaction
        transactionResult = await baseContract.getTokenInfoPublic(hederaTokenAddress, { gasLimit });
        break;
      case 'FUNGIBLE':
        // prepare transaction
        transactionResult = await baseContract.getFungibleTokenInfoPublic(hederaTokenAddress, { gasLimit });
        break;
      case 'NON_FUNFIBLE':
        if (!serialNumber) {
          console.error('Serial number is needed for querying NON_FUNGIBLE');
          return { err: 'Serial number is needed for querying NON_FUNGIBLE' };
        } else {
          // prepare transaction
          transactionResult = await baseContract.getNonFungibleTokenInfoPublic(
            hederaTokenAddress,
            serialNumber,
            { gasLimit }
          );
        }
        break;
    }

    // get transaction receipt
    const txReceipt = await transactionResult.wait();

    // retrieve information from event
    const { args } = txReceipt.logs.filter((event: any) => event.fragment.name === eventMaps[API])[0];

    return {
      [eventMaps[API]]: convertsArgsProxyToHTSTokenInfo(args.tokenInfo, API),
      transactionHash: txReceipt.hash,
    };
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
 * @param signerAddress: ethers.AddressLike
 *
 * @param network: TNetworkName
 *
 * @param network: TNetworkName
 *
 * @param API: "DEFAULT_FREEZE_STATUS" | "DEFAULT_KYC_STATUS" | "CUSTOM_FEES" | "TOKEN_EXPIRY" | "TOKEN_TYPE" | "TOKEN_KEYS"
 *
 * @param hederaTokenAddress: ethers.AddressLike,
 *
 * @param gasLimit: number
 *
 * @param keyType?: IHederaTokenServiceKeyType
 *
 * @return Promise<ISmartContractExecutionResult>
 */
export const queryTokenSpecificInfomation = async (
  baseContract: Contract,
  signerAddress: ethers.AddressLike,
  network: TNetworkName,
  API:
    | 'TOKEN_TYPE'
    | 'TOKEN_KEYS'
    | 'CUSTOM_FEES'
    | 'TOKEN_EXPIRY'
    | 'DEFAULT_KYC_STATUS'
    | 'DEFAULT_FREEZE_STATUS',
  hederaTokenAddress: ethers.AddressLike,
  gasLimit: number,
  keyType?: IHederaTokenServiceKeyType
): Promise<ISmartContractExecutionResult> => {
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

  // prepare function signagure and arguments
  const selector = {
    funcSig: '',
    args: [hederaTokenAddress] as any,
  };
  switch (API) {
    case 'DEFAULT_FREEZE_STATUS':
      selector.funcSig = 'getTokenDefaultFreezeStatusPublic';
      break;
    case 'DEFAULT_KYC_STATUS':
      selector.funcSig = 'getTokenDefaultKycStatusPublic';
      break;
    case 'CUSTOM_FEES':
      selector.funcSig = 'getTokenCustomFeesPublic';
      break;
    case 'TOKEN_EXPIRY':
      selector.funcSig = 'getTokenExpiryInfoPublic';
      break;
    case 'TOKEN_TYPE':
      selector.funcSig = 'getTokenTypePublic';
      break;
    case 'TOKEN_KEYS':
      if (!keyType) {
        console.error('Key Type is needed for querying NON_FUNGIBLE');
        return { err: 'Key Type is needed for querying NON_FUNGIBLE' };
      }
      selector.funcSig = 'getTokenKeyPublic';
      selector.args = [hederaTokenAddress, KEY_TYPE_MAP[keyType]];
      break;
  }

  // prepare gasLimit
  if (gasLimit === 0) {
    const estimateGasResult = await handleEstimateGas(
      baseContract,
      signerAddress,
      network,
      selector.funcSig,
      selector.args
    );
    if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
    gasLimit = estimateGasResult.gasLimit;
  }

  // invoking contract methods
  try {
    let transactionResult;
    switch (API) {
      case 'DEFAULT_FREEZE_STATUS':
        transactionResult = await baseContract.getTokenDefaultFreezeStatusPublic(hederaTokenAddress, {
          gasLimit,
        });
        break;

      case 'DEFAULT_KYC_STATUS':
        transactionResult = await baseContract.getTokenDefaultKycStatusPublic(hederaTokenAddress, {
          gasLimit,
        });
        break;

      case 'CUSTOM_FEES':
        transactionResult = await baseContract.getTokenCustomFeesPublic(hederaTokenAddress, { gasLimit });
        break;

      case 'TOKEN_EXPIRY':
        transactionResult = await baseContract.getTokenExpiryInfoPublic(hederaTokenAddress, { gasLimit });
        break;
      case 'TOKEN_TYPE':
        transactionResult = await baseContract.getTokenTypePublic(hederaTokenAddress, { gasLimit });
        break;
      case 'TOKEN_KEYS':
        if (!keyType) {
          console.error('Key Type is needed for querying NON_FUNGIBLE');
          return { err: 'Key Type is needed for querying NON_FUNGIBLE' };
        } else {
          transactionResult = await baseContract.getTokenKeyPublic(
            hederaTokenAddress,
            KEY_TYPE_MAP[keyType],
            { gasLimit }
          );
        }
        break;
    }

    // get transaction receipt
    const txReceipt = await transactionResult.wait();

    // retrieve information from event
    const tokenInfoResult = txReceipt.logs.filter((event: any) => event.fragment.name === eventMaps[API])[0];

    if (API === 'DEFAULT_FREEZE_STATUS' || API === 'DEFAULT_KYC_STATUS' || API === 'TOKEN_TYPE') {
      return { [eventMaps[API]]: tokenInfoResult.data, transactionHash: txReceipt.hash };
    } else {
      const tokenInfo = convertsArgsProxyToHTSSpecificInfo(tokenInfoResult.args, API);
      return { [eventMaps[API]]: tokenInfo, transactionHash: txReceipt.hash };
    }
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
 * @param signerAddress: ethers.AddressLike
 *
 * @param network: TNetworkName
 *
 * @param API: "ALLOWANCE" | "GET_APPROVED" | "IS_APPROVAL"
 *
 * @param hederaTokenAddress: ethers.AddressLike
 *
 * @param gasLimit: number
 *
 * @param ownerAddress?: ethers.AddressLike
 *
 * @param spenderAddress?: ethers.AddressLike
 *
 * @param serialNumber?: number
 *
 * @return Promise<ISmartContractExecutionResult>
 */
export const queryTokenPermissionInformation = async (
  baseContract: Contract,
  signerAddress: ethers.AddressLike,
  network: TNetworkName,
  API: 'ALLOWANCE' | 'GET_APPROVED' | 'IS_APPROVAL',
  hederaTokenAddress: ethers.AddressLike,
  gasLimit: number,
  ownerAddress?: ethers.AddressLike,
  spenderAddress?: ethers.AddressLike,
  serialNumber?: number
): Promise<ISmartContractExecutionResult> => {
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
          if (gasLimit === 0) {
            const estimateGasResult = await handleEstimateGas(
              baseContract,
              signerAddress,
              network,
              'allowancePublic',
              [hederaTokenAddress, ownerAddress, spenderAddress]
            );
            if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
            gasLimit = estimateGasResult.gasLimit;
          }
          transactionResult = await baseContract.allowancePublic(
            hederaTokenAddress,
            ownerAddress,
            spenderAddress,
            { gasLimit }
          );
        }
        break;
      case 'GET_APPROVED':
        if (!serialNumber) {
          errMsg = 'Serial number is needed for GET_APPROVED API';
        } else {
          if (gasLimit === 0) {
            const estimateGasResult = await handleEstimateGas(
              baseContract,
              signerAddress,
              network,
              'getApprovedPublic',
              [hederaTokenAddress, serialNumber]
            );
            if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
            gasLimit = estimateGasResult.gasLimit;
          }
          transactionResult = await baseContract.getApprovedPublic(hederaTokenAddress, serialNumber, {
            gasLimit,
          });
        }
        break;
      case 'IS_APPROVAL':
        if (!ownerAddress) {
          errMsg = 'Owner address is needed for IS_APPROVAL API';
        } else if (!spenderAddress) {
          errMsg = 'Spender address is needed for IS_APPROVAL API';
        } else {
          if (gasLimit === 0) {
            const estimateGasResult = await handleEstimateGas(
              baseContract,
              signerAddress,
              network,
              'isApprovedForAllPublic',
              [hederaTokenAddress, ownerAddress, spenderAddress]
            );
            if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
            gasLimit = estimateGasResult.gasLimit;
          }
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
 * @param signerAddress: ethers.AddressLike
 *
 * @param network: TNetworkName
 *
 * @param API: "IS_KYC" | "IS_FROZEN"
 *
 * @param hederaTokenAddress: ethers.AddressLike
 *
 * @param accountAddress: ethers.AddressLike
 *
 * @param gasLimit: number
 *
 * @return Promise<ISmartContractExecutionResult>
 */
export const queryTokenStatusInformation = async (
  baseContract: Contract,
  signerAddress: ethers.AddressLike,
  network: TNetworkName,
  API: 'IS_KYC' | 'IS_FROZEN',
  hederaTokenAddress: ethers.AddressLike,
  accountAddress: ethers.AddressLike,
  gasLimit: number
): Promise<ISmartContractExecutionResult> => {
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

  if (gasLimit === 0) {
    const estimateGasResult = await handleEstimateGas(
      baseContract,
      signerAddress,
      network,
      API === 'IS_KYC' ? 'isKycPublic' : 'isFrozenPublic',
      [hederaTokenAddress, accountAddress]
    );
    if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
    gasLimit = estimateGasResult.gasLimit;
  }

  // invoking contract methods
  try {
    let transactionResult;
    switch (API) {
      case 'IS_KYC':
        transactionResult = await baseContract.isKycPublic(hederaTokenAddress, accountAddress, { gasLimit });
        break;

      case 'IS_FROZEN':
        transactionResult = await baseContract.isFrozenPublic(hederaTokenAddress, accountAddress, {
          gasLimit,
        });
        break;
    }

    return await handleContractResponseWithDynamicEventNames(transactionResult, eventMaps, API);
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};
