/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
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

export default {
  RETRY_DELAY_MS: 9000,
  GET_CONTRACT_ENDPOINT: '/api/v1/contracts',
  CONTRACT_CALL_ENDPOINT: '/api/v1/contracts/call',
  ERC_20_JSON_FILE_NAME: 'erc-20.json',
  ERC_721_JSON_FILE_NAME: 'erc-721.json',
  GET_CONTRACTS_LIST_NEXT_POINTER_JSON_FILE_NAME: 'next-pointer.json',
  PRODUCTION_NETWORKS: ['previewnet', 'testnet', 'mainnet'],
  NETWORK_REGEX: /^(local-node|previewnet|testnet|mainnet)$/,
  MIRROR_NODE_URL_REGEX:
    /^https:\/\/(previewnet|testnet|mainnet)\.mirrornode\.hedera\.com$/,
  STARTING_POINT_REGEX:
    /^(0x[a-fA-F0-9]{40}|0\.0\.\d+|\/api\/v1\/contracts\?limit=100&order=asc&contract\.id=gte:0\.0\.\d+)$/,
  EVM_ADDRESS_REGEX: /^0x[a-fA-F0-9]{40}$/,
  HEDERA_CONTRACT_ID_REGEX: /^0\.0\.\d+$/,
  GET_CONTRACTS_LISTS_NEXT_REGEX:
    /^\/api\/v1\/contracts\?limit=100&order=asc&contract\.id=gte:0\.0\.\d+$/,
  ERC20_TOKEN_INFO_SELECTORS: [
    {
      type: 'string',
      field: 'name',
      sighash: '0x06fdde03',
    },
    {
      type: 'string',
      field: 'symbol',
      sighash: '0x95d89b41',
    },
    {
      type: 'uint256',
      field: 'totalSupply',
      sighash: '0x18160ddd',
    },
    {
      type: 'uint8',
      field: 'decimals',
      sighash: '0x313ce567',
    },
  ],
  ERC721_TOKEN_INFO_SELECTORS: [
    {
      type: 'string',
      field: 'name',
      sighash: '0x06fdde03',
    },
    {
      type: 'string',
      field: 'symbol',
      sighash: '0x95d89b41',
    },
  ],
};
