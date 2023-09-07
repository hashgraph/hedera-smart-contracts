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

import { Contract, isAddress } from 'ethers';
import {
  IHederaTokenServiceTransferList,
  IHederaTokenServiceTokenTransferList,
  TokenTransferSmartContractResult,
} from '@/types/contract-interactions/HTS';
import { handleContractResponse } from '@/utils/contract-interactions/HTS/helpers';

/**
 * @dev transfers Hedera Cryptos
 *
 * @dev integrates TokenTransferContract.cryptoTransferPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param transferList: IHederaTokenServiceTransferList
 *
 * @param tokenTransferList: IHederaTokenServiceTokenTransferList
 *
 * @return Promise<TokenTransferSmartContractResult>
 */
export const transferCrypto = async (
  baseContract: Contract,
  transferList: IHederaTokenServiceTransferList,
  tokenTransferList: IHederaTokenServiceTokenTransferList
): Promise<TokenTransferSmartContractResult> => {
  // invoking contract methods
  try {
    const tx = await baseContract.cryptoTransferPublic(transferList, tokenTransferList);

    return await handleContractResponse(tx);
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};

/**
 * @dev transfers Hedera fungible tokens
 *
 * @dev integrates TokenTransferContract.transferTokensPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param hederaTokenAddress: string
 *
 * @param accountId: string[]
 *
 * @param amount: number[]
 *
 * @return Promise Promise<TokenTransferSmartContractResult>
 */
export const transferFungibleTokens = async (
  baseContract: Contract,
  hederaTokenAddress: string,
  accountIDs: string[],
  amounts: number[]
): Promise<TokenTransferSmartContractResult> => {
  // sanitize params
  let sanitizeErr;
  if (!isAddress(hederaTokenAddress)) {
    sanitizeErr = 'Invalid token address';
  }
  if (!sanitizeErr) {
    accountIDs.some((address) => {
      if (!isAddress(address)) {
        sanitizeErr = `${address} is an invalid accountID`;
        return true;
      }
    });
  }
  if (!sanitizeErr) {
    amounts.some((amount) => {
      if (amount < 0) {
        sanitizeErr = `${amount} is an invalid amount`;
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
    const tx = await baseContract.transferTokensPublic(hederaTokenAddress, accountIDs, amounts);

    return await handleContractResponse(tx);
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};

/**
 * @dev transfers Hedera non-fungible tokens
 *
 * @dev integrates TokenTransferContract.transferNFTsPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param hederaTokenAddress: string
 *
 * @param senders: string[]
 *
 * @param receivers: string[]
 *
 * @param serialNumbers: number[]
 *
 * @return Promise<TokenTransferSmartContractResult>
 */
export const transferNonFungibleTokens = async (
  baseContract: Contract,
  hederaTokenAddress: string,
  senders: string[],
  receivers: string[],
  serialNumbers: number[]
): Promise<TokenTransferSmartContractResult> => {
  // sanitize params
  let sanitizeErr;
  if (!isAddress(hederaTokenAddress)) {
    sanitizeErr = 'Invalid token address';
  }
  if (!sanitizeErr) {
    senders.some((address) => {
      if (!isAddress(address)) {
        sanitizeErr = `${address} is an invalid sender accountID`;
        return true;
      }
    });
  }
  if (!sanitizeErr) {
    receivers.some((address) => {
      if (!isAddress(address)) {
        sanitizeErr = `${address} is an invalid receiver accountID`;
        return true;
      }
    });
  }
  if (!sanitizeErr) {
    serialNumbers.some((seriNum) => {
      if (seriNum < 0) {
        sanitizeErr = `${seriNum} is an invalid serial number`;
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
    const tx = await baseContract.transferNFTsPublic(
      hederaTokenAddress,
      senders,
      receivers,
      serialNumbers
    );

    return await handleContractResponse(tx);
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};

/**
 * @dev transfers single token (fungible vs non-fungible)
 *
 * @dev integrates TokenTransferContract.transferTokenPublic()
 *
 * @dev integrates TokenTransferContract.transferNFTPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param API: "FUNGIBLE" | "NON_FUNGIBLE"
 *
 * @param hederaTokenAddress: string
 *
 * @param sender: string
 *
 * @param receiver: string
 *
 * @param quantity: number (amount/serialNumber)
 *
 * @return Promise<TokenTransferSmartContractResult>
 */
export const transferSingleToken = async (
  baseContract: Contract,
  API: 'FUNGIBLE' | 'NON_FUNGIBLE',
  hederaTokenAddress: string,
  sender: string,
  receiver: string,
  quantity: number
): Promise<TokenTransferSmartContractResult> => {
  // sanitize params
  let sanitizeErr;
  if (!isAddress(hederaTokenAddress)) {
    sanitizeErr = 'Invalid token address';
  } else if (!isAddress(sender)) {
    sanitizeErr = 'Invalid sender address';
  } else if (!isAddress(receiver)) {
    sanitizeErr = 'Invalid receiver address';
  } else if (quantity < 0) {
    sanitizeErr = 'Invalid quantity';
  }
  if (sanitizeErr) {
    console.error(sanitizeErr);
    return { err: sanitizeErr };
  }

  // invoking contract methods
  try {
    let transactionResult;
    if (API === 'FUNGIBLE') {
      transactionResult = await baseContract.transferTokenPublic(
        hederaTokenAddress,
        sender,
        receiver,
        quantity
      );
    } else {
      transactionResult = await baseContract.transferNFTPublic(
        hederaTokenAddress,
        sender,
        receiver,
        quantity
      );
    }

    return await handleContractResponse(transactionResult);
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};

/**
 * @dev transfers single token from token owner (fungible vs non-fungible)
 *
 * @dev integrates TokenTransferContract.transferFromPublic()
 *
 * @dev integrates TokenTransferContract.transferFromNFTPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param API: "FUNGIBLE" | "NON_FUNGIBLE"
 *
 * @param hederaTokenAddress: string
 *
 * @param sender: string
 *
 * @param receiver: string
 *
 * @param quantity: number (amount/serialNumber)
 *
 * @return Promise<TokenTransferSmartContractResult>
 */
export const transferSingleTokenFrom = async (
  baseContract: Contract,
  API: 'FUNGIBLE' | 'NON_FUNGIBLE',
  hederaTokenAddress: string,
  sender: string,
  receiver: string,
  quantity: number
): Promise<TokenTransferSmartContractResult> => {
  // sanitize params
  let sanitizeErr;
  if (!isAddress(hederaTokenAddress)) {
    sanitizeErr = 'Invalid token address';
  } else if (!isAddress(sender)) {
    sanitizeErr = 'Invalid sender address';
  } else if (!isAddress(receiver)) {
    sanitizeErr = 'Invalid receiver address';
  } else if (quantity < 0) {
    sanitizeErr = 'Invalid quantity';
  }
  if (sanitizeErr) {
    console.error(sanitizeErr);
    return { err: sanitizeErr };
  }

  // invoking contract methods
  try {
    let transactionResult;
    if (API === 'FUNGIBLE') {
      transactionResult = await baseContract.transferFromPublic(
        hederaTokenAddress,
        sender,
        receiver,
        quantity
      );
    } else {
      transactionResult = await baseContract.transferFromNFTPublic(
        hederaTokenAddress,
        sender,
        receiver,
        quantity
      );
    }

    return await handleContractResponse(transactionResult);
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};
