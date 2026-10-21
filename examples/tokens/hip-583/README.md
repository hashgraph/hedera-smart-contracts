# HIP-583: alias support in CryptoCreate and CryptoTransfer

Shows [HIP-583](https://hips.hedera.com/hip/hip-583) auto-creation of hollow accounts: HBAR, fungible and non-fungible tokens are sent to an EVM address that has no Hedera account yet, both from an EOA (`ContractTransferTx`, ERC-20/721 facades) and through the HTS system contract. The hollow account is then completed by sending a transaction from it.

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
