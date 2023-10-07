# Source Code Documentation

## Codebase Walkthrough - **src/hooks/** Folder

The **src/hooks/** subdirectory hosts a series of custom hooks, each designed to "hook into" React's state and lifecycle mechanisms, enhancing the functionality and reusability of function components.

Here is a breakdown of the **src/hooks/** subdirectories:

- `useFilterTransactionsByContractAddress.tsx`: This file houses the `useFilterTransactionsByContractAddress` hook, which finds widespread use in all of the `contract-interaction` files. Its primary purpose is to filter transactions based on whether they match the `.sessionedContractAddress` attribute with the current `deployed contract address`.

- `usePaginatedTxResults.tsx`: Within this file resides the `usePaginatedTxResults` hook, another essential component shared among the `contract-interaction` files. This hook is responsible for dividing the main `transactionResults` array into smaller pages, determined by the specified page size.

- `useToastSuccessful.tsx`: The `useToastSuccessful` hook is found in this file and is employed extensively across the `contract-interaction` files. Its primary function is to display a toast notification, informing users of successful transaction processing. Additionally, it resets all relevant states utilized during the process.

- `useUpdateLocalStorage.tsx`: In this file, you'll find the `useUpdateLocalStorage` hook, which is utilized in all of the `contract-interaction` files. Its primary role is to update the local storage with the newly received responses from smart contract interactions, ensuring data consistency across re-renders.
