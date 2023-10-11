# Source Code Documentation

## Codebase Walkthrough - **src/api/** Folder

### a. Overview

The **src/api/** folder encompasses various subdirectories, each dedicated to a specific category of APIs essential for the DApp's operation. These subdirectories are meticulously organized to streamline the development process and enhance code maintainability.

Here is a breakdown of the **src/api/** subdirectories:

- `cookies/` folder: This directory contains APIs and functionalities related to interacting with browser cookies, facilitating data management and persistence.

- `ethers/` folder: This subdirectory contains APIs and utilities for interacting with the `ethers.js` library, ensuring efficient communication with the `Hedera` network.

- `hedera/` folder: This directory hosts a set of APIs that are responsible for interacting with Hedera's system contracts. These contracts play a pivotal role in the DApp's functionality.

  - `erc20-interactions/` folder: Contains APIs designed for interacting with the `ERC20Mock` contract, offering features related to ERC-20 token management.

  - `erc721-interactions/` folder: This subdirectory encompasses APIs specialized in interacting with the `ERC721Mock` contract, facilitating operations involving ERC-721 tokens.

  - `exchange-rate-interactions/` folder: Within this directory, you'll find APIs tailored for interacting with the `ExchangeRatePrecompile` contract, enabling the DApp to access exchange rate-related data.

  - `hts-interactions/` folder: Contains APIs that interact with four distinct example contracts representing the HTS (Hedera Token Service) precompile contract. These include `TokenCreateCustomContract`, `TokenManagementContract`, `TokenQueryContract`, and `TokenTransferContract`.

  - `ihrc-interactions/` folder: This subdirectory hosts APIs designed for interaction with the `IHRC729Contract`, facilitating operations related to IHRC (Hedera Improvement Request) standards.

  - `prng-interactions/` folder: Within this directory, you'll find APIs dedicated to interacting with the `PrngSystemContract`, which plays a crucial role in generating pseudo-random numbers.

### b. Adding New System Contracts to the DApp

#### b1. Folder structure

When a new system contract is added to the DApp, main focus will shift to the `src/api/hedera/` folder. It is crucial to maintain a clear and structured folder organization. Each subdirectory within this folder should be allocated for a specific API category. Therefore, the incorporation of a new contract entails the creation of a dedicated folder to accommodate its related APIs.

#### b2. Writing New APIs for Smart Contract Interaction

When creating new APIs for smart contract interaction, it's important to adhere to certain guidelines and practices:

- **Documenting API Methods**: It's crucial to thoroughly document each API method. For instance:

```typescript
/**
 * @dev Mints Hedera tokens and transfers them to another address.
 *
 * @dev Integrates tokenCreateCustomContract.mintTokenToAddressPublic() & tokenCreateCustomContract.mintNonFungibleTokenToAddressPublic()
 *
 * @param baseContract: ethers.Contract
 *
 * @param tokenType: 'FUNGIBLE' | 'NON_FUNGIBLE'
 *
 * @param hederaTokenAddress: string
 *
 * @param recipientAddress: string
 *
 * @param amountToMint: number
 *
 * @param metadata: string[]
 *
 * @return Promise<ISmartContractExecutionResult>
 */
```

- **Standard First Argument**: Note that all APIs interacting with smart contracts have their first argument set as `baseContract: Contract`. This is because the design of client components ensures that the deployed contract is passed as `baseContract` for API methods.

- **Promise Return Type**: Most APIs interacting with smart contracts return a Promise compliant with the `ISmartContractExecutionResult` interface:

These practices ensure consistency, clarity, and reliability in the development and usage of smart contract interaction APIs.
