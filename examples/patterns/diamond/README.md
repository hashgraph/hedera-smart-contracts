# Diamond pattern (EIP-2535)

A multi-facet proxy following [EIP-2535](https://eips.ethereum.org/EIPS/eip-2535): `Diamond`, `DiamondCutFacet`, `DiamondLoupeFacet`, `OwnershipFacet` and two test facets. The tests add, replace and remove facets and call through the diamond.

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
