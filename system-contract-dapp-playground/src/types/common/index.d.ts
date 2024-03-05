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

import { BrowserProvider, Contract, ContractFactory } from 'ethers';

/**
 * @dev a type for network name
 */
type TNetworkName = 'mainnet' | 'testnet' | 'previewnet' | 'localnet';

/**
 * @dev a type for contract names
 */
type TContractName =
  | 'TokenCreateCustomContract'
  | 'TokenManagementContract'
  | 'ExchangeRatePrecompile'
  | 'TokenTransferContract'
  | 'TokenQueryContract'
  | 'PrngSystemContract'
  | 'IHRC719Contract'
  | 'ERC721Mock'
  | 'ERC20Mock';

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
interface IWalletResult {
  walletProvider?: BrowserProvider;
  accounts?: string[];
  currentChainId?: string;
  balance?: ethers.BigNumberish;
  err?: any;
}

/**
 * @dev an interface for the results related to ethers module
 *
 * @params baseContract?: ethers.Contract
 *
 * @params err: any
 */
interface IEthersResult {
  baseContract?: Contract;
  err?: any;
}

/**
 * @dev an interface for the results returned back from querying accoutnID to the Mirror Node
 *
 * @params accountId?: string
 *
 * @params err?: any
 */
interface IAccountIDMirrorNodeResult {
  accountId?: string;
  contractId?: string;
  err?: any;
}

/**
 * @dev an interface for the results returned back from querying estimated gasLimit to the Mirror Node
 *
 * @params gasLimit?: string
 *
 * @params err?: any
 */
interface IEstimateGasMirrorNodeResult {
  gasLimit?: number;
  err?: any;
}

/**
 * @dev an interface for the results returned back from interacting with Hedera smart contracts
 *
 * @params contractAddress?: string
 *
 * @params err: any
 */
interface IHederaSmartContractResult {
  contractAddress?: string;
  err?: any;
}

/**
 * @dev an interface for solidity contract ABI
 */
interface IContractABI {
  anonymous?: boolean;
  inputs?: any;
  name?: string;
  outputs?: any;
  stateMutability?: string;
  type?: string;
}

/**
 * @dev an interface for the Hedera contract assets
 *
 * @params name: string
 *
 * @params title: string
 *
 * @params contractABI: IContractABI[]
 *
 * @params contractBytecode: string
 *
 * @params githubUrl: string
 */
interface IHederaContractAsset {
  name: TContractName;
  title: string;
  githubUrl: string;
  contractBytecode: string;
  contractABI: IContractABI[];
  methods: string[];
}
