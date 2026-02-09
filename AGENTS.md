# AGENTS.md

This file is a working guide for AI agents contributing to `hedera-smart-contracts`, with a focus on building CLPR middleware contracts incrementally.

## 1) Mission and scope

- This repository is a reference library of Hedera/Hiero smart contracts and tests.
- For CLPR work here, preserve existing repository style and placement patterns.
- Build in small, testable increments. Prefer one flow at a time over broad scaffolding.
- Keep the CLPR section in the top-level `README.md` current:
  - reflect the current middleware capabilities, and
  - reflect the tests that validate those capabilities.

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

Current CLPR split (use this as baseline for future CLPR iterations):

- `contracts/solidity/clpr/types/` shared envelopes and value types
- `contracts/solidity/clpr/interfaces/` public API contracts for middleware/apps/queue
- `contracts/solidity/clpr/middleware/` middleware implementations
- `contracts/solidity/clpr/mocks/` test doubles and local queue mocks
- `contracts/solidity/clpr/apps/` reference application implementations

## 3) Code style and contribution guardrails

- Keep SPDX header in Solidity/JS files:
  - `// SPDX-License-Identifier: Apache-2.0`
- CLPR in this repo is a prototype and is free to evolve:
  - There are no external consumers to protect with backwards-compatible import paths or ABI layouts.
  - Prefer the cleanest design and spec conformance over compatibility shims.
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

CLPR test commands:

```bash
# Hardhat (in-process ephemeral chain). Note: repo default network is `local` and requires a node.
npx hardhat test test/solidity/clpr/clprMiddleware.js --network hardhat

# Foundry
forge test --match-path test/foundry/ClprMiddleware.t.sol
```

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
  - This repo intentionally keeps only the current iteration source; earlier iterations live in git history.
- Message/response flow must preserve full context and deterministic handling.
- Middleware behavior, not implementation language, is the conformance target.

## 5) External references to use

- SOLO docs (v0.55.0): `https://solo.hiero.org/v0.55.0/`
- Hedera smart contracts tutorials: `https://docs.hedera.com/hedera/tutorials/smart-contracts`
- Repo setup docs:
  - `README.md`
  - `TEST_SETUP.md`
  - `test/README.md`

Local implementation reference (important when debugging “EVM behavior” questions):

- Sibling repo: `../hiero-consensus-node`
  - Contains the consensus node codebase and the Besu EVM integration/adaptations used by Hiero.
  - If reasoning about low-level EVM execution, traces, storage-slot effects, or revert behavior on SOLO,
    confirm assumptions against this implementation (do not assume a vanilla geth/anvil environment).

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
- Mirror gRPC: `127.0.0.1:5600` (only if you port-forward it)
- Mirror REST (ODIN default): `http://127.0.0.1:8080` (port-forward `mirror-ingress-controller` -> `:80`)
- Explorer UI: varies (SOLO may port-forward it to `:8080`, which conflicts with ODIN’s default mirror port)

Notes:

- `utils/constants.js` local network values match these endpoints.
- Explorer may show periodic background transfers from `mirror-1-monitor`; this is expected in SOLO.
- If ODIN is in use, prefer dedicating `:8080` to mirror REST and run explorer on a different local port.

SOLO v0.55.0 mirror/relay gotcha (important for JSON-RPC Relay stability):

- Mirror’s `mirror-ingress-controller` is `haproxy-ingress` and only watches ingresses with
  `spec.ingressClassName=mirror-ingress-class`.
- The mirror chart currently creates `mirror-1-*` ingress resources without an ingress class, so
  `mirror-ingress-controller` returns `404` for `/api/v1/*`.
- The relay (`relay-1`) depends on mirror endpoints like `/api/v1/accounts/...` and `/api/v1/network/fees`;
  when those return `404`, the relay crashes (observed as `Operator account '0.0.2' has no balance`).

Fix (patch ingresses inside the SOLO namespace, then let relay restart):

