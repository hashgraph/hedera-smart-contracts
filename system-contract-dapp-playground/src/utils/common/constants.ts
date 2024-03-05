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

import { TContractName } from '@/types/common';
import ERC20Mock from '@hashgraph-smartcontract/artifacts/contracts/openzeppelin/ERC-20/ERC20Mock.sol/ERC20Mock.json';
import IHRC719Contract from '@hashgraph-smartcontract/artifacts/contracts/hts-precompile/IHRC.sol/IHRC.json';
import ERC721Mock from '@hashgraph-smartcontract/artifacts/contracts/openzeppelin/ERC-721/ERC721Mock.sol/ERC721Mock.json';
import PrngSystemContract from '@hashgraph-smartcontract/artifacts/contracts/util-precompile/PrngSystemContract.sol/PrngSystemContract.json';
import ExchangeRatePrecompile from '@hashgraph-smartcontract/artifacts/contracts/exchange-rate-precompile/ExchangeRateMock.sol/ExchangeRateMock.json';
import TokenQueryContract from '@hashgraph-smartcontract/artifacts/contracts/hts-precompile/examples/token-query/TokenQueryContract.sol/TokenQueryContract.json';
import TokenTransferContract from '@hashgraph-smartcontract/artifacts/contracts/hts-precompile/examples/token-transfer/TokenTransferContract.sol/TokenTransferContract.json';
import TokenCreateCustomContract from '@hashgraph-smartcontract/artifacts/contracts/hts-precompile/examples/token-create/TokenCreateCustom.sol/TokenCreateCustomContract.json';
import TokenManagementContract from '@hashgraph-smartcontract/artifacts/contracts/hts-precompile/examples/token-manage/TokenManagementContract.sol/TokenManagementContract.json';

/** @notice Hedera Smart Contract official github url */
export const HEDERA_SMART_CONTRACT_OFFICIAL_GITHUB_URL =
  'https://github.com/hashgraph/hedera-smart-contracts';

/** @notice Hedera Improvement Proposals official url */
export const HEDERA_OFFICIAL_HIPS_URL = 'https://hips.hedera.com/';

/** @notice hashcan baseURL */
export const HASHSCAN_BASE_URL = 'https://hashscan.io';

/** @notice Hedera network */
export const OFFCIAL_NETWORK_NAME = 'HEDERA';

/** @notice information about Hedera social media */
export const HEDERA_SOCIAL_MEDIA = [
  {
    name: 'discord',
    link: 'https://discord.com/invite/hedera',
  },
  {
    name: 'facebook',
    link: 'https://www.facebook.com/hashgraph',
  },
  {
    name: 'linkedin',
    link: 'https://www.linkedin.com/company/hashgraph/',
  },
  {
    name: 'reddit',
    link: 'https://www.reddit.com/r/Hedera/',
  },
  {
    name: 'telegram',
    link: 'https://t.me/hederahashgraph',
  },
  {
    name: 'twitter',
    link: 'https://twitter.com/hedera',
  },
  {
    name: 'youtube',
    link: 'https://www.youtube.com/hederahashgraph',
  },
];

/**
 * @notice information about Hedera Networks
 */
