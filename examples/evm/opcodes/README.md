# Shanghai and Cancun opcodes

Opcodes introduced by recent Ethereum upgrades on Hedera:

- Shanghai: `PUSH0` and related changes (`ShanghaiOpcodes`)
- Cancun: transient storage (`TSTORE`/`TLOAD`), `MCOPY` (`CancunOpcodes`) and the KZG point evaluation precompile (`KZGPointEvaluation`)

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
