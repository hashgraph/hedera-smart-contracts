# BLS signatures

On-chain BLS signature verification:

- `bls-signature`: BLS over BN254 with the `Pairing` library (`BLSTest`)
- `bls-bn254-signatures`: single and aggregated signatures verified by `BlsBn254`, with keys and signatures generated off-chain by [`mcl-wasm`](https://www.npmjs.com/package/mcl-wasm) (see [test/bls-bn254-signatures/README.md](test/bls-bn254-signatures/README.md))

## Run

```bash
npm ci
npx hardhat compile
```

The tests run against a Hedera network. Start a local [Solo](https://solo.hiero.org) network and run them:

```bash
npx @hashgraph/solo one-shot falcon deploy --dev
cp .env.example .env   # Solo defaults; use your own account and keys for testnet/previewnet
npx hardhat test --grep BLS          # --network testnet|previewnet for public networks
```

Shared test helpers (SDK client, HTS token setup, mirror node polling, network config) come from [`examples/shared/test-helpers`](../../shared/test-helpers).