export const HEDERA_NETWORKS = {
  mainnet: {
    chainId: '295',
    chainIdHex: '0x127',
    chainName: 'Hedera Mainnet',
    rpcUrls: 'https://mainnet.hashio.io/api',
    nativeCurrency: {
      name: 'Hedera',
      symbol: 'HBAR',
      decimals: 18,
    },
    blockExplorerUrls: 'https://hashscan.io/mainnet/dashboard',
    mirrorNodeUrl: 'https://mainnet.mirrornode.hedera.com/api/v1',
  },
  testnet: {
    chainId: '296',
    chainIdHex: '0x128',
    chainName: 'Hedera Testnet',
    rpcUrls: 'https://testnet.hashio.io/api',
    nativeCurrency: {
      name: 'Hedera',
      symbol: 'HBAR',
      decimals: 18,
    },
    blockExplorerUrls: 'https://hashscan.io/testnet/dashboard',
    mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com/api/v1',
  },
  previewnet: {
    chainId: '297',
    chainIdHex: '0x129',
    chainName: 'Hedera Previewnet',
    rpcUrls: 'https://previewnet.hashio.io/api',
    nativeCurrency: {
      name: 'Hedera',
      symbol: 'HBAR',
      decimals: 18,
    },
    blockExplorerUrls: 'https://hashscan.io/previewnet/dashboard',
    mirrorNodeUrl: 'https://previewnet.mirrornode.hedera.com/api/v1',
  },
  localnet: {
    chainId: '298',
    chainIdHex: '0x12a',
    chainName: 'Hedera Localnet',
    rpcUrls: 'http://localhost:7546',
    nativeCurrency: {
      name: 'Hedera',
      symbol: 'HBAR',
      decimals: 18,
    },
    blockExplorerUrls: 'http://localhost:8080',
    mirrorNodeUrl: 'http://127.0.0.1:5600/api/v1',
  },
};

/**
 * @notice information about protected routes
 */
export const PROTECTED_ROUTES = [
  '/hedera/overview',
  '/hedera/hts-hip-206',
  '/hedera/hrc-719',
  '/hedera/exchange-rate-hip-475',
  '/hedera/prng-hip-351',
  '/hedera/erc-20',
  '/hedera/erc-721',
  '/activity',
];

/**
 * @notice information for NavSideBar items
 */
export const NAV_SIDE_BAR_ITEMS = [
  {
    name: 'Overview',
    path: PROTECTED_ROUTES[0],
  },
  {
    name: 'HTS system contract wrapper (HIP-206)',
    path: PROTECTED_ROUTES[1],
  },
  {
    name: 'Token associate (HIP-719 / HRC-719)',
    path: PROTECTED_ROUTES[2],
  },
  {
    name: 'Exchange rate system conract wrapper (HIP-475)',
    path: PROTECTED_ROUTES[3],
  },
  {
    name: 'Pseudo random number system contract wrapper (HIP-351)',
    path: PROTECTED_ROUTES[4],
  },
  {
    name: 'Fungible token (ERC-20)',
    path: PROTECTED_ROUTES[5],
  },
  {
    name: 'Non-fungible token (ERC-721)',
    path: PROTECTED_ROUTES[6],
  },
];

/**
 * @notice an object storing contract names
 */
export const CONTRACT_NAMES: Record<string, TContractName> = {
  ERC20: 'ERC20Mock',
  ERC721: 'ERC721Mock',
  PRNG: 'PrngSystemContract',
  IHRC719: 'IHRC719Contract',
  TOKEN_QUERY: 'TokenQueryContract',
  TOKEN_TRANSFER: 'TokenTransferContract',
  EXCHANGE_RATE: 'ExchangeRatePrecompile',
  TOKEN_MANAGE: 'TokenManagementContract',
  TOKEN_CREATE: 'TokenCreateCustomContract',
};

/**
 * @notice information about Hedera Smart Contract assets
 */
