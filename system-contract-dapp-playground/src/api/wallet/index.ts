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

import { WalletResult } from '@/types/interfaces';
import { HEDERA_NETWORKS } from '@/utils/constants';
import { ethers, BrowserProvider } from 'ethers';

/**
 * @dev get ethereum object (i.e. crypto wallet) if available
 *
 * @return ethereum: object<any>
 */
export const getEthereumObject = () => {
  if (typeof window !== 'undefined') {
    const { ethereum }: any = window;
    return ethereum;
  }
};

/**
 * @dev get ethersjs provider (i.e. Metamask provider)
 *
 * @return WalletResult
 */
export const getWalletProvider = (): WalletResult => {
  // prepare ethereum object
  const ethereum = getEthereumObject();
  if (!ethereum) {
    return { err: '!ETHEREUM' };
  }

  // get walletProvider
  const walletProvider: BrowserProvider = new ethers.BrowserProvider(ethereum);
  return { walletProvider };
};

/**
 * @dev return current chainId of the network that the walletPro is connected to
 *
 * @params ethereum: object<any>
 *
 * @returns Promise<WalletResult>
 */
export const getCurrentChainId = async (
  walletProvider: ethers.BrowserProvider
): Promise<WalletResult> => {
  try {
    const currentChainId = await walletProvider.send('eth_chainId', []);
    return {
      currentChainId,
    };
  } catch (err) {
    return { err };
  }
};

/**
 * @dev Handles detecting if the connected network is the expected network (i.e. HEDERA_TESTNET, HEDERA_PREVIEWNET, HEDERA_LOCALNET, HEDERA_MAINNET)
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
 * @dev requests a list of connected accounts in a the wallet
 *
 * @params walletProvider: ethers.BrowserProvider
 *
 * @returns Promise<WalletResult>
 */
export const requestAccount = async (
  walletProvider: ethers.BrowserProvider
): Promise<WalletResult> => {
  try {
    const accounts: [string] = await walletProvider.send('eth_requestAccounts', []);
    return {
      accounts,
    };
  } catch (err) {
    return { err };
  }
};

