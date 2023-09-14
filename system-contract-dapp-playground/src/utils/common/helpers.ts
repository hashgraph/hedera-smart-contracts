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

import { ethers } from 'ethers';
import { NetworkName } from '@/types/common';
import { getCurrentChainId } from '@/api/wallet';
import { HEDERA_NETWORKS, PROTECTED_ROUTES } from './constants';
import { TransactionResult } from '@/types/contract-interactions/HTS';

/**
 * @dev validating if a route is protected
 * @param pathname string
 * @returns boolean
 */
export const isProtectedRoute = (pathname: string) => {
  return PROTECTED_ROUTES.includes(pathname);
};

/**
 * @dev Handles checking if the connected network is the expected network (i.e. HEDERA_TESTNET, HEDERA_PREVIEWNET, HEDERA_LOCALNET, HEDERA_MAINNET)
 *
 * @params walletProvider: ethers.BrowserProvider
 *
 * @returns bool
 */
export const isCorrectHederaNetwork = async (walletProvider: ethers.BrowserProvider) => {
  // get current chainId
  const currentChainId = (await getCurrentChainId(walletProvider)).currentChainId as string;

  return (
    currentChainId === HEDERA_NETWORKS.mainnet.chainIdHex ||
    currentChainId === HEDERA_NETWORKS.testnet.chainIdHex ||
    currentChainId === HEDERA_NETWORKS.previewnet.chainIdHex ||
    currentChainId === HEDERA_NETWORKS.localnet.chainIdHex
  );
};

/**
 * @dev convert chainId to network name
 *
 * @params chainId string
 *
 * @returns string
 */
export const chainIdToNetwork = (chainId: string): NetworkName => {
  switch (chainId) {
    case '0x127':
      return 'mainnet';
    case '0x128':
      return 'testnet';
    case '0x129':
      return 'previewnet';
    case '0x12a':
    default:
      return 'localnet';
  }
};

/**
 * @dev convert ABI function name from camelCase to normal
 *
 * @params functionName: string
 *
 * @returns string
 */
export const convertCalmelCaseFunctionName = (functionName: string) => {
  // Split the string into words based on camel case
  const fnNames = functionName.replace(/([a-z])([A-Z])/g, '$1 $2').split(' ');

  // Capitalize the first letter of each function name
  const titleCaseNames = fnNames.map((fnName) => fnName.charAt(0).toUpperCase() + fnName.slice(1));

  // Join the names back together with a space
  const titleCaseFunctionName = titleCaseNames.join(' ');

  return titleCaseFunctionName;
};

/**
 * @dev create a random unique key string
 *
 * @param byteLength: number
 *
 * @return string
 */
export const generatedRandomUniqueKey = (byteLength: number) => {
  const randomBytes = ethers.randomBytes(9);
  const randomKey = ethers.hexlify(randomBytes);
  return randomKey;
};

/*
 * @dev prepare a list of transaction in order from newest to oldest based on the timestamp when each transaction occurs
 *
 * @returns allTransactions: TransactionResult[]
 */
export const prepareTransactionList = () => {
  // prepare
  const transactions: TransactionResult[] = [];

  // loop through localStorage items
  if (typeof localStorage !== 'undefined') {
    for (let i = 0; i < localStorage.length; i++) {
      // get key
      const key = localStorage.key(i);

      // only include item with KEY includes 'HEDERA' and NOT include 'READONLY'
      if (key?.includes('HEDERA') && !key?.includes('READONLY')) {
        const records = JSON.parse(localStorage.getItem(key) || '');
        records.forEach((record: any) => {
          transactions.push({ ...record });
        });
      }
    }
  }

  // sort transactions from oldest to newest to assign recordIndex
  const sortedTransactions = transactions
    .sort((txA, txB) => txA.transactionTimeStamp - txB.transactionTimeStamp)
    .map((record, index) => ({ ...record, recordIndex: index + 1 }));

  return sortedTransactions;
};