export const HEDERA_SMART_CONTRACTS_ASSETS = {
  HTS_PRECOMPILED: [
    {
      name: 'TokenCreateCustomContract' as TContractName,
      title: 'Token Create Contract',
      contractABI: TokenCreateCustomContract.abi,
      contractBytecode: TokenCreateCustomContract.bytecode,
      githubUrl: `${HEDERA_SMART_CONTRACT_OFFICIAL_GITHUB_URL}/blob/main/contracts/hts-precompile/examples/token-create/TokenCreateCustom.sol`,
      methods: ['fungibleTokenCreate', 'non-fungibleTokenCreate', 'mint', 'tokenAssociation', 'grantKYC'],
    },
    {
      name: 'TokenManagementContract' as TContractName,
      title: 'Token Management Contract',
      contractABI: TokenManagementContract.abi,
      contractBytecode: TokenManagementContract.bytecode,
      githubUrl: `${HEDERA_SMART_CONTRACT_OFFICIAL_GITHUB_URL}/blob/main/contracts/hts-precompile/examples/token-manage/TokenManagementContract.sol`,
      methods: [
        'tokenInformation',
        'tokenPermission',
        'tokenStatus',
        'tokenRelation',
        'tokenSupplyReduction',
        'tokenDelete',
      ],
    },
    {
      name: 'TokenQueryContract' as TContractName,
      title: 'Token Query Contract',
      contractABI: TokenQueryContract.abi,
      contractBytecode: TokenQueryContract.bytecode,
      githubUrl: `${HEDERA_SMART_CONTRACT_OFFICIAL_GITHUB_URL}/blob/main/contracts/hts-precompile/examples/token-query/TokenQueryContract.sol`,
      methods: ['tokenValidity', 'generalInfo', 'specificInfo', 'tokenPermission', 'tokenStatus'],
    },
    {
      name: 'TokenTransferContract' as TContractName,
      title: 'Token Transfer Contract',
      contractABI: TokenTransferContract.abi,
      contractBytecode: TokenTransferContract.bytecode,
      githubUrl: `${HEDERA_SMART_CONTRACT_OFFICIAL_GITHUB_URL}/blob/main/contracts/hts-precompile/examples/token-transfer/TokenTransferContract.sol`,
      methods: ['crypto', 'transferToken', 'transferTokens'],
    },
  ],
  TOKEN_ASSOCIATION: {
    name: 'IHRC719Contract' as TContractName,
    title: 'Token Associate Example Contract',
    contractABI: IHRC719Contract.abi,
    contractBytecode: IHRC719Contract.bytecode,
    githubUrl: `${HEDERA_SMART_CONTRACT_OFFICIAL_GITHUB_URL}/blob/main/contracts/hts-precompile/IHRC.sol`,
    methods: ['IHRC / HIP-719'],
  },
  EXCHANGE_RATE: {
    name: 'ExchangeRatePrecompile' as TContractName,
    title: 'Exchange Rate Example Contract',
    contractABI: ExchangeRatePrecompile.abi,
    contractBytecode: ExchangeRatePrecompile.bytecode,
    githubUrl: `${HEDERA_SMART_CONTRACT_OFFICIAL_GITHUB_URL}/blob/main/contracts/exchange-rate-precompile/ExchangeRateMock.sol`,
    methods: ['Exchange Rate'],
  },
  PRNG_PRECOMPILED: {
    name: 'PrngSystemContract' as TContractName,
    title: 'Pseudo Random Number Example Contract',
    contractABI: PrngSystemContract.abi,
    contractBytecode: PrngSystemContract.bytecode,
    githubUrl: `${HEDERA_SMART_CONTRACT_OFFICIAL_GITHUB_URL}/blob/main/contracts/util-precompile/PrngSystemContract.sol`,
    methods: ['getPseudoRandomSeed'],
  },
  ERC_20: {
    name: 'ERC20Mock' as TContractName,
    title: 'ERC-20 Example Contract',
    contractABI: ERC20Mock.abi,
    contractBytecode: ERC20Mock.bytecode,
    githubUrl: `${HEDERA_SMART_CONTRACT_OFFICIAL_GITHUB_URL}/blob/main/contracts/erc-20/ERC20Mock.sol`,
    methods: ['tokenInformation', 'mint', 'balanceOf', 'tokenPermissions', 'transfer'],
  },
  ERC_721: {
    name: 'ERC721Mock' as TContractName,
    title: 'ERC-721 Example Contract',
    contractABI: ERC721Mock.abi,
    contractBytecode: ERC721Mock.bytecode,
    githubUrl: `${HEDERA_SMART_CONTRACT_OFFICIAL_GITHUB_URL}/blob/main/contracts/erc-721/ERC721Mock.sol`,
    methods: [
      'tokenInformation',
      'mint',
      'tokenURI',
      'balance',
      'owner',
      'approve',
      'operatorApproval',
      'transferFrom',
    ],
  },
};

/** @notice Hedera branding colors */
export const HEDERA_BRANDING_COLORS = {
  violet: '#82ACF9',
  purple: '#A98DF4',
  panel: '#374151',
};

