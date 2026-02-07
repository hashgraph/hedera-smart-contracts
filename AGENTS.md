# AGENTS.md

This file is a working guide for AI agents contributing to `hedera-smart-contracts`, with a focus on building CLPR middleware contracts incrementally.

## 1) Mission and scope

- This repository is a reference library of Hedera/Hiero smart contracts and tests.
- For CLPR work here, preserve existing repository style and placement patterns.
- Build in small, testable increments. Prefer one flow at a time over broad scaffolding.

## 2) Repository structure to preserve

Use existing top-level folders; do not introduce new top-level trees for CLPR.

- Contracts:
  - `contracts/solidity/<feature>/...` for Solidity language/equivalence-style examples.
  - `contracts/system-contracts/...` for Hedera system contract interfaces/examples.
  - `contracts/openzeppelin/...` for OZ-aligned examples.
- Tests:
  - `test/solidity/<feature>/...` mirrors `contracts/solidity/<feature>/...`.
  - Other test categories mirror their contract area (`test/openzeppelin`, `test/system-contracts`, etc.).
- Scripts:
  - `scripts/*.js` for deployment/invocation helpers.
- Config and shared constants:
  - `hardhat.config.js`
  - `utils/constants.js`
  - `test/constants.js`

Recommended CLPR placement (repo-style consistent):

- `contracts/solidity/clpr/...`
- `test/solidity/clpr/...`
- Optional helper scripts in `scripts/` (for deploy/invoke smoke checks).

Current IT0 split (use this as baseline for future CLPR iterations):

- `contracts/solidity/clpr/types/` shared envelopes and value types
- `contracts/solidity/clpr/interfaces/` public API contracts for middleware/apps/queue
- `contracts/solidity/clpr/middleware/` middleware implementations
- `contracts/solidity/clpr/mocks/` test doubles and local queue mocks
- `contracts/solidity/clpr/apps/` reference application implementations

## 3) Code style and contribution guardrails

- Keep SPDX header in Solidity/JS files:
  - `// SPDX-License-Identifier: Apache-2.0`
- Respect the maintainer’s Git workflow:
  - Do not create commits unless explicitly requested.
  - Do not move files between unstaged/staged states unless explicitly requested.
  - Leave code changes unstaged by default so the maintainer can review/stage via GUI.
- Keep both test stacks in mind:
  - Hardhat + Mocha/Chai for JS integration/smoke coverage.
  - Forge for Solidity unit testing (`test/foundry`).
- Keep folder mirroring: contract folder and test folder names should match.
- Prefer minimal diffs; avoid renaming/moving unrelated files.
- If tests rely on shared contract name constants, update `test/constants.js`.
- Do not modify generated `artifacts/` manually.

## 4) CLPR specification source of truth

Primary spec source is PR `hiero-ledger/hiero-consensus-node#23333`:

- PR: `https://github.com/hiero-ledger/hiero-consensus-node/pull/23333`
- CLPR doc root in that PR: `hedera-node/docs/clpr/`

Read in this order before changing CLPR contracts:

1. `hedera-node/docs/clpr/README.md`
2. `hedera-node/docs/clpr/status.md`
3. `hedera-node/docs/clpr/implementation/iteration-plan.md`
4. `hedera-node/docs/clpr/requirements/middleware-apis-and-semantics.md`
5. `hedera-node/docs/clpr/requirements/messaging-message-formats.md`
6. `hedera-node/docs/clpr/requirements/messaging-queue-and-bundles.md`
7. `hedera-node/docs/clpr/requirements/applications-interop-contract.md`
8. `hedera-node/docs/clpr/requirements/connectors-economics-and-behavior.md`
9. `hedera-node/docs/clpr/requirements/traceability.md`

Important planning notes from the spec set:

- Iteration order is explicit: `IT0-ECHO`, `IT1-CONN-AUTH`, then MVP behaviors.
- Message/response flow must preserve full context and deterministic handling.
- Middleware behavior, not implementation language, is the conformance target.

## 5) External references to use

- SOLO docs (v0.55.0): `https://solo.hiero.org/v0.55.0/`
- Hedera smart contracts tutorials: `https://docs.hedera.com/hedera/tutorials/smart-contracts`
- Repo setup docs:
  - `README.md`
  - `TEST_SETUP.md`
  - `test/README.md`

## 6) Local SOLO runbook (CLI v0.55.0)

Validate tooling:

```bash
solo --version
```

Expected: `Version : 0.55.0`.

Useful discovery commands:

```bash
solo cluster-ref config list
solo deployment config list -c docker-desktop
```

Clean reset (single-node one-shot):

