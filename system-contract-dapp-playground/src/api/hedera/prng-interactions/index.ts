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

import { Contract, ethers } from 'ethers';
import { TNetworkName } from '@/types/common';
import { handleEstimateGas } from '@/utils/common/helpers';
import { ISmartContractExecutionResult } from '@/types/contract-interactions/shared';

/**
 * @dev handle retrieving a pseudo-random seed
 *
 * @dev integrates PRNG.getPseudorandomSeed()
 *
 * @param baseContract: ethers.Contract
 *
 * @param signerAddress: ethers.AddressLike
 *
 * @param network: TNetworkName
 *
 * @param gasLimit: Number
 *
 * @return Promise<ISmartContractExecutionResult>
 */
export const handlePRGNAPI = async (
  baseContract: Contract,
  signerAddress: ethers.AddressLike,
  network: TNetworkName,
  gasLimit: Number
): Promise<ISmartContractExecutionResult> => {
  try {
    if (gasLimit === 0) {
      const estimateGasResult = await handleEstimateGas(
        baseContract,
        signerAddress,
        network,
        'getPseudorandomSeed',
        []
      );
      if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
      gasLimit = estimateGasResult.gasLimit;
    }

    // invoke contract method
    const tx = await baseContract.getPseudorandomSeed({ gasLimit });

    // retrieve txReceipt
    const txReceipt = await tx.wait();

    const { data } = txReceipt.logs.filter((event: any) => event.fragment.name === 'PseudoRandomSeed')[0];

    return { transactionHash: txReceipt.hash, pseudoRandomSeed: data };
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};