/** @notice Input box sizes */
export const HEDERA_CHAKRA_INPUT_BOX_SIZES = {
  'extra-small': 'xs',
  small: 'sm',
  medium: 'md',
  large: 'lg',
};

/** @notice Table Variants */
export const HEDERA_CHAKRA_TABLE_VARIANTS = {
  simple: 'simple',
  striped: 'striped',
  unstyled: 'unstyled',
};

/** @notice Input box shared class name */
export const HEDERA_CHAKRA_INPUT_BOX_SHARED_CLASSNAME = 'w-full border-white/30';

/**
 * @notice a shared object for parameters input fields
 */
export const HEDERA_SHARED_PARAM_INPUT_FIELDS = {
  paramKey: '',
  inputType: '',
  explanation: '',
  inputPlaceholder: '',
  inputSize: HEDERA_CHAKRA_INPUT_BOX_SIZES.medium,
  inputFocusBorderColor: HEDERA_BRANDING_COLORS.purple,
  inputClassname: HEDERA_CHAKRA_INPUT_BOX_SHARED_CLASSNAME,
};

/**
 * @notice a shared object maping contract name to storage key value
 */
export const CONTRACT_NAME_TO_STORAGE_KEY_VALUE: Record<TContractName, string> = {
  ERC20Mock: 'ERC-20',
  ERC721Mock: 'ERC-721',
  IHRC719Contract: 'IHRC719',
  PrngSystemContract: 'PRNG',
  TokenQueryContract: 'TOKEN-QUERY',
  TokenTransferContract: 'TOKEN-TRANSFER',
  ExchangeRatePrecompile: 'EXCHANGE-RATE',
  TokenManagementContract: 'TOKEN-MANAGE',
  TokenCreateCustomContract: 'TOKEN-CREATE',
};

/**
 * @notice a shared object stores all transaction result storage keys
 */
