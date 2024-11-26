# ERC Token Indexer

## Abstract

This document outlines the design and implementation of the **ERC Token Indexer**, a standalone tool for identifying and cataloging ERC20 and ERC721 token contracts on the Hedera network. The indexer will index the Hedera network and scan contracts, verify their adherence to ERC standards, and produce structured output files for downstream applications. The goal is to provide developers and users with a reliable registry of tokens to enhance network insight and application usability.

## Motivation

Hedera supports ERC tokens alongside its native HTS tokens. However, there is no built-in mechanism to identify and list ERC20 and ERC721 tokens on the network. This lack of visibility impacts the usability of tools like the Mirror Node Explorer and limits the ability of developers to interact with these tokens.

The ERC Token Indexer addresses this gap by:

1. **Providing Discoverability**: Enabling tools to display and interact with ERC tokens effectively.
2. **Automating Identification**: Streamlining the process of detecting and validating token contracts.
3. **Serving as a Foundation**: Establishing a structured dataset for broader ecosystem enhancements.

## Design

### Tool Overview

The ERC Token Indexer will:

- Fetch smart contract data from the Hedera Mirror Node API.
- Detect ERC20 and ERC721 token contracts using function signature matching.
- Optionally validate contracts via `eth_call` for additional confidence.
- Generate two JSON files: one for ERC20 tokens and another for ERC721 tokens.

### Key Features

1. **Network-Agnostic Configuration**:

   - The tool will support flexible configurations for different environments (`testnet`, `mainnet`, etc.) and mirror node endpoints.

2. **Interface Signature Matching**:

   - Identify token contracts by analyzing bytecode for ERC20 or ERC721 function signatures.

3. **Validation**:

   - Include an optional mechanism to validate contracts by calling key functions (`name`, `symbol`, `totalSupply`, etc.).

4. **Registry Generation**:
   - Create structured, sorted JSON files for ERC20 and ERC721 tokens.

### Architecture

The indexer will consist of the following components:

#### 1. **Contract Scanner**

- **Purpose**: Retrieve and analyze smart contracts from the Hedera Mirror Node API.
- **Workflow**:
  - Fetch contracts starting from a configurable `startingContractId`.
  - Retrieve and parse bytecode for each contract.
  - Match bytecode against known ERC20 and ERC721 function signatures.
- **Output**: A list of candidate ERC20 and ERC721 contracts.

#### 2. **Validator** (Optional)

- **Purpose**: Increase confidence in token identification.
- **Workflow**:
  - Use `eth_call` to invoke key methods and confirm their behavior.
  - Validate token metadata such as `name`, `symbol`, and `decimals` for ERC20 tokens.
  - Validate `name` and `symbol` for ERC721 tokens.
- **Output**: Filtered and validated list of ERC tokens.

#### 3. **Registry Generator**

- **Purpose**: Generate output files in the required format.
- **Workflow**:
  - Aggregate data for identified ERC tokens.
  - Generate two JSON files:
    - `ERC20_registry.json`
    - `ERC721_registry.json`
  - Sort entries by `contractId` in ascending order (from oldest to newest).
  - Ensure compliance with the schema for each token type.

#### 4. **Configuration Manager**

- **Purpose**: Enable flexible and environment-specific configurations.
- **Parameters**:
  - `env`: Network environment (e.g., testnet, mainnet).
  - `mirrorNodeUrl`: API URL for the Hedera mirror node.
  - `startingContractId`: Optional starting contract ID for scanning.

### Workflow

1. **Initialization**:

   - Load environment variables and configuration parameters.
   - Establish a connection with the Mirror Node API.

2. **Scanning Contracts**:

   - Retrieve contract details sequentially starting from the specified `startingContractId`.
   - Parse contract bytecode and identify function selectors corresponding to ERC20 and ERC721 standards:
     - **ERC20 Selectors**:
       - `0x18160ddd`: `totalSupply()`
       - `0x70a08231`: `balanceOf(address)`
       - `0xa9059cbb`: `transfer(address,uint256)`
       - `0x095ea7b3`: `approve(address,uint256)`
       - `0xdd62ed3e`: `allowance(address,address)`
     - **ERC721 Selectors**:
       - `0x6352211e`: `ownerOf(uint256)`
       - `0x42842e0e`: `safeTransferFrom(address,address,uint256)`
       - `0x095ea7b3`: `approve(address,uint256)`
       - `0x081812fc`: `getApproved(uint256)`

3. **Validation (Optional)**:

   - Perform `eth_call` on detected contracts to confirm:
     - ERC20:
       - `name`, `symbol`, `decimals`, `totalSupply`.
     - ERC721:
       - `name`, `symbol`.
   - Filter out contracts that fail validation.

4. **Registry Generation**:
   - Aggregate validated contracts into two separate registries:
     - **ERC20**:
       ```json
       [
         {
           "address": "0x....",
           "contractId": "0.0.x",
           "name": "...",
           "symbol": "...",
           "decimals": x,
           "totalSupply": "..."
         }
       ]
       ```
     - **ERC721**:
       ```json
       [
         {
           "address": "0x....",
           "contractId": "0.0.x",
           "name": "...",
           "symbol": "..."
         }
       ]
       ```
   - Sort entries in ascending order of `contractId`.
   - Save output files to `tools/erc-repository-indexer/registry`.

### Output Examples

#### ERC20 Registry

```json
[
  {
    "address": "0x123456...",
    "contractId": "0.0.12345",
    "name": "Test Token",
    "symbol": "TEST",
    "decimals": 18,
    "totalSupply": "1000000000000000000"
  }
]
```

#### ERC721 Registry

```json
[
  {
    "address": "0xabcdef...",
    "contractId": "0.0.67890",
    "name": "NFT Token",
    "symbol": "NFT"
  }
]
```

### Future Enhancements

1. **SEVM Integration**:
   - Transition to SEVM for improved contract analysis.
2. **Extended Standards**:
   - Add support for other token standards like ERC1155.

The ERC Token Indexer will serve as a foundational tool for discovering and cataloging ERC tokens on Hedera, addressing a critical need for token visibility and usability across the network. By focusing on accuracy, scalability, and extensibility, this tool will empower developers and applications to interact seamlessly with the Hedera ecosystem.
