// SPDX-License-Identifier: Apache-2.0

import { TNetworkName } from '@/types/common';
import { Contract, ethers, isAddress } from 'ethers';
import { handleEstimateGas } from '@/utils/common/helpers';
import { HEDERA_SMART_CONTRACTS_ASSETS } from '@/utils/common/constants';
import { ISmartContractExecutionResult } from '@/types/contract-interactions/shared';

/**
 * @dev handle associating and/or dissociating token from an EOA
 *
 * @dev integrates IHRC719.associate()
 *
 * @dev integrates IHRC719.dissociate()
 *
 * @param API: "ASSOCIATE" | "DISSOCIATE"
 *
 * @param hederaTokenAddress: string
 *
 * @param signer: ethers.JsonRpcSigner
 *
 * @param gasLimit: number
 *
 * @param network: TNetworkName
 *
 * @return Promise<ISmartContractExecutionResult>
 */
export const handleIHRC719APIs = async (
  API: 'ASSOCIATE' | 'DISSOCIATE',
  hederaTokenAddress: string,
  signer: ethers.JsonRpcSigner,
  gasLimit: number,
  network: TNetworkName
): Promise<ISmartContractExecutionResult> => {
  // sanitize params
  if (!isAddress(hederaTokenAddress)) {
    console.error('Invalid token address');
    return { err: 'Invalid token address' };
  }

  // prepare IHRC719 ABI
  const IHRC719 = new ethers.Interface(HEDERA_SMART_CONTRACTS_ASSETS.TOKEN_ASSOCIATION.contractABI);

  // prepare a contract instance at hederaTokenAddress
  const baseContract = new Contract(hederaTokenAddress, IHRC719, signer);

  // invoke contract method
  try {
    let txResult;
    switch (API) {
      case 'ASSOCIATE':
        if (gasLimit === 0) {
          const estimateGasResult = await handleEstimateGas(
            baseContract,
            signer.address,
            network,
            'associate',
            []
          );
          if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
          gasLimit = estimateGasResult.gasLimit;
        }
        txResult = await baseContract.associate({ gasLimit });
        break;
      case 'DISSOCIATE':
        if (gasLimit === 0) {
          const estimateGasResult = await handleEstimateGas(
            baseContract,
            signer.address,
            network,
            'dissociate',
            []
          );
          if (!estimateGasResult.gasLimit || estimateGasResult.err) return { err: estimateGasResult.err };
          gasLimit = estimateGasResult.gasLimit;
        }
        txResult = await baseContract.dissociate({ gasLimit });
        break;
    }

    // retrieve txReceipt
    const txReceipt = await txResult.wait();

    return { transactionHash: txReceipt.hash };
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};
