// SPDX-License-Identifier: Apache-2.0

import { Contract, ethers } from 'ethers';
import { TNetworkName } from '@/types/common';
import { handleEstimateGas } from '@/utils/common/helpers';
import { ISmartContractExecutionResult } from '@/types/contract-interactions/shared';

/**
 * @dev handle converting tinycents to tinybars and vice versa
 *
 * @dev integrates exchangeRate.convertTinycentsToTinybars()
 *
 * @dev integrates exchangeRate.convertTinybarsToTinycents()
 *
 * @param baseContract: ethers.Contract
 *
 * @param signerAddress: ethers.AddressLike
 *
 * @param network: TNetworkName
 *
 * @param API: "CENT_TO_BAR" | "BAR_TO_CENT"
 *
 * @param amount: number
 *
 * @param gasLimit: number
 *
 * @return Promise<ISmartContractExecutionResult>
 */
export const handleExchangeRate = async (
  baseContract: Contract,
  signerAddress: ethers.AddressLike,
  network: TNetworkName,
  API: 'CENT_TO_BAR' | 'BAR_TO_CENT',
  amount: number,
  gasLimit: number
): Promise<ISmartContractExecutionResult> => {
  // sanitize param
  if (amount < 0) {
    console.error('Amount to convert cannot be negative');
    return { err: 'Amount to convert cannot be negative' };
  }

  // Event name map
  const eventNameMap = {
    CENT_TO_BAR: 'TinyBars',
    BAR_TO_CENT: 'TinyCents',
  };

  if (gasLimit === 0) {
    const estimateGasResult = await handleEstimateGas(
      baseContract,
      signerAddress,
      network,
      API === 'CENT_TO_BAR' ? 'convertTinycentsToTinybars' : 'convertTinybarsToTinycents',
      [amount]
    );
    if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
    gasLimit = estimateGasResult.gasLimit;
  }

  try {
    // invoke contract method
    let tx;
    if (API === 'CENT_TO_BAR') {
      tx = await baseContract.convertTinycentsToTinybars(amount, { gasLimit });
    } else {
      tx = await baseContract.convertTinybarsToTinycents(amount, { gasLimit });
    }

    // retrieve txReceipt
    const txReceipt = await tx.wait();

    const { data } = txReceipt.logs.filter((event: any) => event.fragment.name === eventNameMap[API])[0];

    return { transactionHash: txReceipt.hash, convertedAmount: Number(data) };
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};
