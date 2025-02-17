// SPDX-License-Identifier: Apache-2.0

export default {
  RETRY_DELAY_MS: 9000,
  GET_CONTRACT_ENDPOINT: '/api/v1/contracts',
  CONTRACT_CALL_ENDPOINT: '/api/v1/contracts/call',
  ERC_20_JSON_FILE_NAME: 'erc-20.json',
  ERC_721_JSON_FILE_NAME: 'erc-721.json',
  ERC_1155_JSON_FILE_NAME: 'erc-1155.json',
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
  ERC_STANDARD_SIGNATURES: {
    /**
     * The pattern for identifying ERC-20 bytecode, based on a set of method and event signatures
     * as defined in the ERC-20 standard interface.
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
     */
    ERC20: [
      'dd62ed3e',
      '095ea7b3',
      '70a08231',
      '18160ddd',
      'a9059cbb',
      '23b872dd',
      '8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
      'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    ],

    /**
     * The pattern for identifying ERC-721 bytecode, based on a set of method and event signatures
     * as defined in the ERC-721 standard interface.
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
     */
    ERC721: [
      '095ea7b3',
      '70a08231',
      '081812fc',
      'e985e9c5',
      '6352211e',
      '42842e0e',
      'b88d4fde',
      'a22cb465',
      '01ffc9a7',
      '23b872dd',
      '8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
      '17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31',
      'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    ],

    /**
     * The pattern for identifying ERC-1155 bytecode, based on a set of method and event signatures
     * as defined in the ERC-1155 standard interface.
     *
     * Selectors (Methods):
     * - '00fdd58e': 'function balanceOf(address account, uint256 id) external view returns (uint256)',
     * - '4e1273f4': 'function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids) external view returns (uint256[] memory)',
     * - 'e985e9c5': 'function isApprovedForAll(address account, address operator) external view returns (bool),
     * - '2eb2c2d6': 'function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata values, bytes calldata data) external',
     * - 'f242432a': 'function safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes calldata data) external',
     * - 'a22cb465': 'function setApprovalForAll(address operator, bool approved) external',
     * - '01ffc9a7': 'function supportsInterface(bytes4 interfaceID) view returns (bool)'
     *
     * Topics (Events):
     * - '17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31': 'event ApprovalForAll(address indexed account, address indexed operator, bool approved)',
     * - '4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb': 'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
     * - 'c3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62': 'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);',
     * - '6bb7ff708619ba0610cba295a58592e0451dee2622938c8755667688daf3529b': 'event URI(string value, uint256 indexed id)'. Note: This event is defined in the IERC1155 interface but is not triggered in the base OpenZeppelin ERC1155 abstract contract.
     *                                                                                                                      As a result, it is not included in the bytecode of a custom contract inheriting from ERC1155. Only if explicitly implemented
     *                                                                                                                      in a derived contract, the event signature hash will appear in the compiled bytecode. For more flexible signature matching,
     *                                                                                                                      this hash is excluded from the ERC1155 array below.
     *
     * source: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.1.0/contracts/token/ERC1155/IERC1155.sol
     */
    ERC1155: [
      'fdd58e', // Leading zeros ('00') are omitted in the bytecode due to EVM optimizations. This does not affect functionality, as Solidity uses a PUSH3 instruction to load the selector onto the stack.
      '4e1273f4',
      'e985e9c5',
      '2eb2c2d6',
      'f242432a',
      'a22cb465',
      '01ffc9a7',
      '17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31',
      '4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb',
      'c3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62',
    ],
  },
};
