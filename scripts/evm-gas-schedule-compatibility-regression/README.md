## EVM gas schedule compatibility regression

This project ensures that smart contract interactions on Hedera mimic Ethereum-like gas mechanics, allowing reliable cross-chain testing.

## Project Goal

To verify that smart contract execution on Hedera (via EVM-compatible relay or SDK) consumes equivalent gas to that on Ethereum-compatible chains (starting with Sepolia), aside from known protocol-specific differences. This project allows to compare any network gas usages, not only the Hedera and Sepolia.

## Features

1. Compare gas usage between any (at least two) networks. Let it be Hedera and Ethereum (Sepolia).
2. Highlight differences in gas usage.
3. Execute test suite using Forge.
4. Full console output for transparency.
5. Easily extendable to other networks.

## Use cases covered
1. Deploying a new smart contract
2. Deploying a smart contract
3. Deploying a smart contract via a factory
4. Deploying a smart contract via a factory using `CREATE2` and checking the deterministic address
5. Executing a delegate call
6. Erc20,721 token mechanics and calls

## Configuration
1. Create .env example file. You can copy .env.example file and set the rpc urls and private keys of the networks you are testing.

## Requirements
To run these scripts, you must have [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed.

**Note:** Node.js version `v22.15.0` is required.

### Install

```shell
$ npm install
```

### Test

```shell
$ npm run test --executors=Sepolia::EVM,Hedera::Testnet::EVM,Hedera::Testnet::SDK,Hedera::Testnet::Sdk-ethTx
```

To run your tests, you need to provide two options:
1. A comma-separated list of executors.
2. A comma-separated list of operations. All tests will be executed by default if this option is omitted. Currently supported operations:

   | Operation                                  | Name                     | Description                                                                 |
   | ------------------------------------------ |--------------------------|-----------------------------------------------------------------------------|
   | `new-contract::deploy`                     | Deploy New Contract      | Deploys a standard smart contract using the default creation opcode.        |
   | `create-via-factory-deterministic::deploy` | Deploy with CREATE2      | Deploys a contract with `CREATE2` for deterministic addressing.             |
   | `create-via-factory::deploy`               | Factory Deployment       | Deploys a contract via a factory.                                           |
   | `delegate::call`                           | Delegate Call            | Executes a `DELEGATECALL` to another contract for shared context execution. |
   | `erc20::deploy`                            | Deploy ERC20 Token       | Deploys a standard ERC20 token contract.                                    |
   | `erc20::mint`                              | Mint ERC20 Tokens        | Mints new tokens to an account associated with the provided private key.    |
   | `erc20::burn`                              | Burn ERC20 Tokens        | Destroys some amount of tokens from an account.                             |
   | `erc20::transfer`                          | Transfer ERC20 Tokens    | Transfers tokens from the caller to a random account.                       |
   | `erc20::approve`                           | Approve ERC20 Allowance  | Approves a spender to use tokens on behalf of the owner.                    |
   | `erc20::transferFrom`                      | Transfer From (ERC20)    | Transfers tokens using the transfer from method.                            |
   | `erc721::deploy`                           | Deploy ERC721 Token      | Deploys a standard ERC721 (NFT) contract.                                   |
   | `erc721::mint`                             | Mint ERC721 Token        | Mints a new NFT to a caller address.                                        |
   | `erc721::burn`                             | Burn ERC721 Token        | Destroys an NFT token.                                                      |
   | `erc721::approve`                          | Approve ERC721 Token     | Grants approval to a random address for a single NFT.                       |
   | `erc721::setApprovalForAll`                | Approve All (ERC721)     | Authorizes operator approval for all tokens owned by a user.                |
   | `erc721::transferFrom`                     | Transfer ERC721 Token    | Transfers an NFT from one account to another.                               |
   | `erc721::safeTransferFrom`                 | Safe Transfer (ERC721)   | Securely transfers an NFT, checking the recipient can handle it.            |

Use the example above if you’re using the default configuration (i.e., if you’ve copied .env.example to your .env file).

### Adding a new EVM network for comparison

To test against a new network:

1. Set up the necessary environment variables for the new network. Use the alias as a prefix:
    - `${NETWORK_ALIAS}_RPC_URL`
    - `${NETWORK_ALIAS}_PRIVATE_KEY`

   For the example above (`Previewnet`), you'd add:
   ```env
   PREVIEWNET_RPC_URL=https://your.rpc.url
   PREVIEWNET_PRIVATE_KEY=0x{YourPrivateKey}
   ```

> ✅ Make sure the private key is prefixed with `0x`. Only ECDSA keys are supported.

> ⚠️ **Warning:** All tests require transactions to be mined, which means the private key you provide must belong to an account with sufficient funds. Transaction fees will be paid by this account. To avoid unintended costs, **always use a test networks** to run this script unless you are absolutely sure you want to cover all expenses on the main networks.

Run the script using your `NETWORK_ALIAS` as a command-line option. For example, if you named your network `MYNET`, run the tests like this:

```shell
$ npm run test --executors=MYNET::EVM
```

### Comparison with non-EVM Hedera client calls

Hedera supports submitting transactions via its gRPC interface using the Hedera SDK. This tool allows you to test and compare SDK-based transaction execution against other methods.

To enable SDK-based comparisons, additional executors have been added specifically for interacting with Hedera via the SDK.

#### Hedera SDK executors setup

To use these SDK-based executors, you’ll need to define the following environment variable in your .env file:
```env
HEDERA_{NETWORK}_ACCOUNT_ID=
```
Replace {NETWORK} with the Hedera network you’re testing against. Available options:

```env
HEDERA_TESTNET_ACCOUNT_ID=
HEDERA_PREVIEWNET_ACCOUNT_ID=
HEDERA_MAINNET_ACCOUNT_ID=
HEDERA_CUSTOM_ACCOUNT_ID=
```
This variable should contain your operator account ID, which is required to initialize the Hedera SDK client.

Additionally, `HEDERA_{NETWORK}_PRIVATE_KEY` must be set (ensure that you use the correct Hedera ECDSA private key).
To run the `SDK-ETHTX` executor tests, the JSON-RPC URL must also be set in the `HEDERA_{NETWORK}_RPC_URL` variable.

> ✅ Make sure the private key is prefixed with `0x`. Only ECDSA keys are supported.

> ⚠️ **Warning:** All tests require transactions to be mined, which means the private key you provide must belong to an account with sufficient funds. Transaction fees will be paid by this account. To avoid unintended costs, **always use a test networks** to run this script unless you are absolutely sure you want to cover all expenses on the main networks.

If you’re testing against a custom network, you also need to set the following variables:
```env
HEDERA_CUSTOM_GRPC_URL=
```

The address and port of your consensus node, e.g., 127.0.0.1:50211.

```env
HEDERA_CUSTOM_MIRRORNODE_URL=
```
The URL of the mirror node for your custom Hedera network, e.g., http://127.0.0.1:5551/api/v1

```env
HEDERA_CUSTOM_NODE_ACCOUNT=
```
The account ID of the node you want to connect to (defaults to 0.0.3 if not specified).


> **Note:**  
> To run tests against your local node, make sure to use one of the keys listed in the **Accounts List (Alias ECDSA Keys)** section.
> This section is displayed when you start the [Hedera local node](https://github.com/hiero-ledger/hiero-local-node) using the `hedera start` script.


#### Available Executors

1. **SDK**: Uses ContractCreate and ContractCall to submit transactions via the Hedera SDK. Example:
   ```shell
   $ npm run test --executors=Hedera::Testnet::SDK
   ```
2. **SDK-EthTx**: Sends raw Ethereum-style transaction data using the SDK. Example:
   ```shell
   $ npm run test --executors=Hedera::Testnet::SDK-EthTx
   ```

## Tolerance thresholds

The tolerances determine the maximum permissible differences between executor outputs, beyond which tests will fail.

### Threshold definitions

To configure tolerance thresholds, define environment variables with the naming convention:

```env
TOLERANCE_{EXECUTOR_1}_{EXECUTOR_2}
```

Where `{EXECUTOR_1}` and `{EXECUTOR_2}` follow the format:

```env
{NETWORK}_{TYPE}
```

* `{NETWORK}`: Name of the network (e.g., `SEPOLIA`, `HEDERA_TESTNET`, `HEDERA_MAINNET`).
* `{TYPE}`: Executor type (`EVM`, `SDK`, `SDK-ETHTX`). Note: `SDK` and `SDK-ETHTX` types are supported for the Hedera network only.

### Examples

* **`TOLERANCE_SEPOLIA_EVM_HEDERA_TESTNET_EVM`** *(Default: 90)*
  Acceptable output difference between Sepolia EVM executor and Hedera Testnet EVM executor.

* **`TOLERANCE_HEDERA_TESTNET_SDK_HEDERA_TESTNET_EVM`** *(Default: 30)*
  Acceptable output difference between Hedera Testnet SDK executor and Hedera Testnet EVM executor.

### Usage

Set these thresholds as environment variables before running tests to customize your acceptance criteria (or update the values stored in the `.env` file):

```shell
export TOLERANCE_SEPOLIA_EVM_HEDERA_TESTNET_EVM=90
export TOLERANCE_SEPOLIA_EVM_HEDERA_TESTNET_SDK=90
# ...other tolerances
```

Adjust these values according to your testing accuracy and precision requirements.
