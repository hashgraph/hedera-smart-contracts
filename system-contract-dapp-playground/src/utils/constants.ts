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

import ERC20Mock from '@hashgraph-smartcontract/artifacts/contracts/erc-20/ERC20Mock.sol/ERC20Mock.json';
import ERC721Mock from '@hashgraph-smartcontract/artifacts/contracts/erc-721/ERC721Mock.sol/ERC721Mock.json';
import HRCContract from '@hashgraph-smartcontract/artifacts/contracts/hts-precompile/examples/hrc/HRCContract.sol/HRCContract.json';
import PrngSystemContract from '@hashgraph-smartcontract/artifacts/contracts/util-precompile/PrngSystemContract.sol/PrngSystemContract.json';
import TokenQueryContract from '@hashgraph-smartcontract/artifacts/contracts/hts-precompile/examples/token-query/TokenQueryContract.sol/TokenQueryContract.json';
import ExchangeRatePrecompile from '@hashgraph-smartcontract/artifacts/contracts/exchange-rate-precompile/ExchangeRatePrecompile.sol/ExchangeRatePrecompile.json';
import TokenTransferContract from '@hashgraph-smartcontract/artifacts/contracts/hts-precompile/examples/token-transfer/TokenTransferContract.sol/TokenTransferContract.json';
import TokenManagementContract from '@hashgraph-smartcontract/artifacts/contracts/hts-precompile/examples/token-manage/TokenManagementContract.sol/TokenManagementContract.json';
import TokenCreateCustomContract from '@hashgraph-smartcontract/artifacts/contracts/hts-precompile/examples/token-create/TokenCreateCustom.sol/TokenCreateCustomContract.json';

/** @notice Hedera Smart Contract official github url */
export const HEDERA_SMART_CONTRACT_OFFICIAL_GITHUB_URL =
  'https://github.com/hashgraph/hedera-smart-contracts';

/** @notice hashcan baseURL */
export const HASHSCAN_BASE_URL = 'https://hashscan.io';

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
];

/**
 * @notice information for LeftSideBar items
 */
export const LEFT_SIDE_BAR_ITEMS = [
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
    name: 'Exchange rate system conract wrapper (Hip-475)',
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
 * @notice information about Hedera Smart Contract assets
 */
export const HEDERA_SMART_CONTRACTS_ASSETS = {
  HTS_PRECOMPILED: [
    {
      name: 'TokenCreateCustomContract',
      title: 'Token Create Contract',
      contractABI: TokenCreateCustomContract.abi,
      contractBytecode: TokenCreateCustomContract.bytecode,
      githubUrl: `${HEDERA_SMART_CONTRACT_OFFICIAL_GITHUB_URL}/blob/main/contracts/hts-precompile/examples/token-create/TokenCreateCustom.sol`,
    },
    {
      name: 'TokenManagementContract',
      title: 'Token Management Contract',
      contractABI: TokenManagementContract.abi,
      contractBytecode: TokenManagementContract.bytecode,
      githubUrl: `${HEDERA_SMART_CONTRACT_OFFICIAL_GITHUB_URL}/blob/main/contracts/hts-precompile/examples/token-manage/TokenManagementContract.sol`,
    },
    {
      name: 'TokenQueryContract',
      title: 'Token Query Contract',
      contractABI: TokenQueryContract.abi,
      contractBytecode: TokenQueryContract.bytecode,
      githubUrl: `${HEDERA_SMART_CONTRACT_OFFICIAL_GITHUB_URL}/blob/main/contracts/hts-precompile/examples/token-query/TokenQueryContract.sol`,
    },
    {
      name: 'TokenTransferContract',
      title: 'Token Transfer Contract',
      contractABI: TokenTransferContract.abi,
      contractBytecode: TokenTransferContract.bytecode,
      githubUrl: `${HEDERA_SMART_CONTRACT_OFFICIAL_GITHUB_URL}/blob/main/contracts/hts-precompile/examples/token-transfer/TokenTransferContract.sol`,
    },
  ],
  TOKEN_ASSOCIATION: {
    name: 'HRCContract',
    title: 'Token Associate Example Contract',
    contractABI: HRCContract.abi,
    contractBytecode: HRCContract.bytecode,
    githubUrl: `${HEDERA_SMART_CONTRACT_OFFICIAL_GITHUB_URL}/blob/main/contracts/hts-precompile/examples/hrc/HRCContract.sol`,
  },
  EXCHANGE_RATE: {
    name: 'ExchangeRatePrecompile',
    title: 'Exchange Rate Example Contract',
    contractABI: ExchangeRatePrecompile.abi,
    contractBytecode: ExchangeRatePrecompile.bytecode,
    githubUrl: `${HEDERA_SMART_CONTRACT_OFFICIAL_GITHUB_URL}/blob/main/contracts/exchange-rate-precompile/ExchangeRatePrecompile.sol`,
  },
  PRNG_PRECOMPILED: {
    name: 'PrngSystemContract',
    title: 'Pseudo Random Number Example Contract',
    contractABI: PrngSystemContract.abi,
    contractBytecode: PrngSystemContract.bytecode,
    githubUrl: `${HEDERA_SMART_CONTRACT_OFFICIAL_GITHUB_URL}/blob/main/contracts/util-precompile/PrngSystemContract.sol`,
  },
  ERC_20: {
    name: 'ERC20Mock',
    title: 'ERC-20 Example Contract',
    contractABI: ERC20Mock.abi,
    contractBytecode: ERC20Mock.bytecode,
    githubUrl: `${HEDERA_SMART_CONTRACT_OFFICIAL_GITHUB_URL}/blob/main/contracts/hts-precompile/examples/erc-20/ERC20Contract.sol`,
  },
  ERC_721: {
    name: 'ERC721Mock',
    title: 'ERC=721 Example Contract',
    contractABI: ERC721Mock.abi,
    contractBytecode: ERC721Mock.bytecode,
    githubUrl: `${HEDERA_SMART_CONTRACT_OFFICIAL_GITHUB_URL}/blob/main/contracts/hts-precompile/examples/erc-721/ERC721Contract.sol`,
  },
};
