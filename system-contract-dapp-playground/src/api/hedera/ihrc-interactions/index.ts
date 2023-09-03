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

import { Contract, ethers, isAddress } from 'ethers';
import { HEDERA_SMART_CONTRACTS_ASSETS } from '@/utils/common/constants';

/**
 * @dev handle associating and/or dissociating token from an EOA
 *
 * @dev integrates IHRC.associate()
 *
 * @dev integrates IHRC.dissociate()
 *
 * @param API: "ASSOCIATE" | "DISSOCIATE"
 *
 * @param hederaTokenAddress: string
 *
 * @param signer: ethers.JsonRpcSigner
 *
 * @return Promise<IHRCContractResult>
 */
export const handleIHRCAPIs = async (
  API: 'ASSOCIATE' | 'DISSOCIATE',
  hederaTokenAddress: string,
  signer: ethers.JsonRpcSigner,
  gasLimit: number
): Promise<IHRCContractResult> => {
  // sanitize params
  if (!isAddress(hederaTokenAddress)) {
    console.error('Invalid token address');
    return { err: 'Invalid token address' };
  }

  // prepare IHRC ABI
  const IHRC = new ethers.Interface(HEDERA_SMART_CONTRACTS_ASSETS.TOKEN_ASSOCIATION.contractABI);

  // prepare a contract instance at hederaTokenAddress
  const baseContract = new Contract(hederaTokenAddress, IHRC, signer);

  // invoke contract method
  try {
    let txResult;
    switch (API) {
      case 'ASSOCIATE':
        txResult = await baseContract.associate({ gasLimit });
        break;
      case 'DISSOCIATE':
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