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
  CommonKeyObject,
  IHederaTokenServiceExpiry,
  IHederaTokenServiceHederaToken,
  SmartContractExecutionResult,
} from '@/types/contract-interactions/HTS';
import {
  handleContractResponse,
  prepareHederaTokenKeyArray,
} from '@/utils/contract-interactions/HTS/helpers';
import { Contract, isAddress } from 'ethers';

/**
 * @dev manages and updates token information
 *
 * @dev integrates tokenMagemnentContract.updateTokenInfoPublic()
 *
 * @dev integrates tokenMagemnentContract.updateTokenExpiryInfoPublic()
 *
 * @dev integrates tokenMagemnentContract.updateTokenKeysPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param API: "UPDATE_INFO" | "UPDATE_EXPIRY" | "UPDATE_KEYS"
 *
 * @param hederaTokenAddress: string
 *
 * @param gasLimit: number
 *
 * @param tokenInfo?: IHederaTokenServiceHederaToken
 *
 * @param expiryInfo?: IHederaTokenServiceExpiry
 *
 * @param keysInfo?: CommonKeyObject[],
 *
 * @return Promise<SmartContractExecutionResult>
 */
export const manageTokenInfomation = async (
  baseContract: Contract,
  API: 'UPDATE_INFO' | 'UPDATE_EXPIRY' | 'UPDATE_KEYS',
  hederaTokenAddress: string,
  gasLimit: number,
  tokenInfo?: IHederaTokenServiceHederaToken,
  expiryInfo?: IHederaTokenServiceExpiry,
  keysInfo?: CommonKeyObject[]
): Promise<SmartContractExecutionResult> => {
  // sanitize param
  if (!isAddress(hederaTokenAddress)) {
    console.error('Invalid token address');
    return { err: 'Invalid token address' };
  }

  // invoking contract methods
  try {
    // prepare states
    let transactionResult, errMsg;
    switch (API) {
      case 'UPDATE_INFO':
        if (!tokenInfo) {
          errMsg = 'Token information object is needed for UPDATE_INFO API';
        } else {
          transactionResult = await baseContract.updateTokenInfoPublic(
            hederaTokenAddress,
            tokenInfo,
            { gasLimit }
          );
        }
        break;
      case 'UPDATE_EXPIRY':
        if (!expiryInfo) {
          errMsg = 'Expiry information object is needed for UPDATE_EXPIRY API';
        } else {
          transactionResult = await baseContract.updateTokenExpiryInfoPublic(
            hederaTokenAddress,
            expiryInfo,
            { gasLimit }
          );
        }
        break;
      case 'UPDATE_KEYS':
        if (!keysInfo) {
          errMsg = 'Keys information object is needed for UPDATE_KEYS API';
        } else {
          // prepare keys array
          const keyRes = prepareHederaTokenKeyArray(keysInfo);

          // handle error
          if (keyRes.err) {
            errMsg = keyRes.err;
          } else {
            const hederaTokenKeys = keyRes.hederaTokenKeys;

            transactionResult = await baseContract.updateTokenKeysPublic(
              hederaTokenAddress,
              hederaTokenKeys,
              { gasLimit }
            );
          }
        }
    }

    // handle contract responses
    return await handleContractResponse(transactionResult, errMsg);
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};

/**
 * @dev manages token permission
 *
 * @dev integrates tokenMagemnentContract.approvePublic()
 *
 * @dev integrates tokenMagemnentContract.approveNFTPublic()
 *
 * @dev integrates tokenMagemnentContract.setApprovalForAllPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param API: "APPROVED_FUNGIBLE" | "APPROVED_NON_FUNGIBLE" | "SET_APPROVAL"
 *
 * @param hederaTokenAddress: string
 *
 * @param targetApprovedAddress: string (spender address for APPROVED_FUNGIBLE, approved NFT controller for APPROVED_NON_FUNGIBLE, operator for SET_APPROVAL)
 *
 * @param gasLimit: number
 *
 * @param amountToApprove?: number (APPROVED_FUNGIBLE)
 *
 * @param serialNumber?: number (APPROVED_NON_FUNGIBLE)
 *
 * @param approvedStatus?: boolean (SET_APPROVAL)
 *
 * @return Promise<SmartContractExecutionResult>
 */
export const manageTokenPermission = async (
  baseContract: Contract,
  API: 'APPROVED_FUNGIBLE' | 'APPROVED_NON_FUNGIBLE' | 'SET_APPROVAL',
  hederaTokenAddress: string,
  targetApprovedAddress: string,
  gasLimit: number,
  amountToApprove?: number,
  serialNumber?: number,
  approvedStatus?: boolean
): Promise<SmartContractExecutionResult> => {
  // sanitize params
  let sanitizeErr;
  if (!isAddress(hederaTokenAddress)) {
    sanitizeErr = 'Invalid token address';
  } else if (!isAddress(targetApprovedAddress)) {
    sanitizeErr = 'Invalid target approved address';
  }

  if (sanitizeErr) {
    console.error(sanitizeErr);
    return { err: sanitizeErr };
  }

  // invoking contract methods
  try {
    // prepare states
    let transactionResult, errMsg;
    switch (API) {
      case 'APPROVED_FUNGIBLE':
        if (!amountToApprove) {
          errMsg = 'A valid amount is needed for the APPROVED_FUNGIBLE API';
        } else {
          transactionResult = await baseContract.approvePublic(
            hederaTokenAddress,
            targetApprovedAddress,
            amountToApprove,
            { gasLimit }
          );
        }
        break;
      case 'APPROVED_NON_FUNGIBLE':
        if (!serialNumber) {
          errMsg = 'Serial number is needed for APPROVED_NON_FUNGIBLE API';
        } else {
          transactionResult = await baseContract.approveNFTPublic(
            hederaTokenAddress,
            targetApprovedAddress,
            serialNumber,
            { gasLimit }
          );
        }
        break;

      case 'SET_APPROVAL':
        if (typeof approvedStatus === 'undefined') {
          errMsg = 'Approved status is needed for SET_APPROVAL API';
        } else {
          transactionResult = await baseContract.setApprovalForAllPublic(
            hederaTokenAddress,
            targetApprovedAddress,
            approvedStatus,
            { gasLimit }
          );
        }
    }

    // handle contract responses
    return await handleContractResponse(transactionResult, errMsg);
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};

/**
 * @dev manages token status
 *
 * @dev integrates tokenMagemnentContract.pauseTokenPublic()
 *
 * @dev integrates tokenMagemnentContract.unpauseTokenPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param API: "PAUSE" | "UNPAUSE"
 *
 * @param hederaTokenAddress: string
 *
 * @return Promise<SmartContractExecutionResult>
 */
export const manageTokenStatus = async (
  baseContract: Contract,
  API: 'PAUSE' | 'UNPAUSE',
  hederaTokenAddress: string
): Promise<SmartContractExecutionResult> => {
  // sanitize param
  if (!isAddress(hederaTokenAddress)) {
    console.error('Invalid token address');
    return { err: 'Invalid token address' };
  }

  // invoking contract methods
  try {
    // prepare states
    let transactionResult;
    switch (API) {
      case 'PAUSE':
        transactionResult = await baseContract.pauseTokenPublic(hederaTokenAddress);
        break;
      case 'UNPAUSE':
        transactionResult = await baseContract.unpauseTokenPublic(hederaTokenAddress);
    }

    // handle contract responses
    return await handleContractResponse(transactionResult);
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};

/**
 * @dev manages token relationship between tokens and accounts
 *
 * @dev integrates tokenMagemnentContract.revokeTokenKycPublic()
 *
 * @dev integrates tokenMagemnentContract.freezeTokenPublic()
 *
 * @dev integrates tokenMagemnentContract.unfreezeTokenPublic()
 *
 * @dev integrates tokenMagemnentContract.dissociateTokensPublic()
 *
 * @dev integrates tokenMagemnentContract.dissociateTokenPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param API: "REVOKE_KYC" | "FREEZE" | "UNFREEZE" | "DISSOCIATE_TOKEN"
 *
 * @param accountAddress: string
 *
 * @param gasLimit: number
 *
 * @param hederaTokenAddress?: string
 *
 * @param hederaTokenAddresses?: string[]
 *
 * @return Promise<SmartContractExecutionResult>
 */
export const manageTokenRelation = async (
  baseContract: Contract,
  API: 'REVOKE_KYC' | 'FREEZE' | 'UNFREEZE' | 'DISSOCIATE_TOKEN',
  accountAddress: string,
  gasLimit: number,
  hederaTokenAddress?: string,
  hederaTokenAddresses?: string[]
): Promise<SmartContractExecutionResult> => {
  // sanitize params
  let sanitizeErr;
  if (!isAddress(accountAddress)) {
    sanitizeErr = 'Invalid account address';
  } else if (hederaTokenAddresses) {
    hederaTokenAddresses.some((address) => {
      if (!isAddress(address)) {
        sanitizeErr = 'Invalid token addresses';
        return true;
      }
    });
  } else if (hederaTokenAddress && !isAddress(hederaTokenAddress)) {
    sanitizeErr = 'Invalid token address';
  }

  if (sanitizeErr) {
    console.error(sanitizeErr);
    return { err: sanitizeErr };
  }

  // invoking contract methods
  try {
    // prepare states
    let transactionResult;
    switch (API) {
      case 'REVOKE_KYC':
        transactionResult = await baseContract.revokeTokenKycPublic(
          hederaTokenAddress,
          accountAddress,
          { gasLimit }
        );
        break;
      case 'FREEZE':
        transactionResult = await baseContract.freezeTokenPublic(
          hederaTokenAddress,
          accountAddress,
          { gasLimit }
        );
        break;
      case 'UNFREEZE':
        transactionResult = await baseContract.unfreezeTokenPublic(
          hederaTokenAddress,
          accountAddress,
          { gasLimit }
        );
        break;
      case 'DISSOCIATE_TOKEN':
        if (hederaTokenAddresses!.length === 1) {
          transactionResult = await baseContract.dissociateTokenPublic(
            accountAddress,
            hederaTokenAddresses![0],
            { gasLimit }
          );
        } else {
          transactionResult = await baseContract.dissociateTokensPublic(
            accountAddress,
            hederaTokenAddresses,
            { gasLimit }
          );
        }
    }

    // handle contract responses
    return await handleContractResponse(transactionResult);
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};

/**
 * @dev manages deducting tokens
 *
 * @dev integrates tokenMagemnentContract.wipeTokenAccountPublic()
 *
 * @dev integrates tokenMagemnentContract.wipeTokenAccountNFTPublic()
 *
 * @dev integrates tokenMagemnentContract.burnTokenPublic()
 *
 * @dev integrates tokenMagemnentContract.deleteTokenPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param API: "WIPE_FUNGIBLE" | "WIPE_NON_FUNGIBLE" | "BURN" | "DELETE"
 *
 * @param hederaTokenAddress: string
 *
 * @param gasLimit: number
 *
 * @param accountAddress?: string
 *
 * @param amount?: number
 *
 * @param serialNumbers?: number[]
 *
 * @return Promise<SmartContractExecutionResult>
 */
export const manageTokenDeduction = async (
  baseContract: Contract,
  API: 'WIPE_FUNGIBLE' | 'WIPE_NON_FUNGIBLE' | 'BURN' | 'DELETE',
  hederaTokenAddress: string,
  gasLimit: number,
  accountAddress?: string,
  amount?: number,
  serialNumbers?: number[]
): Promise<SmartContractExecutionResult> => {
  // sanitize params
  let sanitizeErr;
  if (!isAddress(hederaTokenAddress)) {
    sanitizeErr = 'Invalid token address';
  } else if (accountAddress && !isAddress(accountAddress)) {
    sanitizeErr = 'Invalid account address';
  } else if (amount && amount < 0) {
    sanitizeErr = 'Amount cannot be negative';
  } else if (serialNumbers) {
    serialNumbers.some((sn) => {
      if (sn < 0) {
        sanitizeErr = 'Serial number cannot be negative';
        return true;
      }
    });
  }

  if (sanitizeErr) {
    console.error(sanitizeErr);
    return { err: sanitizeErr };
  }

  // invoking contract methods
  try {
    // prepare states
    let transactionResult, errMsg;
    switch (API) {
      case 'WIPE_FUNGIBLE':
        if (!accountAddress) {
          errMsg = 'Account address is needed for WIPE_FUNGIBLE API';
        } else if (!amount) {
          errMsg = 'Amount is needed for WIPE_FUNGIBLE API';
        } else {
          transactionResult = await baseContract.wipeTokenAccountPublic(
            hederaTokenAddress,
            accountAddress,
            amount,
            { gasLimit }
          );
        }
        break;

      case 'WIPE_NON_FUNGIBLE':
        if (!accountAddress) {
          errMsg = 'Account address is needed for WIPE_NON_FUNGIBLE API';
        } else if (!serialNumbers || serialNumbers.length === 0) {
          errMsg = 'Serial number is needed for WIPE_NON_FUNGIBLE API';
        } else {
          transactionResult = await baseContract.wipeTokenAccountNFTPublic(
            hederaTokenAddress,
            accountAddress,
            serialNumbers,
            { gasLimit }
          );
        }
        break;

      case 'BURN':
        if (!amount && (!serialNumbers || serialNumbers.length === 0)) {
          errMsg = 'Amount/serial number is needed for BURN API';
        } else {
          transactionResult = await baseContract.burnTokenPublic(
            hederaTokenAddress,
            amount,
            serialNumbers,
            { gasLimit }
          );
        }
        break;

      case 'DELETE':
        transactionResult = await baseContract.deleteTokenPublic(hederaTokenAddress, { gasLimit });
    }

    // handle contract responses
    return await handleContractResponse(transactionResult, errMsg);
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};
