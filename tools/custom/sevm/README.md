# `sevm` Precompiles Detection Analysis

`sevm` is a Symbolic Ethereum Virtual Machine (EVM) bytecode interpreter, parser and decompiler, along with several other utils for programmatically extracting information from EVM bytecode.
In particular, it provides [Hooks](https://github.com/acuarica/evm?tab=readme-ov-file#advanced-usage) that allows the user to intercept when each bytecode is symbolically executed.

## Scripts

### [`fetch.js`](./fetch.js)

To fetch contracts simply execute

```sh
./fetch.js
```

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

To run the analysis execute

```sh
./analyze.js
```

This script traverses the fetched contracts in the `.testnet` folder and tries to find the calls (`CALL`, `STATICCALL` and `DELEGATECALL`) to addresses whose value can be determine at compile-time.
For this step, it uses `sevm` to parse and symbolically execute the contract bytecode.

The output should look like this (your mileage may vary)

```console
[..]
0x167 .testnet/4b/0x4b601e[..]4b6507.bytecode call(gasleft(),0x167,local39,local41 + local8,memory[local41],local39,local39)
0x167 .testnet/4b/0x4b601e[..]4b6507.bytecode call(gasleft(),0x167,local39,local41 + local8,memory[local41],local39,local39)
0x167 .testnet/93/0x937dc4[..]2f7f8b.bytecode call(gasleft(),0x167,local46,local41 + 0x20,memory[local41],local46,local46)
0x167 .testnet/93/0x937dc4[..]2f7f8b.bytecode call(gasleft(),0x167,local47,local42 + 0x20,memory[local42],local47,local47)
[..]
```

The output format is the following

```console
<contract address> <precompile address> <bytecode path> <call/staticcall/deletegatecall where precompile address is used>
```
