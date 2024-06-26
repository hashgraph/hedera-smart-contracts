# `sevm` Precompiles Detection Analysis

`sevm` is a Symbolic Ethereum Virtual Machine (EVM) bytecode interpreter, parser and decompiler, along with several other utils for programmatically extracting information from EVM bytecode.
In particular, it provides [Hooks](https://github.com/acuarica/evm?tab=readme-ov-file#advanced-usage) that allows the user to intercept when each bytecode is symbolically executed.

## Scripts

### [`fetch.js`](./fetch.js)

It uses the [Mirror Node API](https://testnet.mirrornode.hedera.com/api/v1/docs/) to fetch contracts from the `testnet` network.

The fetched contracts are stored in the `.testnet` folder.
Please note that these contracts are not stored by address.
Instead, they are stored using the bytecode `keccak256` hash as file name.
This is to avoid storing and analyzing duplicated contracts.

It creates a SQLite database `testnet.sqlite` to keep track of which contract addresses were fetched.
This is two-fold.
On the one hand, it is used to avoid re-downloading already downloaded contracts.
On the other hand, it maps contract addresses to bytecode in the filesystem.

### [`analyze.js`](./analyze.js)

This script traverses the fetched contracts in the `.testnet` folder and tries to find the calls (`CALL`, `STATICCALL` and `DELEGATECALL`) to addresses whose value can be determine at compile-time.
For this step, it uses `sevm` to parse and symbolically execute the contract bytecode.
