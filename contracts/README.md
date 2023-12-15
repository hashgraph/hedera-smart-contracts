# Hedera Smart Contracts

This folder serves as a comprehensive collection of smart contracts developed and meticulously maintained by the Hedera Smart Contract team. As a library, it encompasses various folders, each housing distinct implementations and patterns.

## Layout:

| Folder                        | Description                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **base/**                     | Base contract that provides an abstract contract for preventing delegatecall to methods in a child contract.                    |
| **diamond-pattern/**          | Smart contracts implementing the diamond pattern.                                                                               |
| **exchange-rate-precompiles** | Specific Hedera Exchange Rate Precompile methods.                                                                               |
| **hip-583/**                  | Implements alias support expansion in CryptoCreate & CryptoTransfer Transactions.                                               |
| **hts-precompiles/**          | Precompiled system smart contracts for the Hedera Token Service (HTS).                                                          |
| **multicaller/**              | Smart contracts facilitating multiple function calls.                                                                           |
| **native-precompiles/**       | Facilitates interaction with the ecrecover precompiled contract.                                                                |
| **openzeppelin/**             | Smart contracts demonstrating support for OpenZeppelin standard contracts on the Hedera network.                                |
| **proxy-upgrade/**            | Demonstrates the OpenZeppelin UUPSUpgradeable proxy pattern.                                                                    |
| **safe-hts-precompiles/**     | Safe versions of HTS system contracts.                                                                                          |
| **shanghai-opcodes/**         | Smart contracts showcases the support of the new OPCODEs introduced in Shanghai.                                                |
| **solidity/**                 | A diverse collection of smart contracts that exemplify the equivalence of Solidity at the language layer on the Hedera network. |
| **util-precompile/**          | Hedera Precompiled contracts to generate pseuodrandom numbers for use by both smart contracts and users.                        |
| **yul/**                      | Smart contracts showcasing Yul inline-assembly equivalence on the Hedera network.                                               |

## Usage:

- Explore individual folders for specific implementations.
- Refer to the provided example contracts for understanding patterns and best practices.