```bash
solo one-shot single destroy -q
solo one-shot single deploy -q -d <deployment-name>
```

Cluster health checks:

```bash
kubectl get ns | rg solo
kubectl get pods -n <deployment-name>
kubectl get svc -n <deployment-name>
```

Known local endpoints used by this repo config:

- JSON-RPC Relay: `http://127.0.0.1:7546`
- Consensus node gRPC: `127.0.0.1:50211`
- Mirror gRPC: `127.0.0.1:5600`
- Explorer UI: `http://127.0.0.1:8080`

Notes:

- `utils/constants.js` local network values match these endpoints.
- Explorer may show periodic background transfers from `mirror-1-monitor`; this is expected in SOLO.

SOLO flake forensics (capture before reset):

- If deploys/hangs start occurring, collect diagnostics before destroy/redeploy.
- Save a short incident note with:
  - date/time and timezone
  - SOLO version
  - deployment name and namespace
  - exact command that failed
  - transaction hash(es), if available
  - observed symptom (e.g. wrong nonce, missing receipts, frozen block height)
- Capture runtime state:
  - `solo deployment diagnostics connections -d <deployment-name> -q`
  - `solo deployment diagnostics logs -d <deployment-name> -q --output-dir /tmp/solo-diagnostics`
  - `solo deployment diagnostics all -d <deployment-name> -q`
  - `kubectl -n <namespace> get pods -o wide`
  - `kubectl -n <namespace> get svc`
  - `kubectl -n <namespace> logs deploy/relay-1 --tail=400`
  - `kubectl -n <namespace> logs deploy/mirror-1-importer --tail=400`
  - `kubectl -n <namespace> logs statefulset/network-node1 --tail=400`
- Capture relay health and liveness from local host:
  - `curl -sS -X POST http://127.0.0.1:7546 -H 'content-type: application/json' --data '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'`
  - repeat after a few seconds to verify block progression
- Only after data is captured should the environment be reset.

## 7) Contract compile/deploy/invoke workflow in this repo

Install and compile:

```bash
npm install
npx hardhat compile
```

Local env:

- Ensure `.env` has valid `OPERATOR_ID_A`, `OPERATOR_KEY_A`, and `PRIVATE_KEYS`.
- `hardhat.config.js` default network is `local`.
- After a SOLO clean reset, old `.env` keys may become stale. If deploy/run fails with
  `Sender account not found`, refresh credentials for the current deployment.

SOLO credential refresh notes (important):

- Symptom:
  - Hardhat local runs fail with `execution reverted: Sender account not found`.
- Cause:
  - `.env` points to keys from a previous SOLO network state.
- Fast fix:
  - Use current SOLO operator values (for example from relay env):
    - `OPERATOR_ID_MAIN`, `OPERATOR_KEY_MAIN`
  - Use a funded ECDSA private key for `PRIVATE_KEYS` from the current SOLO deployment.
  - Run with env overrides for the command (or maintain a dedicated `.env.solo` profile).
- Practical check:
  - `kubectl -n <deployment-name> exec <relay-pod> -- /bin/sh -lc 'env | sort | grep -E "OPERATOR|HEDERA_NETWORK|CHAIN_ID"'`
  - Re-run the Hardhat command with corrected env values.

Sample deployment and invocation (existing scripts):

```bash
npx hardhat run scripts/deploy-concatenation.js --network local
npx hardhat run scripts/tx-concatenation.js --network local
```

For HAPI-side invocation patterns (SDK client setup), use existing references:

- `scripts/freeze-network-node.js`
- `test/system-contracts/hedera-token-service/utils.js` (`createSDKClient`)

If adding HAPI Ethereum transaction helpers, place them in `scripts/` and keep them small and single-purpose.

## 8) Minimal CLPR development strategy for this repo

Start with one minimal, testable flow (`IT0-ECHO`) and do not skip ahead.

Suggested first increment:

- Middleware contract that accepts a send request and routes through a mock queue.
- Mock queue that delivers request to destination app and routes response back through queue.
- Source and destination apps with explicit known addresses (simulated remote ledgers).
- Single test proving full request/response round-trip and correct address-based routing.

This keeps behavior aligned with the CLPR iteration plan while minimizing moving parts.

## 9) Definition of done for each CLPR increment

- Contracts compile (`npx hardhat compile`).
- New tests pass:
  - `npx hardhat test <target>`
  - `forge test --match-path test/foundry/<target>.t.sol` (or equivalent CLPR target).
- Smoke deploy succeeds on local SOLO via relay path.
- At least one invocation path is proven end-to-end for the increment under development.
- Changes are documented briefly in PR notes with exact files touched.
