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
