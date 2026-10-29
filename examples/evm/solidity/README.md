# Solidity language equivalence

Small contracts that check Solidity language features behave on Hedera as on Ethereum: accounts and addresses, assignments, auctions, block and transaction properties, control structures, crypto math, encoding, errors, functions, inheritance, modifiers, payment channels, reentrancy, scoping, signatures, type operations, units, voting and contract creation with `new`.

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
