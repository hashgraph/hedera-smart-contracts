# Source code documentation

## Codebase Walkthrough - **prerequisite-check** folder

### a. Overview

Within the DApp, several smart contracts sourced from the primary `hashgraph/hedera-smart-contracts` repository are utilized. The DApp primarily depends on the presence of smart contract metadata to access bytecode for deployment and ABI for decoding information. Hence, it is crucial to ensure that the requisite smart contracts are accessible within the root folder.

Here is a breakdown of the **prerequisite-check** folder:

- `contracts-info/` folder: Within this directory, you will find a simple function called `getHederaSmartContractAssets`. Its purpose is to accept the `HederaSmartContractsRootPath` variable as input and subsequently return an object containing all the essential `contract assets` information necessary to validate the presence of the required contracts.

- `scripts/` folder: Inside this directory, there is a self-executing function responsible for executing the validity-check logic for the smart contracts. Its primary objective is to confirm the availability of both the contract and artifact files at their designated locations.

### b. Adding New System Contracts to the DApp

#### b1. Contract Assets

When adding new system contracts to the DApp, the first crucial step is to include the corresponding `contract assets` object within the returned value of the `getHederaSmartContractAssets` function. You can find this function in the [contracts-info/index.ts](../../../../../../prerequisite-check/contracts-info/index.ts) file.

For example, consider a `contract assets` object corresponding to `TokenCreateCustomContract`, structured as follows:

```typescript
{
  name: 'TokenCreateCustomContract',
  contractPath: `${HederaSmartContractsRootPath}/contracts/hts-precompile/examples/token-create/TokenCreateCustom.sol`,
  artifactPath: `${HederaSmartContractsRootPath}/artifacts/contracts/hts-precompile/examples/token-create/TokenCreateCustom.sol/TokenCreateCustomContract.json`,
}
```

In this context, `name` signifies the contract's name, `contractPath` indicates the precise path to the contract's location, and `artifactPath` points to the exact path where the contract's metadata file is stored.

#### b2. Prerequisite-Check Script

Within the script, a minor modification is required in the `contractNames` array. Simply include the new `name` from the `contract assets` object mentioned in step **b1. Contract Assets** to the `contractNames` array. The script is specifically designed to evaluate contract assets using their contract names, offering a highly convenient approach.