const prepareTransactionResultStorageKey = (
  contractKey: string,
  methodKey: string,
  resultKey: string,
  readonly?: boolean
) => {
  return `HEDERA.${contractKey}.${methodKey}.${resultKey}-RESULTS${readonly ? `.READONLY` : ``}`;
};
export const HEDERA_TRANSACTION_RESULT_STORAGE_KEYS = {
  'CONTRACT-CREATE': 'HEDERA.CONTRACT-CREATE-RESULTS',
  'TOKEN-CREATE': {
    'TOKEN-KYC': prepareTransactionResultStorageKey('HTS', 'TOKEN-CREATE', 'TOKEN-KYC'),
    'MINT-TOKEN': prepareTransactionResultStorageKey('HTS', 'TOKEN-CREATE', 'MINT-TOKEN'),
    'FUNGIBLE-TOKEN': prepareTransactionResultStorageKey('HTS', 'TOKEN-CREATE', 'FUNGIBLE-TOKEN'),
    'ASSOCIATE-TOKEN': prepareTransactionResultStorageKey('HTS', 'TOKEN-CREATE', 'ASSOCIATE-TOKEN'),
    'NON-FUNGIBLE-TOKEN': prepareTransactionResultStorageKey('HTS', 'TOKEN-CREATE', 'NON-FUNGIBLE-TOKEN'),
  },
  'TOKEN-MANAGE': {
    'TOKEN-INFO': prepareTransactionResultStorageKey('HTS', 'TOKEN-MANAGE', 'TOKEN-INFO'),
    'TOKEN-STATUS': prepareTransactionResultStorageKey('HTS', 'TOKEN-MANAGE', 'TOKEN-STATUS'),
    'TOKEN-DELETE': prepareTransactionResultStorageKey('HTS', 'TOKEN-MANAGE', 'TOKEN-DELETE'),
    'TOKEN-RELATION': prepareTransactionResultStorageKey('HTS', 'TOKEN-MANAGE', 'TOKEN-RELATION'),
    'TOKEN-REDUCTION': prepareTransactionResultStorageKey('HTS', 'TOKEN-MANAGE', 'TOKEN-REDUCTION'),
    'TOKEN-PERMISSION': prepareTransactionResultStorageKey('HTS', 'TOKEN-MANAGE', 'TOKEN-PERMISSION'),
  },
  'TOKEN-QUERY': {
    'TOKEN-VALIDITY': prepareTransactionResultStorageKey('HTS', 'TOKEN-QUERY', 'TOKEN-VALIDITY'),
    'TOKEN-PERMISSION': prepareTransactionResultStorageKey('HTS', 'TOKEN-QUERY', 'TOKEN-PERMISSION'),
    'TOKEN-STATUS-INFO': prepareTransactionResultStorageKey('HTS', 'TOKEN-QUERY', 'TOKEN-STATUS-INFO'),
    'TOKEN-GENERAL-INFO': prepareTransactionResultStorageKey('HTS', 'TOKEN-QUERY', 'TOKEN-GENERAL-INFO'),
    'TOKEN-SPECIFIC-INFO': prepareTransactionResultStorageKey('HTS', 'TOKEN-QUERY', 'TOKEN-SPECIFIC-INFO'),
  },
  'TOKEN-TRANSFER': {
    'SINGLE-TOKEN': prepareTransactionResultStorageKey('HTS', 'TOKEN-TRANSFER', 'SINGLE-TOKEN'),
    'CRYPTO-TRANSFER': prepareTransactionResultStorageKey('HTS', 'TOKEN-TRANSFER', 'CRYPTO-TRANSFER'),
    'MULTIPLE-TOKENS': prepareTransactionResultStorageKey('HTS', 'TOKEN-TRANSFER', 'MULTIPLE-TOKENS'),
  },
  'IHRC719-RESULTS': `HEDERA.IHRC719.IHRC719-RESULTS`,
  'ERC20-RESULT': {
    'TOKEN-INFO': prepareTransactionResultStorageKey('EIP', 'ERC-20', 'TOKEN-INFO'),
    'TOKEN-MINT': prepareTransactionResultStorageKey('EIP', 'ERC-20', 'TOKEN-MINT'),
    'BALANCE-OF': prepareTransactionResultStorageKey('EIP', 'ERC-20', 'BALANCE-OF', true),
    'TOKEN-TRANSFER': prepareTransactionResultStorageKey('EIP', 'ERC-20', 'TOKEN-TRANSFER'),
    'TOKEN-PERMISSION': prepareTransactionResultStorageKey('EIP', 'ERC-20', 'TOKEN-PERMISSION'),
    'ALLOWANCES-RESULT': prepareTransactionResultStorageKey('EIP', 'ERC-20', 'ALLOWANCES', true),
  },
  'ERC721-RESULT': {
    'TOKEN-INFO': prepareTransactionResultStorageKey('EIP', 'ERC-721', 'TOKEN-INFO', true),
    'TOKEN-MINT': prepareTransactionResultStorageKey('EIP', 'ERC-721', 'TOKEN-MINT'),
    'OWNER-OF': prepareTransactionResultStorageKey('EIP', 'ERC-721', 'OWNER-OF', true),
    'SET-APPROVAL': prepareTransactionResultStorageKey('EIP', 'ERC-721', 'SET-APPROVAL'),
    'TOKEN-URI': prepareTransactionResultStorageKey('EIP', 'ERC-721', 'TOKEN-URI', true),
    'BALANCE-OF': prepareTransactionResultStorageKey('EIP', 'ERC-721', 'BALANCE-OF', true),
    'TOKEN-TRANSFER': prepareTransactionResultStorageKey('EIP', 'ERC-721', 'TOKEN-TRANSFER'),
    'TOKEN-PERMISSION': prepareTransactionResultStorageKey('EIP', 'ERC-721', 'TOKEN-PERMISSION'),
    'APPROVAL-STATUS': prepareTransactionResultStorageKey('EIP', 'ERC-721', 'APPROVAL-STATUS', true),
  },
  'PRNG-RESULT': {
    'PSEUDO-RANDOM': prepareTransactionResultStorageKey('PRNG', 'PRNG', 'PSEUDO-RANDOM'),
  },
  'EXCHANGE-RATE-RESULT': {
    'EXCHANGE-RATE': prepareTransactionResultStorageKey('EXCHANGE', 'EXCHANGE', 'EXCHANGE-RATE'),
  },
};

