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
