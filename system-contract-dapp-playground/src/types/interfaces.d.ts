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

import { BrowserProvider } from 'ethers';

/**
 * @dev an interface for the results related to wallet interaction
 *
 * @params walletProvider?: BrowserProvider;
 *
 * @params accounts?: string[]
 *
 * @params currentChainId?: string
 *
 * @params err: any
 */
interface WalletResult {
  walletProvider?: BrowserProvider;
  accounts?: string[];
  currentChainId?: string;
  balance?: ethers.BigNumberish;
  err?: any;
}

/**
 * @dev a type for network name
 */
type NetworkName = 'mainnet' | 'testnet' | 'previewnet' | 'localnet';

/**
 * @dev an interface for the results returned back from querying Mirror Node
 *
 * @params accountId?: string
 *
 * @params err: any
 */
interface MirrorNodeResult {
  accountId?: string;
  contractId?: string;
  err?: any;
}

/**
 * @dev an interface for the results returned back from interacting with Hedera smart contracts
 *
 * @params contractAddress?: string
 *
 * @params err: any
 */
interface HederaSmartContractResult {
  contractAddress?: string;
  err?: any;
}

/**
 * @dev a type for solidity contract ABI
 */
type ContractABI = {
  anonymous?: boolean;
  inputs?: any;
  name?: string;
  outputs?: any;
  stateMutability?: string;
  type?: string;
};

/**
 * @dev an interface for the Hedera contract assets
 *
 * @params name: string
 *
 * @params title: string
 *
 * @params contractABI: ContractABI[]
 *
 * @params contractBytecode: string
 *
 * @params githubUrl: string
 */
interface HederaContractAsset {
  name: string;
  title: string;
  githubUrl: string;
  contractBytecode: string;
  contractABI: ContractABI[];
}