/**
 * @notice stores common revert reasons from wallet
 */
export const HEDERA_COMMON_WALLET_REVERT_REASONS = {
  REJECT: {
    // @notice 4001 error code is returned when a metamask wallet request is rejected by the user
    // @notice See https://docs.metamask.io/wallet/reference/provider-api/#errors for more information on the error returned by Metamask.
    code: '4001',
    description: 'You have rejected the request.',
  },
  NETWORK_SWITCH: {
    // @notice -32002 error code is returned when a metamask wallet request is already in progress
    // @notice See https://docs.metamask.io/wallet/reference/provider-api/#errors for more information on the error returned by Metamask.
    code: '-32002',
    description: 'A network switch request already in progress.',
  },
  NONCE: {
    message: 'nonce has already been used',
    description: 'Nonce has already been used. Please try again!',
  },
  ALLOWANCE_BELOW_ZERO: {
    message: 'decreased allowance below zero',
    description: 'The transaction was reverted due to the allowance decrease falling below zero.',
  },
  TRANSFER_EXCEEDS_BALANCE: {
    message: 'transfer amount exceeds balance',
    description: 'Transfer amount exceeds balance.',
  },
  INSUFFICIENT_ALLOWANCE: {
    message: 'insufficient allowance',
    description: 'Insufficient allowance.',
  },
  UNAUTHORIZED_CALLER: {
    message: 'approve caller is not token owner or approved for all',
    description: 'Unauthorized caller. Caller is not token owner.',
  },
  APPROVAL_CURRENT_CALLER: {
    message: 'approval to current owner',
    description: 'Caller is the token owner.',
  },
  INVALID_TOKENID: {
    message: 'invalid token ID',
    description: 'Invalid token ID',
  },
  DEFAULT: {
    description: "See client's console for more information",
  },
};

/**
 * @notice stores common transaction type constants
 */
