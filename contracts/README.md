# Hedera Smart Contracts

This folder serves as a comprehensive collection of smart contracts developed and meticulously maintained by the Hedera Smart Contract team. As a library, it encompasses various folders, each housing distinct implementations and patterns.

## Layout:

| Folder                                      | Description                                                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| [base/](base)                               | Base contract that provides an abstract contract for preventing delegatecall to methods in a child contract.                    |
| [bls-bn254-signatures/](bls-bn254-signatures) | Contracts implementing BLS signatures over the BN254 elliptic curve.                                                            |
| [bls-signature/](bls-signature)             | Contracts related to BLS (Boneh-Lynn-Shacham) signature schemes.                                                                |
| [cancun/](cancun)                           | Contracts showcasing features or optimizations related to the Cancun upgrade.                                                   |
| [diamond-pattern/](diamond-pattern)         | Smart contracts implementing the diamond pattern.                                                                               |
| [discrepancies/](discrepancies)             | Contracts highlighting or addressing discrepancies in implementations.                                                          |
| [hip-583/](hip-583)                         | Implements alias support expansion in CryptoCreate & CryptoTransfer Transactions.                                               |
| [hip-719-proxy/](hip-719-proxy)             | Implements proxy functionality as described in HIP-719.                                                                         |
| [libraries/](libraries)                     | Reusable library contracts for common functionality.                                                                            |
| [multicaller/](multicaller)                 | Smart contracts facilitating multiple function calls.                                                                           |
| [openzeppelin/](openzeppelin)               | Smart contracts demonstrating support for OpenZeppelin standard contracts on the Hedera network.                                |
| [precompile/](precompile)                   | Demonstrates the use of the Ethereum precompiled ecRecover function for signature verification and address recovery.            |
| [shanghai-opcodes/](shanghai-opcodes)       | Smart contracts showcases the support of the new OPCODEs introduced in Shanghai.                                                |
| [solidity/](solidity)                       | A diverse collection of smart contracts that exemplify the equivalence of Solidity at the language layer on the Hedera network. |
| [state-registry/](state-registry)           | Contracts managing state registry functionality.                                                                                |
| [system-contracts/](system-contracts)       | Collection of core Hedera System Contracts.                                                                                     |
| [system-contracts/exchange-rate/](system-contracts/exchange-rate) | System contracts related to exchange rate functionality.                                                     |
| [system-contracts/hedera-account-service/](system-contracts/hedera-account-service) | System contracts related to Hedera account services.                                     |
| [system-contracts/hedera-schedule-service/](system-contracts/hedera-schedule-service) | System contracts for Hedera schedule services.                                         |
| [system-contracts/hedera-token-service/](system-contracts/hedera-token-service) | System contracts related to Hedera token services.                                           |
| [system-contracts/hedera-token-service-v2/](system-contracts/hedera-token-service-v2) | Enhanced version of Hedera token service system contracts.                             |
| [system-contracts/native/](system-contracts/native) | Native system contracts for core Hedera functionality.                                                               |
| [system-contracts/pseudo-random-number-generator/](system-contracts/pseudo-random-number-generator) | System contracts for generating pseudo-random numbers.                   |
| [wrapped-tokens/](wrapped-tokens)           | Contracts implementing wrapped token functionality.                                                                             |
| [yul/](yul)                                 | Smart contracts showcasing Yul inline-assembly equivalence on the Hedera network.                                               |

## Usage:

- Explore individual folders for specific implementations.
- Refer to the provided example contracts for understanding patterns and best practices.