```bash
ns=<solo-namespace>

# Attach ingresses to the mirror ingress controller’s class.
for ing in mirror-1-rest mirror-1-restjava mirror-1-web3 mirror-1-grpc mirror-1-monitor; do
  kubectl patch ingress -n "$ns" "$ing" --type='json' \
    -p='[{"op":"add","path":"/spec/ingressClassName","value":"mirror-ingress-class"}]'
done

# Ensure mirror REST routes all /api/v1/* paths (Prefix match).
kubectl patch ingress -n "$ns" mirror-1-rest --type='json' \
  -p='[{"op":"replace","path":"/spec/rules/0/http/paths/0/pathType","value":"Prefix"}]'

# Ensure the relay’s fee lookups work (remove trailing "$" regex anchors).
kubectl patch ingress -n "$ns" mirror-1-restjava --type='json' -p='[
  {"op":"replace","path":"/spec/rules/0/http/paths/3/path","value":"/api/v1/network/fees"},
  {"op":"replace","path":"/spec/rules/0/http/paths/3/pathType","value":"Prefix"},
  {"op":"replace","path":"/spec/rules/0/http/paths/4/path","value":"/api/v1/network/stake"},
  {"op":"replace","path":"/spec/rules/0/http/paths/4/pathType","value":"Prefix"}
]'

# Quick in-cluster verification:
kubectl run -n "$ns" odin-curl --rm -i --restart=Never --image=curlimages/curl -- \
  sh -lc 'curl -s -o /dev/null -w "%{http_code}\n" http://mirror-ingress-controller/api/v1/accounts/0.0.2;
          curl -s -o /dev/null -w "%{http_code}\n" http://mirror-ingress-controller/api/v1/network/fees'
```

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

Maintain a single current iteration in-tree (today: `IT1-CONN-AUTH` behavior) and evolve it in place:

- Evolve in place; do not create `IT0`, `IT1`, `IT2`, ... file sprawl.
- Keep one end-to-end flow passing (Hardhat + Foundry) at all times.

This keeps behavior aligned with the CLPR iteration plan while minimizing moving parts.

Naming:

- Use durable, production-intended filenames and contract names (no `IT0`/`IT1` suffixes).
- Track iteration progress via the spec iteration plan, test names, and git history rather than renaming files each time.

## 9) Definition of done for each CLPR increment

- Contracts compile (`npx hardhat compile`).
- New tests pass:
  - `npx hardhat test <target>`
  - `forge test --match-path test/foundry/<target>.t.sol` (or equivalent CLPR target).
- Smoke deploy succeeds on local SOLO via relay path.
- At least one invocation path is proven end-to-end for the increment under development.
- Changes are documented briefly in PR notes with exact files touched.

## 10) ODIN (OODA-Driven INtegration) IT1 on SOLO

ODIN is a SOLO-backed “smoke/integration” harness for CLPR that runs multiple autonomous “agents” and evaluates pass/fail
from structured markers in logs plus RPC/mirror sensing.

Key pieces:

- Orchestrator (this repo): `scripts/odin/run-clpr-it1-odin.js`
  - Discovers a running SOLO namespace (or use `--namespace <ns>`).
  - Discovers a funded ECDSA operator key from `account-key-*` secrets.
  - Deploys CLPR contracts via `scripts/odin/deploy-clpr-it1.js`.
  - Note: `MockClprQueue` stores responses and requires an explicit delivery step; `scripts/odin/agent-send.js` calls
    `deliverAllMessageResponses` after submitting the application send transaction.
  - Builds the Java runner JAR from the sibling repo and copies it into `tools/odin/lib/odin-it1-runner.jar`.
  - Runs the JAR and fails non-zero if the run result is not `passed=true`.
- Java runner (sibling repo): `../hiero-autonomous-agent-platform`
  - Runner source: `../hiero-autonomous-agent-platform/src/main/java/org/hiero/odin/OdinRunner.java`
  - Build script: `../hiero-autonomous-agent-platform/scripts/build-jar.sh`
  - Output JAR: `../hiero-autonomous-agent-platform/build/libs/odin-it1-runner.jar` (or legacy `odin-it0-runner.jar`)
- Test pack config (this repo):
  - `test/odin/clpr/it1/endpoints.properties` (RPC + mirror URLs)
  - `test/odin/clpr/it1/test-plan.properties` (agents + checks + command templates)
  - Runtime outputs:
    - `test/odin/clpr/it1/runtime/deployment.properties`
    - `test/odin/clpr/it1/runtime/odin-result.json`
    - `test/odin/clpr/it1/runtime/odin-runner.log`

Run it:

```bash
node scripts/odin/run-clpr-it1-odin.js --namespace <solo-namespace>
```

Optional (dangerous) reset:

```bash
node scripts/odin/run-clpr-it1-odin.js --namespace <solo-namespace> --fresh
```

Reliability knobs (adjust as needed in `test/odin/clpr/it1/test-plan.properties`):

- `agent.action.retries` and `agent.action.baseDelayMs`: retry “action” commands (SOLO/relay can intermittently revert).
- `run.failOnRetries`: when `true`, any required retry makes the run fail (useful to detect SOLO flakiness).
- `checks.*.maxWaitMs` and `checks.*.pollIntervalMs`: polling windows for:
  - RPC receipts (`checks.rpcReceipt.*`)
  - mirror contract results (`checks.mirrorResult.*`)
  - on-chain source-app state via relay `eth_call` (`checks.sourceState.*`)
