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
import {
  handleContractResponse,
  prepareHederaTokenKeyArray,
} from '@/utils/contract-interactions/HTS/helpers';
import { TNetworkName } from '@/types/common';
import { handleEstimateGas } from '@/utils/common/helpers';

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
 * @param signerAddress: ethers.AddressLike
 *
 * @param network: TNetworkName
 *
 * @param API: "UPDATE_INFO" | "UPDATE_EXPIRY" | "UPDATE_KEYS"
 *
 * @param hederaTokenAddress: ethers.AddressLike
 *
 * @param gasLimit: number
 *
 * @param tokenInfo?: IHederaTokenServiceHederaToken
 *
 * @param expiryInfo?: IHederaTokenServiceExpiry
 *
 * @param keysInfo?: ICommonKeyObject[],
 *
 * @return Promise<ISmartContractExecutionResult>
 */
export const manageTokenInfomation = async (
  baseContract: Contract,
  signerAddress: ethers.AddressLike,
  network: TNetworkName,
  API: 'UPDATE_INFO' | 'UPDATE_EXPIRY' | 'UPDATE_KEYS',
  hederaTokenAddress: ethers.AddressLike,
  gasLimit: number,
  tokenInfo?: IHederaTokenServiceHederaToken,
  expiryInfo?: IHederaTokenServiceExpiry,
  keysInfo?: ICommonKeyObject[]
): Promise<ISmartContractExecutionResult> => {
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
          if (gasLimit === 0) {
            const estimateGasResult = await handleEstimateGas(
              baseContract,
              signerAddress,
              network,
              'updateTokenInfoPublic',
              [hederaTokenAddress, tokenInfo]
            );
            if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
            gasLimit = estimateGasResult.gasLimit;
          }
          transactionResult = await baseContract.updateTokenInfoPublic(hederaTokenAddress, tokenInfo, {
            gasLimit,
          });
        }
        break;
      case 'UPDATE_EXPIRY':
        if (!expiryInfo) {
          errMsg = 'Expiry information object is needed for UPDATE_EXPIRY API';
        } else {
          if (gasLimit === 0) {
            const estimateGasResult = await handleEstimateGas(
              baseContract,
              signerAddress,
              network,
              'updateTokenExpiryInfoPublic',
              [hederaTokenAddress, expiryInfo]
            );
            if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
            gasLimit = estimateGasResult.gasLimit;
          }
          transactionResult = await baseContract.updateTokenExpiryInfoPublic(hederaTokenAddress, expiryInfo, {
            gasLimit,
          });
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

            if (gasLimit === 0) {
              const estimateGasResult = await handleEstimateGas(
                baseContract,
                signerAddress,
                network,
                'updateTokenKeysPublic',
                [hederaTokenAddress, hederaTokenKeys]
              );
              if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
              gasLimit = estimateGasResult.gasLimit;
            }

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
 * @param signerAddress: ethers.AddressLike
 *
 * @param network: TNetworkName
 *
 * @param API: "APPROVED_FUNGIBLE" | "APPROVED_NON_FUNGIBLE" | "SET_APPROVAL"
 *
 * @param hederaTokenAddress:  ethers.AddressLike
 *
 * @param targetApprovedAddress:  ethers.AddressLike (spender address for APPROVED_FUNGIBLE, approved NFT controller for APPROVED_NON_FUNGIBLE, operator for SET_APPROVAL)
 *
 * @param gasLimit: number
 *
 * @param amountToApprove?: number (APPROVED_FUNGIBLE)
 *
 * @param serialNumber?: number (APPROVED_NON_FUNGIBLE)
 *
 * @param approvedStatus?: boolean (SET_APPROVAL)
 *
 * @return Promise<ISmartContractExecutionResult>
 */
export const manageTokenPermission = async (
  baseContract: Contract,
  signerAddress: ethers.AddressLike,
  network: TNetworkName,
  API: 'APPROVED_FUNGIBLE' | 'APPROVED_NON_FUNGIBLE' | 'SET_APPROVAL',
  hederaTokenAddress: ethers.AddressLike,
  targetApprovedAddress: ethers.AddressLike,
  gasLimit: number,
  amountToApprove?: number,
  serialNumber?: number,
  approvedStatus?: boolean
): Promise<ISmartContractExecutionResult> => {
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
          if (gasLimit === 0) {
            const estimateGasResult = await handleEstimateGas(
              baseContract,
              signerAddress,
              network,
              'approvePublic',
              [hederaTokenAddress, targetApprovedAddress, amountToApprove]
            );
            if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
            gasLimit = estimateGasResult.gasLimit;
          }
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
          if (gasLimit === 0) {
            const estimateGasResult = await handleEstimateGas(
              baseContract,
              signerAddress,
              network,
              'approveNFTPublic',
              [hederaTokenAddress, targetApprovedAddress, serialNumber]
            );
            if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
            gasLimit = estimateGasResult.gasLimit;
          }
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
          if (gasLimit === 0) {
            const estimateGasResult = await handleEstimateGas(
              baseContract,
              signerAddress,
              network,
              'setApprovalForAllPublic',
              [hederaTokenAddress, targetApprovedAddress, approvedStatus]
            );
            if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
            gasLimit = estimateGasResult.gasLimit;
          }
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
 * @param signerAddress: ethers.AddressLike
 *
 * @param network: TNetworkName
 *
 * @param API: "PAUSE" | "UNPAUSE"
 *
 * @param hederaTokenAddress: string
 *
 * @param gasLimit: number
 *
 * @return Promise<ISmartContractExecutionResult>
 */
export const manageTokenStatus = async (
  baseContract: Contract,
  signerAddress: ethers.AddressLike,
  network: TNetworkName,
  API: 'PAUSE' | 'UNPAUSE',
  hederaTokenAddress: string,
  gasLimit: number
): Promise<ISmartContractExecutionResult> => {
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
        if (gasLimit === 0) {
          const estimateGasResult = await handleEstimateGas(
            baseContract,
            signerAddress,
            network,
            'pauseTokenPublic',
            [hederaTokenAddress]
          );
          if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
          gasLimit = estimateGasResult.gasLimit;
        }
        transactionResult = await baseContract.pauseTokenPublic(hederaTokenAddress, { gasLimit });
        break;
      case 'UNPAUSE':
        if (gasLimit === 0) {
          const estimateGasResult = await handleEstimateGas(
            baseContract,
            signerAddress,
            network,
            'unpauseTokenPublic',
            [hederaTokenAddress]
          );
          if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
          gasLimit = estimateGasResult.gasLimit;
        }
        transactionResult = await baseContract.unpauseTokenPublic(hederaTokenAddress, { gasLimit });
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
 * @param signerAddress: ethers.AddressLike
 *
 * @param network: TNetworkName
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
 * @return Promise<ISmartContractExecutionResult>
 */
export const manageTokenRelation = async (
  baseContract: Contract,
  signerAddress: ethers.AddressLike,
  network: TNetworkName,
  API: 'REVOKE_KYC' | 'FREEZE' | 'UNFREEZE' | 'DISSOCIATE_TOKEN',
  accountAddress: string,
  gasLimit: number,
  hederaTokenAddress?: string,
  hederaTokenAddresses?: string[]
): Promise<ISmartContractExecutionResult> => {
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

  // prepare function signagure and arguments
  const selector = {
    funcSig: '',
    args: [] as any,
  };

  switch (API) {
    case 'REVOKE_KYC':
      selector.funcSig = 'revokeTokenKycPublic';
      selector.args = [hederaTokenAddress, accountAddress];
      break;
    case 'FREEZE':
      selector.funcSig = 'freezeTokenPublic';
      selector.args = [hederaTokenAddress, accountAddress];
      break;
    case 'UNFREEZE':
      selector.funcSig = 'unfreezeTokenPublic';
      selector.args = [hederaTokenAddress, accountAddress];
      break;
    case 'DISSOCIATE_TOKEN':
      if (hederaTokenAddresses!.length === 1) {
        selector.funcSig = 'dissociateTokenPublic';
        selector.args = [accountAddress, hederaTokenAddresses![0]];
      } else {
        selector.funcSig = 'dissociateTokensPublic';
        selector.args = [accountAddress, hederaTokenAddresses];
      }
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
    // prepare states
    let transactionResult;
    switch (API) {
      case 'REVOKE_KYC':
        transactionResult = await baseContract.revokeTokenKycPublic(hederaTokenAddress, accountAddress, {
          gasLimit,
        });
        break;
      case 'FREEZE':
        transactionResult = await baseContract.freezeTokenPublic(hederaTokenAddress, accountAddress, {
          gasLimit,
        });
        break;
      case 'UNFREEZE':
        transactionResult = await baseContract.unfreezeTokenPublic(hederaTokenAddress, accountAddress, {
          gasLimit,
        });
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
 * @param signerAddress: ethers.AddressLike
 *
 * @param network: TNetworkName
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
 * @return Promise<ISmartContractExecutionResult>
 */
export const manageTokenDeduction = async (
  baseContract: Contract,
  signerAddress: ethers.AddressLike,
  network: TNetworkName,
  API: 'WIPE_FUNGIBLE' | 'WIPE_NON_FUNGIBLE' | 'BURN' | 'DELETE',
  hederaTokenAddress: string,
  gasLimit: number,
  accountAddress?: string,
  amount?: number,
  serialNumbers?: number[]
): Promise<ISmartContractExecutionResult> => {
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

  // prepare function signagure and arguments
  const selector = {
    funcSig: '',
    args: [] as any,
  };
  switch (API) {
    case 'WIPE_FUNGIBLE':
      selector.funcSig = 'wipeTokenAccountPublic';
      selector.args = [hederaTokenAddress, accountAddress, amount];
      break;
    case 'WIPE_NON_FUNGIBLE':
      selector.funcSig = 'wipeTokenAccountNFTPublic';
      selector.args = [hederaTokenAddress, accountAddress, serialNumbers];
      break;
    case 'BURN':
      selector.funcSig = 'burnTokenPublic';
      selector.args = [hederaTokenAddress, amount, serialNumbers];
      break;
    case 'DELETE':
      selector.funcSig = 'deleteTokenPublic';
      selector.args = [hederaTokenAddress];
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
          transactionResult = await baseContract.burnTokenPublic(hederaTokenAddress, amount, serialNumbers, {
            gasLimit,
          });
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
