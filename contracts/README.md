# Hedera Smart Contracts

This folder serves as a comprehensive collection of smart contracts developed and meticulously maintained by the Hedera Smart Contract team. As a library, it encompasses various folders, each housing distinct implementations and patterns.

## Layout:

| Folder                        | Description                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **base/**                     | Base contract that provides a modifier for preventing delegatecall to methods in a child contract.                              |
| **diamond-pattern/**          | Smart contracts implementing the diamond pattern.                                                                               |
| **erc-1155/**                 | ERC-1155 token standard implementation for fungible and non-fungible tokens.                                                    |
| **erc-20-extensions/**        | Extensions and variations of the ERC-20 token standard.                                                                         |
| **erc-20/**                   | Standard ERC-20 token implementations.                                                                                          |
| **erc-721/**                  | Standard ERC-721 token implementations for non-fungible tokens.                                                                 |
| **evm/**                      | Showcases a set of precompiled functions commonly utilized in cryptographic operations.                                         |
| **Exchange Rate Precompiles** | Specific Hedera network contracts related to exchange rates.                                                                    |
| **hip-583/**                  | Implements alias support expansion in CryptoCreate & CryptoTransfer Transactions.                                               |
| **hts-precompiles/**          | Precompiled system smart contracts for the Hedera Token Service (HTS).                                                          |
| **multicaller/**              | Smart contracts facilitating multiple function calls.                                                                           |
| **native-precompiles/**       | Facilitates interaction with the ecrecover precompiled contract.                                                                |
| **proxy-upgrade/**            | Demonstrates the OpenZeppelin UUPSUpgradeable proxy pattern.                                                                    |
| **safe-hts-precompiles/**     | Safe versions of HTS system contracts.                                                                                          |
| **shanghai-opcodes/**         | Smart contracts related to Shanghai opcodes.                                                                                    |
| **solidity/**                 | A diverse collection of smart contracts that exemplify the equivalence of Solidity at the language layer on the Hedera network. |
| **openzeppelin/**             | Smart contracts demonstrating support for OpenZeppelin standard contracts on the Hedera network.                                |
| **yul/**                      | Smart contracts showcasing Yul inline-assembly equivalence on the Hedera network.                                               |
| **util-precompile/**          | Hedera Precompiled contracts to generate pseuodrandom numbers for use by both smart contracts and users.                        |

## Usage:

- Explore individual folders for specific implementations.
- Refer to the provided example contracts for understanding patterns and best practices.
