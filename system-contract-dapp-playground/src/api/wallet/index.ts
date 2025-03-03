// SPDX-License-Identifier: Apache-2.0

import { IWalletResult } from '@/types/common';
import { ethers, BrowserProvider } from 'ethers';

/**
 * @dev get wallet object if available
 *
 * @return object<any>
 */
export const getWalletObject = () => {
  if (typeof window !== 'undefined') {
    const { ethereum }: any = window;
    return ethereum;
  }
};

/**
 * @dev get ethersjs wallet provider (i.e. Metamask provider)
 *
 * @return IWalletResult
 */
export const getWalletProvider = (): IWalletResult => {
  // prepare walletObject
  const walletObject = getWalletObject();
  if (!walletObject) {
    return { err: '!HEDERA' };
  }

  // get walletProvider
  const walletProvider: BrowserProvider = new ethers.BrowserProvider(walletObject);
  return { walletProvider };
};

/**
 * @dev get the balance of an account
 *
 * @params walletProvider: ethers.BrowserProvider
 *
 * @params account: string
 *
 * @returns Promise<IWalletResult>
 */
export const getBalance = async (
  walletProvider: ethers.BrowserProvider,
  account: string
): Promise<IWalletResult> => {
  try {
    const balance = await walletProvider.send('eth_getBalance', [account]);
    return {
      balance,
    };
  } catch (err) {
    console.error(err);
    return { err };
  }
};

/**
 * @dev return current chainId of the network that the walletPro is connected to
 *
 * @params walletProvider: ethers.BrowserProvider
 *
 * @returns Promise<IWalletResult>
 */
export const getCurrentChainId = async (walletProvider: ethers.BrowserProvider): Promise<IWalletResult> => {
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
 * @dev requests a list of connected accounts in a the wallet
 *
 * @params walletProvider: ethers.BrowserProvider
 *
 * @returns Promise<IWalletResult>
 */
export const requestAccount = async (walletProvider: ethers.BrowserProvider): Promise<IWalletResult> => {
  try {
    const accounts: [string] = await walletProvider.send('eth_requestAccounts', []);
    return {
      accounts,
    };
  } catch (err) {
    return { err };
  }
};
