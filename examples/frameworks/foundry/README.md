## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

This directory provides an example of how Hedera developers can utilize foundry in their development process against the Hedera test (remote & local) networks

## Documentation

https://book.getfoundry.sh/

## Dependencies

Dependencies are installed from npm instead of git submodules:

- `@hiero-ledger/hiero-contracts` — Hedera system contract library (`SafeHTS`, `SelfFunding`, interfaces)
- `@openzeppelin/contracts`
- `forge-std`

```shell
npm install
```

`remappings.txt` maps these imports to `node_modules`. See `src/SimpleVault.sol` for a contract that builds on `SafeHTS` and `SelfFunding` from `@hiero-ledger/hiero-contracts`. To unit test such a contract without a network, see [testing/system-contract-mocks](../../testing/system-contract-mocks), which runs `SimpleVault` against mocked system contracts.

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
