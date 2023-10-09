# Source Code Documentation

## Codebase Walkthrough - **src/components/contract-interactions/** Folder

### a. Overview

The **src/components/contract-interactions/** folder plays a crucial role in hosting various UI components that facilitate user interactions with Hedera's system contracts. This folder is meticulously structured, with each subdirectory representing a group of related smart contracts. The subdirectory names correspond to the names of the smart contracts they represent. Within each of these subdirectories, a `methods/` folder exists, which, in turn, hosts further sub-folders representing the methods of the smart contracts. This structure is designed to align with the APIs offered in the corresponding smart contracts found in the `src/api/` folder. In some cases, closely related APIs are grouped within a single method component.

Here is a detailed breakdown of the **src/components/contract-interactions/** subdirectories:

- `erc` folder: This directory contains contract interaction UI components related to Ethereum-specific contracts (e.g., erc-20 or erc721). Since `erc` smart contracts require specific arguments for deployment, you'll find a `deployment/` folder here. The `deployment/` folder includes a UI component that simplifies the process of deploying `erc` contracts by allowing users to easily fill in the required arguments, such as `name` and `symbol`. In other smart contract folders (e.g., `erc-20/`, `erc-721/`), you'll encounter a `methods/` subdirectory housing various UI components designed to assist users in interacting with the corresponding contracts.

- `exchange-rate/` folder: This directory contains contract interaction UI components for users to interact with the `ExchangeRatePrecompile` contract.

- `hts/` folder: Within this directory, you'll find contract interaction UI components designed for user interactions with smart contracts related to the `Hedera Token Service` precompiled contract. The `shared/` subfolder contains common components, methods, and states shared among the contract interaction UI components in the `hts/` folder. The remaining subfolders correspond to specific system contracts related to the `Hedera Token Service`. There are four of them: `TokenCreateCustomContract`, `TokenManagementContract`, `TokenQueryContract`, and `TokenTransferContract`, mirroring the structure of the `token-create-custom`, `token-management-contract`, `token-query-contract`, and `token-transfer-contract` folders. Within these subfolders, you'll find a `methods/` subdirectory housing various API methods corresponding to each system contract.

- `ihrc/` folder: This directory contains contract interaction UI components for users to interact with the `IHRC729Contract` contract.

- `prng/` folder: This directory contains contract interaction UI components for users to interact with the `PrngSystemContract` contract.

### b. Adding New System Contracts to the DApp

#### b1. Folder structure

When a new system contract is added to the DApp, it is crucial to maintain a clear and structured folder organization. Each subdirectory within this folder should be allocated for a specific system contract category. Therefore, the incorporation of a new contract entails the creation of a dedicated `contract` folder to accommodate its related contracts and methods.

#### b2. deployment Folder (Optional)

The deployment folder is an optional component, as some system contracts may not require arguments during deployment. If needed, you can create a sub-folder named `deployment/` within the respective `contract` folder to contain the deployment logic for the smart contract. You can refer to the [ERC20DeployField](../../../../../../../../src/components/contract-interaction/erc/deployment/ERCDeployField.tsx) as a reference when structuring this folder.

#### b3. Methods Folder

In the methods folder, each method API should have its dedicated folder. As different method APIs require different arguments, the UI layout may vary accordingly. However, all method UI components share common components, hooks, and methods.

For instance, let's focus on the [FungibleTokenCreate](../../../../../../../../src/components/contract-interaction/hts/token-create-custom/methods/FungibleTokenCreate/index.tsx) UI component from the `token-create-custom/` contract folder.

##### PageProps

All method UI components share a common `PageProps` interface, which includes the `baseContract: Contract` property. This `baseContract` is passed in from the parent component and represents the deployed contract on the network.

```typescript
interface PageProps {
  baseContract: Contract;
}

const FungibleTokenCreate = ({ baseContract }: PageProps) => {
    ...
}
```

##### Generating States

In each UI component, the first step is to generate states where you define all the necessary states for the component and method.

##### handleRetrievingTransactionResultsFromLocalStorage Helper Method

Next, you may encounter the usage of the `handleRetrievingTransactionResultsFromLocalStorage` helper method.

```typescript
/** @dev retrieve token creation results from localStorage to maintain data on re-renders */
useEffect(() => {
handleRetrievingTransactionResultsFromLocalStorage(
    toaster,
    transactionResultStorageKey,
    setCurrentTransactionPage,
    setTransactionResults
);
```

This method retrieves the list of transactions from `localStorage` and stores them in the component's current state, displaying them to users. Storing transactions in `localStorage` helps maintain data on re-renders.

#### usePaginatedTxResults Custom Hook

Right below, you'll find a custom hook called `usePaginatedTxResults`.

```typescript
// declare a paginatedTransactionResults
const paginatedTransactionResults = usePaginatedTxResults(currentTransactionPage, transactionResultsToShow);
```

This hook automatically slices the main `transactionResults` list into smaller chunks (typically 10 records) and displays it in a paginated style. It updates itself when users click on the next or previous page buttons.

#### handleInputOnChange Function

```typescript
/** @dev handle form inputs on change */
const handleInputOnChange = (e: any, param: string) => {
  setParamValues((prev: any) => ({ ...prev, [param]: e.target.value }));
};
```

This function simply updates form states when users input data.

#### handleCreatingFungibleToken Function

This is the main function acting as a bridge to transfer user-input data to the backend API method, which communicates with the deployed contracts on the network. Due to variations in method APIs, this function differs from one method API to another.

#### useUpdateTransactionResultsToLocalStorage Custom Hook

```typescript
/** @dev listen to change event on transactionResults state => load to localStorage  */
useUpdateTransactionResultsToLocalStorage(transactionResults, transactionResultStorageKey);
```

This hook automatically updates the `transactionResults` list in `localStorage` by listening to changes in the `transactionResults` state.

#### useToastSuccessful Custom Hook

You'll also find the `useToastSuccessful` custom hook, which displays a success message via a toast and resets all states if a transaction is successful.

#### Return Statement

Finally, within the return statement, you'll find the main UI component that showcases the entire layout of the method API. The layout may vary from one method API to another due to the diversity of method APIs.
