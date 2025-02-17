// SPDX-License-Identifier: Apache-2.0

import { ethers } from 'ethers';
import { getWalletProvider } from '../wallet';
import { IContractABI, IEthersResult } from '@/types/common';

/**
 * @dev generate a new ethers.Contract instance at contractAddress
 *
 * @param contractAddress: string
 *
 * @param contractABI: IContractABI[]
 *
 * @return Promise<IEthersResult>
 */
export const generateBaseContractInstance = async (
  contractAddress: string,
  contractABI: IContractABI[]
): Promise<IEthersResult> => {
  // get wallet provider
  const walletProvider = getWalletProvider();
  if (walletProvider.err || !walletProvider.walletProvider) {
    return { err: walletProvider.err };
  }

  try {
    // get signer
    const walletSigner = await walletProvider.walletProvider.getSigner();

    // generate a new ethers.Contract instance
    const baseContract = new ethers.Contract(contractAddress, JSON.stringify(contractABI), walletSigner);

    return { baseContract };
  } catch (err) {
    console.error(err);
    return { err };
  }
};
