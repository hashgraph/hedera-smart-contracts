# ERC Contracts Indexer

## Abstract

This document outlines the design and implementation of the **ERC Contracts Indexer**, a standalone tool for identifying and cataloging ERC20 and ERC721 token contracts on the Hedera network. The indexer will index the Hedera network and scan contracts, verify their adherence to ERC standards, and produce structured output files for downstream applications. The goal is to provide developers and users with a reliable registry of tokens to enhance network insight and application usability.

## Motivation

Hedera supports ERC tokens alongside its native HTS tokens. However, there is no built-in mechanism to identify and list ERC20 and ERC721 tokens on the network. This lack of visibility impacts the usability of tools like the Mirror Node Explorer and limits the ability of developers to interact with these tokens.

The **ERC Contract Indexer** addresses this gap by:

1. **Providing Discoverability**: Enabling tools to display and interact with ERC tokens effectively.
2. **Automating Identification**: Streamlining the process of detecting and validating token contracts.
3. **Serving as a Foundation**: Establishing a structured dataset for broader ecosystem enhancements.

## Design

### Tool Overview

The **ERC Contract Indexer** will:

- Fetch smart contracts from the Hedera network using Mirror Node APIs.
- Detect ERC20 and ERC721 token contracts by performing function signature matching.
- Optionally validate contracts via `eth_call` for additional confidence.
- Finally, generate two registries in the format of JSON: one for ERC20 tokens and another for ERC721 tokens.

### Architecture

The indexer will consist of the following components:

#### 1. **ERC Interface Signature Matcher**

- **Objective**: Leverage Hedera Mirror Node APIs to retrieve and analyze all smart contracts on the Hedera network. Validate the bytecode of each contract through signature matching to determine compliance with the ERC-20 or ERC-721 standard.

- **Output**: A comprehensive list of verified ERC-20 and ERC-721 compliant contracts.

#### 2. **Validator** (Optional)

- **Purpose**: Increase confidence in token identification.
- **Output**: Filtered and validated list of ERC tokens.

#### 3. **Registry Generator**

- **Purpose**: Generate output files in the required format.
- **Output**: JSON files:
  - `ERC20_registry.json`
  - `ERC721_registry.json`

#### 4. **Configuration Manager**

- **Purpose**: Enable flexible and environment-specific configurations.
- **Parameters**:
  - `HEDERA_NETWORK`: Network environment (e.g., testnet, mainnet).
  - `MIRROR_NODE_URL`: API URL for the Hedera mirror node.
  - `STARTING_POINT`: a starting contract ID or a potential `next` pointer included in mirror node REST response (TBD).

### Implementation Workflow

1. **Initialization**:

   - Load environment variables and configuration parameters.

2. **Identifying ERCs**:

   a. **Retrieve Contract Batches**

   - Use the Hedera Mirror Node API to index the entire network, retrieving contracts in ascending order (from oldest to newest):

     - `https://{{network}}.mirrornode.hedera.com/api/v1/contracts?order=asc`

   b. **Fetch Contract Details and Parse Bytecode**

   - For each contract:
     - Retrieve contract details:
       - `https://{{network}}.mirrornode.hedera.com/api/v1/contracts/{contractIdOrEvmAddress}`
     - Extract and parse the bytecode from the contract detail object.
       _Note: Utilize concurrent requests to optimize execution efficiency._

   c. **Perform Interface Signature Matching**

   - Analyze the bytecode for compliance with ERC-20 or ERC-721 standards using the [Contract.isErc()](https://github.com/acuarica/evm/blob/402028ca8c3a33dbb8498f0200d9af2efbf4f792/src/index.ts#L153-L158) method from the [SEVM library](https://www.npmjs.com/package/sevm). This method analyzes the contract bytecode and matches function signatures to confirm compliance with the ERC-20 and ERC-721 standards.

   - Identify the following function selectors in the bytecode:

     - **ERC-20 Selectors**:

       - `0x18160ddd`: `totalSupply()`
       - `0x70a08231`: `balanceOf(address)`
       - `0xa9059cbb`: `transfer(address,uint256)`
       - `0x23b872dd`: `transferFrom(address,address,uint256)`
       - `0x095ea7b3`: `approve(address,uint256)`
       - `0xdd62ed3e`: `allowance(address,address)`

     - **ERC-721 Selectors**:
       - `0x6352211e`: `ownerOf(uint256)`
       - `0x42842e0e`: `safeTransferFrom(address,address,uint256)`
       - `0xb88d4fde`: `safeTransferFrom(address,address,uint256,bytes)`
       - `0x095ea7b3`: `approve(address,uint256)`
       - `0x081812fc`: `getApproved(uint256)`
       - `0xa22cb465`: `setApprovalForAll(address,bool)`
       - `0x70a08231`: `balanceOf(address)`
       - `0xe985e9c5`: `isApprovedForAll(address,address)`
       - `0x01ffc9a7`: `supportsInterface(bytes4)`
       - `0x23b872dd`: `transferFrom(address,address,uint256)`

d. **Handle Pagination**

- Since the `/contracts` endpoint has a limit of 100 records per request, use the `next` pointer provided in the response to recursively fetch subsequent batches and comprehensively index the network.
- Write the `next` pointer to disk for persistence, allowing the indexing process to resume from the last recorded point if interrupted or to accommodate future runs when additional contracts are deployed on the network.

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
           "symbol": "...",
           "serial_id": "..."
         }
       ]
       ```
   - Sort entries in ascending order of `contractId`.
   - Save output files to `tools/erc-repository-indexer/registry`.
