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

import { Contract } from 'ethers';

/**
 * @dev handle retrieving a pseudo-random seed
 *
 * @dev integrates PRNG.getPseudorandomSeed()
 *
 * @param baseContract: ethers.Contract
 *
 * @param gasLimit: Number
 *
 * @return Promise<PRNGContractResult>
 */
export const handlePRGNAPI = async (
  baseContract: Contract,
  gasLimit: Number
): Promise<PRNGContractResult> => {
  try {
    // invoke contract method
    const tx = await baseContract.getPseudorandomSeed({ gasLimit });

    // retrieve txReceipt
    const txReceipt = await tx.wait();

    const { data } = txReceipt.logs.filter(
      (event: any) => event.fragment.name === 'PseudoRandomSeed'
    )[0];

    return { transactionHash: txReceipt.hash, pseudoRandomSeed: data };
  } catch (err: any) {
    console.error(err);
    return { err, transactionHash: err.receipt && err.receipt.hash };
  }
};
