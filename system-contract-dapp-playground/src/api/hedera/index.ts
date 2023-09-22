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

import { ContractFactory } from 'ethers';
import { getWalletProvider } from '../wallet';
import { ITransactionResult } from '@/types/contract-interactions/shared';
import { IContractABI, IHederaSmartContractResult } from '@/types/common';
import { HEDERA_TRANSACTION_RESULT_STORAGE_KEYS } from '@/utils/common/constants';

/**
 * @dev deploys smart contract to Hedera network
 *
 * @params contractABI: IContractABI
 *
 * @params contractBytecode: string
 *
 * @return Promise<IHederaSmartContractResult>
 *
 * @resource https://github.com/ed-marquez/hedera-example-metamask-counter-dapp/blob/master/src/components/hedera/contractDeploy.js
 */
export const deploySmartContract = async (
  contractABI: IContractABI[],
  contractBytecode: string,
  params: any[]
): Promise<IHederaSmartContractResult> => {
  // states
  const transactionResultStorageKey = HEDERA_TRANSACTION_RESULT_STORAGE_KEYS['CONTRACT-CREATE'];

  // get contract create transactions from localStorage
  const cachedCreateTransactions = localStorage.getItem(transactionResultStorageKey);
  const contractCreateTransactions = cachedCreateTransactions ? JSON.parse(cachedCreateTransactions) : [];

  // get signer
  const walletProvider = getWalletProvider();
  if (walletProvider.err || !walletProvider.walletProvider) {
    return { err: walletProvider.err };
  }
  const walletSigner = await walletProvider.walletProvider.getSigner();

  // Deploy smart contract
  try {
    // prepare gaslimit
    const gasLimit = 4_000_000;

    // get contract from contract factory
    const contract = new ContractFactory(JSON.stringify(contractABI), contractBytecode, walletSigner);

    // execute deploy transaction
    const contractDeployTx = await contract.deploy(...params, {
      gasLimit,
    });

    // get contractAddress
    const contractAddress = await contractDeployTx.getAddress();

    // retrieve transaction receipt
    const txReceipt = contractDeployTx.deploymentTransaction();

    // prepare create transaction result
    if (txReceipt) {
      const createTransactionResult: ITransactionResult = {
        status: 'success',
        transactionResultStorageKey,
        transactionTimeStamp: Date.now(),
        txHash: txReceipt.hash as string,
        transactionType: 'CONTRACT-CREATE',
        sessionedContractAddress: contractAddress,
      };
      contractCreateTransactions.push(createTransactionResult);
      localStorage.setItem(transactionResultStorageKey, JSON.stringify(contractCreateTransactions));
    }

    return { contractAddress };
  } catch (err) {
    console.error(err);
    return { err };
  }
};
