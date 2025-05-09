// SPDX-License-Identifier: Apache-2.0

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
  | 'ExchangeRateSystemContract'
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
