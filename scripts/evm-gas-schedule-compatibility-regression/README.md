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

## Use cases covered (PoC)
1. Deploying a new smart contract
2. Deploying a smart contract
3. Deploying a smart contract with a deterministic address
4. Deploying a smart contract using `CREATE2` with a deterministic address
5. Executing a delegate call
6. Erc20,721 token mechanics and calls

## Configuration
1. Create .env example file. You can copy .env.example file and set the rpc urls and private keys of the networks you are testing.

## Requirements
To run these scripts, you must have [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) installed.

**Note:** Node.js version `v22.14.0` is required.

### Install

```shell
$ npm install
```

### Test

```shell
$ npm run test -- --executors=Sepolia::EVM,Hedera::Testnet::EVM,Hedera::Testnet::SDK,Hedera::Testnet::Sdk-ethTx --operations=new-contract::deploy,erc20::transfer
```

To run your tests, you need to provide two options:
1. A comma-separated list of executors.
2. A comma-separated list of operations (currently, the PoC supports new-contract::deploy and erc20::transfer).

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

Run the script using your `NETWORK_ALIAS` as a command-line option. For example, if you named your network `MYNET`, run the tests like this:

```shell
npm run test -- --executors=MYNET::EVM --operations=new-contract::deploy,erc20::transfer
```

### Comparison with non-EVM Hedera client calls

Hedera supports submitting transactions via its gRPC interface using the Hedera SDK. This tool allows you to test and compare SDK-based transaction execution against other methods.

To enable SDK-based comparisons, additional executors have been added specifically for interacting with Hedera via the SDK.

#### Hedera SDK executors setup

To use these SDK-based executors, you’ll need to define the following environment variable in your .env file:
```
HEDERA_{NETWORK}_ACCOUNT_ID
```
Replace {NETWORK} with the Hedera network you’re testing against. Available options:

```
HEDERA_TESTNET_ACCOUNT_ID=
HEDERA_PREVIEWNET_ACCOUNT_ID=
HEDERA_MAINNET_ACCOUNT_ID=
HEDERA_CUSTOM_ACCOUNT_ID=
```
This variable should contain your operator account ID, which is required to initialize the Hedera SDK client.

If you’re testing against a custom network, you also need to set the following variables:
```
HEDERA_CUSTOM_GRPC_URL=
```

The address and port of your consensus node, e.g., 127.0.0.1:50211.

```
HEDERA_CUSTOM_NODE_ACCOUNT=
```
The account ID of the node you want to connect to (defaults to 0.0.3 if not specified).

```
HEDERA_CUSTOM_MIRRORNODE_URL=
```
The URL of the mirror node for your custom Hedera network.

#### Available Executors

1. **SDK**: Uses ContractCreate and ContractCall to submit transactions via the Hedera SDK. Example:
 ```shell
  npm run test -- --executors=Hedera::Testnet::SDK --operations=new-contract::deploy,erc20::transfer
 ```
2. **SDK-EthTx**: Sends raw Ethereum-style transaction data using the SDK. Example:
 ```shell
  npm run test -- --executors=Hedera::Testnet::SDK-EthTx --operations=new-contract::deploy,erc20::transfer
 ```