export const HEDERA_COMMON_TRANSACTION_TYPE = {
  ERC20_MINT: 'ERC20-MINT',
  ERC721_MINT: 'ERC721-MINT',
  HIP351_PRNG: 'HIP-351-PRNG',
  HTS_WIPE_NFT: 'HTS-WIPE-NFT',
  HTS_NFT_MINT: 'HTS-NFT-MINT',
  ERC20_APPROVE: 'ERC20-APPROVE',
  HTS_GRANT_KYC: 'HTS-GRANT-KYC',
  HTS_NFT_CREATE: 'HTS-NFT-CREATE',
  HTS_TOKEN_MINT: 'HTS-TOKEN-MINT',
  HTS_WIPE_TOKEN: 'HTS-WIPE-TOKEN',
  HTS_TOKEN_BURN: 'HTS-TOKEN-BURN',
  ERC20_TRANSFER: 'ERC20-TRANSFER',
  ERC721_APPROVE: 'ERC721-APPROVE',
  HIP475_BAR_TO_CENT: 'BAR-TO-CENT',
  HIP475_CENT_TO_BAR: 'CENT-TO-BAR',
  HTS_TOKEN_PAUSE: 'HTS-TOKEN-PAUSE',
  ERC721_OWNER_OF: 'ERC721-OWNER-OF',
  HTS_TOKEN_CREATE: 'HTS-TOKEN-CREATE',
  HTS_TOKEN_DELETE: 'HTS-TOKEN-DELETE',
  HTS_FREEZE_TOKEN: 'HTS-FREEZE-TOKEN',
  HTS_QUERY_IS_KYC: 'HTS-QUERY-IS-KYC',
  ERC20_ALLOWANCES: 'ERC20-ALLOWANCES',
  ERC721_TOKEN_URI: 'ERC721-TOKEN-URI',
  ERC20_TOKEN_INFO: 'ERC20-TOKEN-INFO',
  HTS_SET_APPROVAL: 'HTS-SET-APPROVAL',
  HTS_APPROVED_NFT: 'HTS-APPROVED-NFT',
  ERC20_BALANCE_OF: 'ERC20-BALANCE-OF',
  IHRC719_ASSOCIATE: 'IHRC719-ASSOCIATE',
  HTS_TOKEN_UNPAUSE: 'HTS-TOKEN-UNPAUSE',
  ERC721_TOKEN_INFO: 'ERC721-TOKEN-INFO',
  ERC721_BALANCE_OF: 'ERC721-BALANCE-OF',
  HTS_UNFREEZE_TOKEN: 'HTS-UNFREEZE-TOKEN',
  HTS_QUERY_NFT_INFO: 'HTS-QUERY-NFT-INFO',
  ERC721_IS_APPROVAL: 'ERC721-IS-APPROVAL',
  HTS_TOKEN_TRANSFER: 'HTS-TOKEN-TRANSFER',
  HTS_APPROVED_TOKEN: 'HTS-APPROVED-TOKEN',
  IHRC719_DISSOCIATE: 'IHRC719-DISSOCIATE',
  ERC721_GET_APPROVE: 'ERC721-GET-APPROVE',
  HTS_QUERY_IS_TOKEN: 'HTS-QUERY-IS-TOKEN',
  HTS_QUERY_ALLOWANCE: 'HTS-QUERY-ALLOWANCE',
  HTS_QUERY_IS_FROZEN: 'HTS-QUERY-IS-FROZEN',
  HTS_CRYPTO_TRANSFER: 'HTS-CRYPTO-TRANSFER',
  HTS_TOKENS_TRANSFER: 'HTS-TOKENS-TRANSFER',
  ERC721_SET_APPROVAL: 'ERC721-SET-APPROVAL',
  HTS_REVOKE_KYC: 'HTS-APPROVED-REVOKE-KYC',
  HTS_TOKEN_ASSOCIATE: 'HTS-TOKEN-ASSOCIATE',
  ERC20_TRANSFER_FROM: 'ERC20-TRANSFER-FROM',
  HTS_UPDATE_INFO: 'HTS-APPROVED-UPDATE-INFO',
  HTS_UPDATE_KEYS: 'HTS-APPROVED-UPDATE-KEYS',
  HTS_QUERY_TOKEN_TYPE: 'HTS-QUERY-TOKEN-TYPE',
  HTS_QUERY_TOKEN_KEYS: 'HTS-QUERY-TOKEN-KEYS',
  ERC721_TRANSFER_FROM: 'ERC721-TRANSFER-FROM',
  HTS_QUERY_TOKEN_INFO: 'HTS-QUERY-TOKEN-INFO',
  HTS_QUERY_IS_APPROVAL: 'HTS-QUERY-IS-APPROVAL',
  HTS_QUERY_CUSTOM_FEES: 'HTS-QUERY-CUSTOM-FEES',
  HTS_UPDATE_EXPIRY: 'HTS-APPROVED-UPDATE-EXPIRY',
  HTS_QUERY_TOKEN_EXPIRY: 'HTS-QUERY-TOKEN-EXPIRY',
  HTS_QUERY_GET_APPROVED: 'HTS-QUERY-GET-APPROVED',
  HTS_QUERY_FUNGIBLE_INFO: 'HTS-QUERY-FUNGIBLE-INFO',
  ERC20_INCREASE_ALLOWANCE: 'ERC20-INCREASE-ALLOWANCE',
  ERC20_DECREASE_ALLOWANCE: 'ERC20-DECREASE-ALLOWANCE',
  HTS_DISSOCIATE_TOKEN: 'HTS-UNFREEZE-DISSOCIATE-TOKEN',
  ERC721_SAFE_TRANSFER_FROM: 'ERC721-SAFE-TRANSFER-FROM',
  HTS_QUERY_DEFAULT_KYC_STATUS: 'HTS-QUERY-DEFAULT-KYC-STATUS',
  HTS_QUERY_DEFAULT_FREEZE_STATUS: 'HTS-QUERY-DEFAULT-FREEZE-STATUS',
};
