# SafeHTS

Calls the Hedera Token Service through the `SafeHTS` library, which reverts on any non-success response code instead of returning it. The tests deploy `SafeOperations` / `SafeViewOperations` from `@hiero-ledger/hiero-contracts` and create, mint, associate, grant KYC and transfer fungible and non-fungible tokens through them.

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
npx hardhat test          # --network testnet|previewnet for public networks
```

Shared test helpers (SDK client, HTS token setup, mirror node polling, network config) come from [`examples/shared/test-helpers`](../../shared/test-helpers).
