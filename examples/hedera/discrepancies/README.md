# Nonce discrepancies

Documents when Hedera updates an account's nonce and where it differs from Ethereum: transactions rejected by pre-checks, EVM reverts, internal calls, transfers and deployments, ERC-20/721 calls through HTS, Ethereum precompile calls, CREATE2 failures, account deletion and re-creation, hollow account finalization and each transaction type (0, 1, 2).

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
