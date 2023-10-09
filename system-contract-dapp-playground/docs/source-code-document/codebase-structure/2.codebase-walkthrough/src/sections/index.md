# Source Code Documentation

## Codebase Walkthrough - **src/sections/** Folder

### a. Overview

The **src/sections/** folder serves as an organizational hub for a series of subdirectories, each housing `section-level` files. These `section-level` components are integral parts of the main UI components specified in the `page.tsx` files located in the `src/app/` subdirectories.

Here is a breakdown of the **src/sections/** subdirectories:

- `activity/` folder: This folder contains the `ActivitySection` UI component, responsible for showcasing the main activity page of the DApp. It aggregates all transactions conducted during the session and presents them to users.

- `erc-20/` folder: In this directory, you'll find the `ERC20Section` UI component, which provides essential information about the `ERC20Mock` contract. Additionally, it features a user interface for interacting with the `ERC20Mock` smart contract.

- `erc-721/` folder: This directory houses the `ERC721Section` UI component, which presents vital information about the `ERC721Mock` contract. It also offers a user-friendly interface for interacting with the `ERC20Mock` smart contract.

- `exchange-rate-hip-475/` folder: Within this folder, you'll encounter the `HIP475Section` UI component, designed to display crucial details about the `ExchangeRatePrecompile` contract. It also includes an interface for interacting with the `ExchangeRatePrecompile` smart contract.

- `hrc-719/` folder: This directory hosts the `IHRC719Section` UI component, which provides essential information about the `IHRC729Contract` contract. It features a user interface for interacting with the `IHRC729Contract` smart contract.

- `hts-hip-206/` folder: Found within this directory is the `HTS206Section` UI component, responsible for displaying essential information about the four example contracts: `TokenCreateCustomContract`, `TokenManagementContract`, `TokenQueryContract`, and `TokenTransferContract`. It also includes an interface for interacting with these smart contracts.

- `landing/` folder: This folder contains the `landing` UI component, responsible for displaying the landing page of the DApp.

- `overview/` folder: Within this directory resides the `OverviewSection` UI component, which is responsible for displaying the landing page of the DApp after users have connected their wallets.

- `prng-hip-351/` folder: This directory houses the `HIP351Section` UI component, which offers vital information about the `PrngSystemContract` contract. Additionally, it includes an interface for interacting with the `PrngSystemContract` smart contract.

These `section-level` components are crucial elements of the DApp's user interface, providing users with access to various functionalities and information related to smart contracts and DApp activities.

### b. Adding New System Contracts to the DApp

#### b1. Folder Structure

When introducing new system contracts to the DApp, adhering to a well-organized folder structure is of utmost importance. Each subdirectory within this folder should be allocated for a specific contract section. Consequently, incorporating a new contract entails the creation of a dedicated folder to house all related components and assets.

#### b2. Page Structure

In line with established conventions, new contract page should exhibit the following elements:

- **Contract Title**: Display the title of the contract.
- **HIP Link**: If applicable, provide a link to the corresponding `HIP` (Hedera Improvement Proposal).
- **Overview**: Offer a concise overview of the contract's purpose and functionality.
- **GitHub Link**: Include a link to the contract's repository on GitHub.
- **ContractInteraction Component**: All contract pages share a common `ContractInteraction` component, which is crucial for evaluating the contract and dynamically generating the layout based on the contract's methods and APIs. For instance:

```typescript
<ContractInteraction contract={HEDERA_SMART_CONTRACTS_ASSETS.ERC_721} />
```

This component plays a pivotal role in interacting with the contract, providing users with access to its functionalities and features.

Maintaining this consistent page structure ensures clarity and usability for users navigating the DApp and engaging with various system contracts.
