# ERC Contract Indexer for Hedera Hashgraph

## Overview

The ERC Contract Indexer is a tool designed to facilitate the indexing and management of ERC20 and ERC721 smart contracts on the Hedera Hashgraph network. This project provides a set of services to fetch, analyze, and store contract data efficiently, enabling developers and users to interact with smart contracts seamlessly.

## Features

- **Contract Fetching**: Retrieve contract details from the Hedera mirror node.
- **Bytecode Analysis**: Analyze smart contract bytecode to categorize contracts as ERC20 or ERC721.
- **Registry Management**: Generate and update registries for ERC20 and ERC721 contracts.
- **Next Pointer Handling**: Manage pagination for contract indexing using a next pointer.

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm (Node Package Manager)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/hashgraph/hedera-smart-contracts.git
   cd tools/erc-repository-indexer/erc-contract-indexer
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and configure your environment variables:

| Variable               | Description                                                                                                    | Accepted Values                                                                                                                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HEDERA_NETWORK`       | The network to connect to.                                                                                     | `local-node`, `previewnet`, `testnet`, or `mainnet`                                                                                                                                                                             |
| `MIRROR_NODE_URL`      | The URL for the Hedera mirror node API.                                                                        | A valid URL pointing to the Hedera mirror node (e.g., `https://{previewnet\|testnet\|mainnet}.mirrornode.hedera.com`)                                                                                                           |
| `MIRROR_NODE_URL_WEB3` | The URL for the Hedera Mirror Node Web3Module API, required only when `HEDERA_NETWORK` is set to `local-node`. | Any value                                                                                                                                                                                                                       |
| `STARTING_POINT`       | The starting point for contract indexing.                                                                      | A Hedera contract ID (e.g., `0.0.369`), an EVM 20-byte address (e.g., `0x0000000000000000000000000000000000000369`), or a get contract list next pointer (e.g., `/api/v1/contracts?limit=100&order=asc&contract.id=gt:0.0.369`) |
| `SDK_OPERATOR_ID`      | The operator ID used to initialize a Hashgraph SDK, applicable only for testing.                               | Hedera Account IDs                                                                                                                                                                                                              |
| `SDK_OPERATOR_KEY`     | The operator Key used to initialize a Hashgraph SDK, applicable only for testing.                              | Hedera Account DER Private Key                                                                                                                                                                                                  |

Example configuration:

```plaintext
HEDERA_NETWORK=testnet
MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com
STARTING_POINT=0.0.1013
```

> **Note:** If a `STARTING_POINT` is not set, the tool will first look for a saved `next` pointer in the registry storage to continue indexing. If no pointer is available, the tool will start from the genesis block.

### Usage

To start the indexing process, run the following command:

```bash
npm start
```

This will initiate the indexing process, fetching contracts from the specified starting point and categorizing them into ERC20 and ERC721 contracts. The end goal is to generate a comprehensive registry that contains JSON files for both ERC-20 and ERC-721 tokens. The expected format for these registries is as follows:

- **ERC20**:
  ```json
  [
    {
      "address": "0xevm_address",
      "contractId": "0.0.hedera_contract_id"
    }
  ]
  ```
- **ERC721**:
  ```json
  [
    {
      "address": "0xevm_address",
      "contractId": "0.0.hedera_contract_id"
    }
  ]
  ```
  These JSON files will serve as a reliable registry of ERC tokens on the Hedera network, enhancing visibility and usability for developers and users alike.

> **Note:** Future updates will enhance the JSON file format to include additional details about the ERC tokens.

### Testing

To run the tests for the project, use the following command:

```bash
npm test
```

This will execute the test suite and provide feedback on the functionality of the services.
