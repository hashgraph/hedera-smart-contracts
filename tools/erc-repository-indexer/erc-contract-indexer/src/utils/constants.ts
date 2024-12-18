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
  ERC_STANDARD_SIGNATURE_REGEX: {
    /**
     * The regex pattern for identifying an ERC-20 bytecode.
     * Built on top of the following method and event signatures:
     *
     * Selectors (Methods):
     * - 'dd62ed3e': allowance(address _owner, address _spender) view returns (uint256 remaining)
     * - '095ea7b3': approve(address _spender, uint256 _value) returns (bool success)
     * - '70a08231': balanceOf(address _owner) view returns (uint256 balance)
     * - '18160ddd': totalSupply() view returns (uint256)
     * - 'a9059cbb': transfer(address _to, uint256 _value) returns (bool success)
     * - '23b872dd': transferFrom(address _from, address _to, uint256 _value) returns (bool success)
     *
     * Topics (Events):
     * - '8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925': Approval(address indexed _owner, address indexed _spender, uint256 _value)
     * - 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef': Transfer(address indexed _from, address indexed _to, uint256 _value)
     *
     * source: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.1.0/contracts/token/ERC20/IERC20.sol
     *
     * note: The `(?=...)` (positive lookahead operator) is used here to ensure that ALL the necessary selectors and topics exist at least once in the bytecode.
     *       It doesn't consume characters but asserts that the given pattern (selector or topic) can be found somewhere in the bytecode.
     */
    ERC20:
      /(?=.*dd62ed3e)(?=.*095ea7b3)(?=.*70a08231)(?=.*18160ddd)(?=.*a9059cbb)(?=.*23b872dd)(?=.*8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925)(?=.*ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef)/,

    /**
     * The regex pattern for identifying an ERC-721 bytecode.
     * Built on top of the following method and event signatures:
     *
     * Selectors (Methods):
     * - '095ea7b3': approve(address _approved, uint256 _tokenId) payable
     * - '70a08231': balanceOf(address _owner) view returns (uint256)
     * - '081812fc': getApproved(uint256 _tokenId) view returns (address)
     * - 'e985e9c5': isApprovedForAll(address _owner, address _operator) view returns (bool)
     * - '6352211e': ownerOf(uint256 _tokenId) view returns (address)
     * - '42842e0e': safeTransferFrom(address _from, address _to, uint256 _tokenId) payable
     * - 'b88d4fde': safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes data) payable
     * - 'a22cb465': setApprovalForAll(address _operator, bool _approved)
     * - '01ffc9a7': supportsInterface(bytes4 interfaceID) view returns (bool)
     * - '23b872dd': transferFrom(address _from, address _to, uint256 _tokenId) payable
     *
     * Topics (Events):
     * - '8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925': Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId)
     * - '17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31': ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved)
     * - 'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef': Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId)
     *
     * source: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.1.0/contracts/token/ERC721/IERC721.sol
     *
     * note: The `(?=...)` (positive lookahead operator) is used here to ensure that ALL the necessary selectors and topics exist at least once in the bytecode.
     *       It doesn't consume characters but asserts that the given pattern (selector or topic) can be found somewhere in the bytecode.
     */
    ERC721:
      /(?=.*095ea7b3)(?=.*70a08231)(?=.*081812fc)(?=.*e985e9c5)(?=.*6352211e)(?=.*42842e0e)(?=.*b88d4fde)(?=.*a22cb465)(?=.*01ffc9a7)(?=.*23b872dd)(?=.*8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925)(?=.*17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31)(?=.*ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef)/,
  },
};
