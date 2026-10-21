# Upgradeable proxies

OpenZeppelin proxy patterns on Hedera:

- `proxy-upgrade`: a DEX (`Exchange` → `ExchangeV2`) that holds an HTS token, and a `Counter` upgraded with `@openzeppelin/hardhat-upgrades`
- `transparent-upgradeable-proxy`: `Box` → `BoxV2` behind a custom `TransparentUpgradeableProxy`
- `uups-upgradable`: `VaultV1` → `VaultV2` (UUPS)
- `beacon-proxy`: `LogicContractV1` → `LogicContractV2` behind a beacon
- `ERC-1967-Upgrade`: `VoteV1` → `VoteV2` through an ERC-1967 proxy

System contract library code is imported from [`@hiero-ledger/hiero-contracts`](https://www.npmjs.com/package/@hiero-ledger/hiero-contracts).

## Run

```bash
npm ci
npx hardhat compile
```

The tests run against a Hedera network. Start a local [Solo](https://solo.hiero.org) network and run them:

```bash
npx @hashgraph/solo one-shot falcon deploy --dev
cp .env.example .env   # Solo defaults; use your own account and keys for testnet/previewnet
npx hardhat test --grep Proxy          # --network testnet|previewnet for public networks
```

Shared test helpers (SDK client, HTS token setup, mirror node polling, network config) come from [`examples/shared/test-helpers`](../../shared/test-helpers).
