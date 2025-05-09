// SPDX-License-Identifier: Apache-2.0

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
