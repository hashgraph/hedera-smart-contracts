# OpenZeppelin standards

OpenZeppelin contracts deployed and exercised on Hedera: ERC-20 (and extensions, votes, ERC-2612 permit, ERC-4626 vault), ERC-721 (and receiver), ERC-1155, ERC-165, ERC-777 with the ERC-1820 registry, ERC-2771 meta transactions, ERC-2981 royalties, access control, ownable, pausable, multicall, create2, safe cast, vesting wallet and governor.

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
