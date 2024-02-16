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

import { TNetworkName } from '@/types/common';
import { Contract, ethers, isAddress } from 'ethers';
import { handleEstimateGas } from '@/utils/common/helpers';
import { handleContractResponse } from '@/utils/contract-interactions/HTS/helpers';
import { ISmartContractExecutionResult } from '@/types/contract-interactions/shared';

/**
 * @dev transfers Hedera Cryptos
 *
 * @dev integrates TokenTransferContract.cryptoTransferPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param signerAddress: ethers.AddressLike
 *
 * @param network: TNetworkName
 *
 * @param transferList: IHederaTokenServiceTransferList
 *
 * @param tokenTransferList: IHederaTokenServiceTokenTransferList[]
 *
 * @param gasLimit: number
 *
 * @return Promise<ISmartContractExecutionResult>
 */
export const transferCrypto = async (
  baseContract: Contract,
  signerAddress: ethers.AddressLike,
  network: TNetworkName,
  transferList: IHederaTokenServiceTransferList,
  tokenTransferList: IHederaTokenServiceTokenTransferList[],
  gasLimit: number
): Promise<ISmartContractExecutionResult> => {
  // invoking contract methods
  try {
    if (gasLimit === 0) {
      const estimateGasResult = await handleEstimateGas(
        baseContract,
        signerAddress,
        network,
        'cryptoTransferPublic',
        [transferList, tokenTransferList]
      );
      if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
      gasLimit = estimateGasResult.gasLimit;
    }
    const tx = await baseContract.cryptoTransferPublic(transferList, tokenTransferList, {
      gasLimit,
    });

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
 * @param signerAddress: ethers.AddressLike
 *
 * @param network: TNetworkName
 *
 * @param hederaTokenAddress: ethers.AddressLike
 *
 * @param accountId: ethers.AddressLike[]
 *
 * @param amount: number[]
 *
 * @param gasLimit: number
 *
 * @return Promise Promise<ISmartContractExecutionResult>
 */
export const transferFungibleTokens = async (
  baseContract: Contract,
  signerAddress: ethers.AddressLike,
  network: TNetworkName,
  hederaTokenAddress: ethers.AddressLike,
  accountIDs: ethers.AddressLike[],
  amounts: number[],
  gasLimit: number
): Promise<ISmartContractExecutionResult> => {
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
    // @notice skipping the first element of the array in the loop as the initial item in the amounts array represents the totalInputAmount multiplied by -1
    amounts.slice(1).some((amount) => {
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
    if (gasLimit === 0) {
      const estimateGasResult = await handleEstimateGas(
        baseContract,
        signerAddress,
        network,
        'transferTokensPublic',
        [hederaTokenAddress, accountIDs, amounts]
      );
      if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
      gasLimit = estimateGasResult.gasLimit;
    }

    const tx = await baseContract.transferTokensPublic(hederaTokenAddress, accountIDs, amounts, {
      gasLimit,
    });

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
 * @param signerAddress: ethers.AddressLike
 *
 * @param network: TNetworkName
 *
 * @param hederaTokenAddress: ethers.AddressLike
 *
 * @param senders: ethers.AddressLike[]
 *
 * @param receivers: ethers.AddressLike[]
 *
 * @param serialNumbers: number[]
 *
 * @param gasLimit: number
 *
 * @return Promise<ISmartContractExecutionResult>
 */
export const transferNonFungibleTokens = async (
  baseContract: Contract,
  signerAddress: ethers.AddressLike,
  network: TNetworkName,
  hederaTokenAddress: ethers.AddressLike,
  senders: ethers.AddressLike[],
  receivers: ethers.AddressLike[],
  serialNumbers: number[],
  gasLimit: number
): Promise<ISmartContractExecutionResult> => {
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
    if (gasLimit === 0) {
      const estimateGasResult = await handleEstimateGas(
        baseContract,
        signerAddress,
        network,
        'transferNFTsPublic',
        [hederaTokenAddress, senders, serialNumbers]
      );
      if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
      gasLimit = estimateGasResult.gasLimit;
    }

    const tx = await baseContract.transferNFTsPublic(hederaTokenAddress, senders, receivers, serialNumbers, {
      gasLimit,
    });

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
 * @dev integrates TokenTransferContract.transferFromPublic()
 *
 * @dev integrates TokenTransferContract.transferFromNFTPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param signerAddress: ethers.AddressLike
 *
 * @param network: TNetworkName
 *
 * @param API: "FUNGIBLE" | "NFT" | 'FUNGIBLE_FROM' | 'NFT_FROM'
 *
 * @param hederaTokenAddress: ethers.AddressLike
 *
 * @param sender: ethers.AddressLike
 *
 * @param receiver: ethers.AddressLike
 *
 * @param quantity: number (amount/serialNumber)
 *
 * @return Promise<ISmartContractExecutionResult>
 */
export const transferSingleToken = async (
  baseContract: Contract,
  signerAddress: ethers.AddressLike,
  network: TNetworkName,
  API: 'FUNGIBLE' | 'NFT' | 'FUNGIBLE_FROM' | 'NFT_FROM',
  hederaTokenAddress: ethers.AddressLike,
  sender: ethers.AddressLike,
  receiver: ethers.AddressLike,
  quantity: number,
  gasLimit: number
): Promise<ISmartContractExecutionResult> => {
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

    switch (API) {
      case 'FUNGIBLE':
        if (gasLimit === 0) {
          const estimateGasResult = await handleEstimateGas(
            baseContract,
            signerAddress,
            network,
            'transferTokenPublic',
            [hederaTokenAddress, sender, receiver, quantity]
          );
          if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
          gasLimit = estimateGasResult.gasLimit;
        }

        transactionResult = await baseContract.transferTokenPublic(
          hederaTokenAddress,
          sender,
          receiver,
          quantity,
          { gasLimit }
        );
        break;

      case 'NFT':
        if (gasLimit === 0) {
          const estimateGasResult = await handleEstimateGas(
            baseContract,
            signerAddress,
            network,
            'transferNFTPublic',
            [hederaTokenAddress, sender, receiver, quantity]
          );
          if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
          gasLimit = estimateGasResult.gasLimit;
        }

        transactionResult = await baseContract.transferNFTPublic(
          hederaTokenAddress,
          sender,
          receiver,
          quantity,
          { gasLimit }
        );
        break;

      case 'FUNGIBLE_FROM':
        if (gasLimit === 0) {
          const estimateGasResult = await handleEstimateGas(
            baseContract,
            signerAddress,
            network,
            'transferFromPublic',
            [hederaTokenAddress, sender, receiver, quantity]
          );
          if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
          gasLimit = estimateGasResult.gasLimit;
        }

        transactionResult = await baseContract.transferFromPublic(
          hederaTokenAddress,
          sender,
          receiver,
          quantity,
          { gasLimit }
        );
        break;

      case 'NFT_FROM':
        if (gasLimit === 0) {
          const estimateGasResult = await handleEstimateGas(
            baseContract,
            signerAddress,
            network,
            'transferFromNFTPublic',
            [hederaTokenAddress, sender, receiver, quantity]
          );
          if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
          gasLimit = estimateGasResult.gasLimit;
        }

        transactionResult = await baseContract.transferFromNFTPublic(
          hederaTokenAddress,
          sender,
          receiver,
          quantity,
          { gasLimit }
        );
        break;
    }

    return await handleContractResponse(transactionResult);
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};
