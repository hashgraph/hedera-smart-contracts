:warning: :bangbang: ***All examples and contracts in this repository are exploration code and have NOT been audited. Use them at your own risk!*** :bangbang: :warning:

# Hedera Smart Contracts Examples

Community examples for building smart contracts on Hedera with common Ethereum tooling. Every example is a
standalone project under [`examples/`](./examples) with its own dependencies and lockfile; there is no shared root
build and nothing in this repository is published.

The Hedera system contract library (`SafeHTS`, `SelfFunding`, the HTS/HAS/HSS/exchange rate/PRNG interfaces and
helper contracts) lives in [hiero-ledger/hiero-contracts](https://github.com/hiero-ledger/hiero-contracts) and is
published to npm as [`@hiero-ledger/hiero-contracts`](https://www.npmjs.com/package/@hiero-ledger/hiero-contracts).
Examples import it from npm, never from paths inside this repository.

## Examples

| Example | Stack | Network | CI |
| --- | --- | --- | --- |
| [frameworks/hardhat](examples/frameworks/hardhat) | Hardhat, ethers | Solo / testnet | build, tests on Solo |
| [frameworks/hardhat-viem](examples/frameworks/hardhat-viem) | Hardhat, viem | Solo / testnet / previewnet / mainnet | build, tests on Solo |
| [frameworks/foundry](examples/frameworks/foundry) | Foundry | none (unit tests) | build, tests |
| [frameworks/brownie](examples/frameworks/brownie) | Brownie (Python) | testnet | build (tests need an interactive brownie keystore) |
| [frameworks/solidity-coverage](examples/frameworks/solidity-coverage) | Hardhat, solidity-coverage | Hardhat network | build, coverage |
| [clients/go](examples/clients/go) | go-ethereum | Solo / testnet / previewnet / mainnet | build, tests on Solo |
| [clients/rust-alloy](examples/clients/rust-alloy) | Rust, alloy | Solo / testnet | build |
| [clients/wagmi](examples/clients/wagmi) | React, wagmi, viem | testnet / mainnet | build |
| [apps/metamask-dapp](examples/apps/metamask-dapp) | React, ethers, MetaMask, Hedera SDK | Solo | build, e2e (synpress) on Solo |
| [indexing/subgraph](examples/indexing/subgraph) | The Graph, Hardhat | Solo / testnet | build, tests on Solo |
| [indexing/erc-indexer](examples/indexing/erc-indexer) | TypeScript, Hedera SDK, mirror node | Solo / testnet / mainnet | build, unit tests, acceptance tests on Solo |
| [interoperability/layer-zero](examples/interoperability/layer-zero) | LayerZero v2, Hardhat | testnet + BSC testnet | build (tests need funded testnet + BSC testnet accounts) |
| [interoperability/crosschain-bridge](examples/interoperability/crosschain-bridge) | LayerZero v2, Hardhat | testnet + Sepolia | build (tests need funded testnet + Sepolia accounts) |
| [tokens/whbar](examples/tokens/whbar) | Hardhat, Hedera SDK | Solo / testnet / previewnet / mainnet | build, tests on Solo |
| [tokens/safe-hts](examples/tokens/safe-hts) | Hardhat, hiero-contracts (SafeHTS), Hedera SDK | Solo / testnet / previewnet | build, tests on Solo |
| [tokens/hip-583](examples/tokens/hip-583) | Hardhat, hiero-contracts, Hedera SDK | Solo / testnet / previewnet | build, tests on Solo |
| [tokens/hip-719-proxy](examples/tokens/hip-719-proxy) | Hardhat | none (reference contract) | build |
| [patterns/diamond](examples/patterns/diamond) | Hardhat | Solo / testnet / previewnet | build, tests on Solo |
| [patterns/multicall](examples/patterns/multicall) | Hardhat, Multicall3 | Solo / testnet / previewnet | build, tests on Solo |
| [patterns/upgradeable-proxies](examples/patterns/upgradeable-proxies) | Hardhat, OpenZeppelin upgrades, hiero-contracts | Solo / testnet / previewnet | build, tests on Solo |
| [standards/openzeppelin](examples/standards/openzeppelin) | Hardhat, OpenZeppelin | Solo / testnet / previewnet | build, tests on Solo |
| [evm/solidity](examples/evm/solidity) | Hardhat | Solo / testnet / previewnet | build, tests on Solo |
| [evm/yul](examples/evm/yul) | Hardhat, Yul | Solo / testnet / previewnet | build, tests on Solo |
| [evm/opcodes](examples/evm/opcodes) | Hardhat | Solo / testnet / previewnet | build, tests on Solo |
| [evm/precompiles](examples/evm/precompiles) | Hardhat | Solo / testnet / previewnet | build, tests on Solo |
| [cryptography/bls-signatures](examples/cryptography/bls-signatures) | Hardhat, mcl-wasm | Solo / testnet / previewnet | build, tests on Solo |
| [hedera/discrepancies](examples/hedera/discrepancies) | Hardhat, hiero-contracts, Hedera SDK | Solo / testnet / previewnet | build, tests on Solo |
| [hedera/state-registry](examples/hedera/state-registry) | Hardhat | Solo (before/after a network upgrade) | build, tests on Solo (pre/post state check, no upgrade) |
| [hedera/key-rotation](examples/hedera/key-rotation) | Hardhat, Hedera SDK | Solo / testnet / previewnet | build, tests on Solo |
| [hedera/contract-admin-id](examples/hedera/contract-admin-id) | Hardhat, Hedera SDK | Solo / testnet / previewnet | build, tests on Solo |
| [accounts/offchain-signing](examples/accounts/offchain-signing) | Hedera SDK, node-cron | testnet / mainnet | build |
| [testing/system-contract-mocks](examples/testing/system-contract-mocks) | Foundry, hiero-contracts | none (unit tests with mocked system contracts) | build, tests |

Hardhat examples that test against a Hedera network share their test helpers (Hedera SDK client, HTS token setup,
mirror node polling, network config) through [`examples/shared/test-helpers`](examples/shared/test-helpers).

## Running against a local network

Examples marked "Solo" run against a local [Solo](https://solo.hiero.org) network:

```shell
npx @hashgraph/solo one-shot falcon deploy --dev
```

Solo one-shot exposes the JSON-RPC relay on `http://127.0.0.1:37546`, the mirror node REST API on
`http://127.0.0.1:38081` and consensus node gRPC on `127.0.0.1:35211`. Point the example's `.env`
(`RELAY_ENDPOINT`, `HEDERA_NETWORK`, ...) at these endpoints; most examples ship an `.env.example` with these
defaults.

## CI

[`.github/workflows/examples.yml`](.github/workflows/examples.yml) builds each example and runs its tests. Commands
per example live in [`.github/examples.json`](.github/examples.json): `build` and `test` run offline, `solo_test`
runs against a fresh Solo network (a `{ "label": "command" }` map splits a long suite into parallel jobs).
Examples without runnable tests are build only and say why in `ci_note`. Pull requests only run the examples
they change, plus the examples that depend on a changed `examples/shared/` package (all of them when the CI setup
changes); pushes to `main` run everything.
The `Examples` job aggregates all results into one status check and the run summary lists what each example ran.

## Adding an example

1. Create `examples/<category>/<name>/` with its own `package.json` (or `go.mod`, `Cargo.toml`, ...), lockfile,
   `README.md` and `.env.example`.
2. Import library code from `@hiero-ledger/hiero-contracts`, never from paths inside this repository.
3. Add an entry to `.github/examples.json` and a row to the table above.

## Support

If you have a question on how to use the product, please see our
[support guide](https://github.com/hashgraph/.github/blob/main/SUPPORT.md).

## Contributing

Contributions are welcome. Please see the
[contributing guide](https://github.com/hashgraph/.github/blob/main/CONTRIBUTING.md)
to see how you can get involved. Commits must be signed off (`git commit --signoff`).

## Code of Conduct

This project is governed by the
[Contributor Covenant Code of Conduct](https://github.com/hashgraph/.github/blob/main/CODE_OF_CONDUCT.md). By
participating, you are expected to uphold this code of conduct. Please report unacceptable behavior
to [oss@hedera.com](mailto:oss@hedera.com).

## License

[Apache License 2.0](LICENSE)
