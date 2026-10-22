# State registry (migration tests)

Writes a wide range of value and reference types (`StateRegistry`) plus ERC-20, ERC-721 and ERC-1155 balances to a network, saves the expected values to `test/states.json` / `test/ercStates.json`, and compares them after a network upgrade. Run the `@pre-migration` suites before the upgrade and the `@post-migration` suites after it:

```bash
npx hardhat test --grep @pre-migration
# upgrade the network
npx hardhat test --grep @post-migration
```

## Run

```bash
npm ci
npx hardhat compile
npx @hashgraph/solo one-shot falcon deploy --dev
cp .env.example .env   # Solo defaults; use your own account and keys for other networks
```

Shared test helpers (SDK client, HTS token setup, mirror node polling, network config) come from [`examples/shared/test-helpers`](../../shared/test-helpers).
