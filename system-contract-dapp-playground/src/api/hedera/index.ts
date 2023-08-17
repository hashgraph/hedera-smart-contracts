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
import { ContractABI, HederaSmartContractResult } from '@/types/interfaces';

/**
 * @dev deploys smart contract to Hedera network
 *
 * @params contractABI: ContractABI
 *
 * @params contractBytecode: string
 *
 * @return Promise<HederaSmartContractResult>
 *
 * @resource https://github.com/ed-marquez/hedera-example-metamask-counter-dapp/blob/master/src/components/hedera/contractDeploy.js
 */
export const deploySmartContract = async (
  contractABI: ContractABI[],
  contractBytecode: string,
  params: any[]
): Promise<HederaSmartContractResult> => {
  // get wallet provider
  const walletProvider = getWalletProvider();
  if (walletProvider.err || !walletProvider.walletProvider) {
    return { err: walletProvider.err };
  }

  // get signer
  const walletSigner = await walletProvider.walletProvider.getSigner();

  // Deploy smart contract
  try {
    // prepare gaslimit
    const gasLimit = 4_000_000;

    // get contract from contract factory
    const contract = new ContractFactory(
      JSON.stringify(contractABI),
      contractBytecode,
      walletSigner
    );

    // execute deploy transaction
    const contractDeployTx = await contract.deploy(...params, {
      gasLimit,
    });

    // get contractAddress
    const contractAddress = await contractDeployTx.getAddress();
    return { contractAddress };
  } catch (err) {
    console.error(err);
    return { err };
  }
};
