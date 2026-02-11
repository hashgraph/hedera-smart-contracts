# CLPR Middleware Demo Report (February 11, 2026)

## 0) Scope and context

This report summarizes the current CLPR middleware prototype in `hedera-smart-contracts`, how it is tested today, and what has been learned from single-ledger and two-ledger execution paths.

Primary code and test anchors:

- `contracts/solidity/clpr/middleware/ClprMiddleware.sol`
- `contracts/solidity/clpr/apps/SourceApplication.sol`
- `contracts/solidity/clpr/apps/EchoApplication.sol`
- `contracts/solidity/clpr/mocks/MockClprConnector.sol`
- `contracts/solidity/clpr/mocks/MockClprQueue.sol`
- `contracts/solidity/clpr/mocks/MockClprRelayedQueue.sol`
- `test/solidity/clpr/clprMiddleware.js`
- `test/foundry/ClprMiddleware.t.sol`
- `test/network/clpr/clprBridgeRelayedQueue.js`
- `scripts/clpr-bridge-relayer.js`
- `scripts/clpr-bridge-relayer-hapi.js`

---

## 1) CLPR middleware development so far and how it works (connectors + applications)

### What exists now

The current implementation models the IT1 connector-aware flow:

- Source app sends a `ClprApplicationMessage` through middleware.
- Middleware validates application registration, connector availability, and remote connector status.
- Source connector authorizes message send (`authorize`) and contributes connector-level message metadata.
- Queue assigns `messageId` and delivers to destination middleware.
- Destination middleware validates destination connector pairing and funding policy.
- Destination app executes only if destination connector has enough spendable balance (`available - safetyThreshold >= minimumCharge`).
- Destination connector reimburses middleware.
- Response is returned to source middleware.
- Source middleware updates cached remote connector status and delivers `ClprApplicationResponse` to source app.

### Connector and app roles

- `SourceApplication` selects connector preference and supports failover with `sendWithFailover`.
- `EchoApplication` is a destination reference app; it increments `requestCount` and echoes payload bytes.
- `MockClprConnector` models:
  - source-side authorization/deny behavior,
  - destination-side reimbursement behavior,
  - connector pairing semantics,
  - balance report + safety threshold policy.

### Exactly-once posture in this increment

- Queue + middleware map state by `messageId` and `originalMessageId`.
- Relayed queue (`MockClprRelayedQueue`) includes idempotency maps:
  - `inboundMessageProcessed[messageId]`
  - `inboundResponseDelivered[originalMessageId]`
- This supports deterministic, no-duplicate re-delivery behavior in test flows.

---

## 2) Primary test scenario (high-level logical flow)

Primary flow currently validated is the 3-message connector failover scenario:

1. Source app has connector priority: C1 -> C2 -> C3.
2. Destination side has connector funding states:
   - C1 underfunded / denied.
   - C2 initially funded enough for two charges, then reaches safety-threshold boundary.
   - C3 funded enough for continued operation.
3. Message 1:
   - C1 rejects.
   - C2 accepts and routes successfully.
4. Message 2:
   - C2 accepts and routes successfully.
5. Source receives responses for messages 1 and 2, learns updated remote status for destination connector C2.
6. Message 3:
   - C2 is rejected pre-enqueue due to known remote out-of-funds state.
   - Source fails over to C3, which accepts.
7. Destination app has processed all 3 payloads; source app receives 3 responses routed correctly.

This demonstrates meaningful connector-aware routing, funding-policy enforcement, and application response routing behavior.

---

## 3) Single-ledger testing: how it works and current result

### How it works

Single-ledger tests use an in-memory queue (`MockClprQueue`) and two middleware instances (source + destination) on the same chain process.

- Hardhat JS integration test:
  - `test/solidity/clpr/clprMiddleware.js`
- Foundry Solidity test:
  - `test/foundry/ClprMiddleware.t.sol`

### Fresh execution evidence (run today, February 11, 2026)

Command:

```bash
npx hardhat test test/solidity/clpr/clprMiddleware.js --network hardhat
```

Result:

- `4 passing` (includes the 3-message failover + funds safety-threshold scenario)

Command:

```bash
forge test --match-path test/foundry/ClprMiddleware.t.sol -vv
```

Result:

- `4 passed; 0 failed`

Interpretation: core CLPR behavior is stable and reproducible in local deterministic environments.

---

## 4) Two-ledger testing with JavaScript relay

### Deployment split across ledgers

Source ledger deploys:

- queue (`MockClprRelayedQueue`)
- source middleware
- source connectors
- source application

Destination ledger deploys:

- queue (`MockClprRelayedQueue`)
- destination middleware
- destination connectors
- destination currency token (WETH mock)
- echo application

### Call flow with the JS relay

1. Source app sends (`sendWithFailover`).
2. Source queue stores outbound message bytes (`getOutboundMessageBytes(messageId)`).
3. JS relay reads message bytes from source and calls destination queue `deliverInboundMessage`.
4. Destination queue stores response bytes (`getPendingResponseBytes(messageId)`).
5. JS relay reads response bytes from destination and calls source queue `deliverInboundResponse`.
6. Source middleware handles response and invokes source app `handleResponse`.

### State changes that prove expected behavior

- `srcQueue.nextMessageId` increments to `3`.
- `dstQueue.inboundMessageProcessed(1..3)` becomes `true`.
- destination echo app `requestCount` reaches `3`.
- source app emits three `ResponseReceived` payloads matching sent payloads.

### Two JS-relay gateway variants

1. Ethereum-native gateway path (JSON-RPC relay) via:
   - `test/network/clpr/clprBridgeRelayedQueue.js`
   - `scripts/clpr-bridge-relayer.js`
2. HAPI gRPC gateway path (still JS relay logic) via:
   - `scripts/clpr-bridge-relayer-hapi.js`

The bridge logic itself is sound. Reliability differences come primarily from the transaction gateway stack, not CLPR contract logic.

---

## 5) Two-ledger testing with ODIN/HARP

ODIN/HARP scenario reference:

- `/Users/user/IdeaProjects/hiero-autonomous-agent-platform/scenarios/scn-clpr-003-two-ledger-bridge`

What ODIN/HARP does:

- Uses HAPI/gRPC sensors and actuators only (no JSON-RPC relay dependency).
- Runs source-driver + two relay agents (`src->dst`, `dst->src`).
- Uses sensed evidence for pass/fail:
  - destination `requestCount == 3`
  - source queue `inboundResponseDelivered(3) == true`
  - at least three send actions emitted

### Fresh evidence from latest ODIN run artifacts

Artifact directory:

- `/Users/user/IdeaProjects/hiero-autonomous-agent-platform/build/odin-runs/scn-clpr-003-two-ledger-bridge/1770824365165`

`result.json` indicates:

- `"status": "PASS"`
- `"reason": "goal_reached:clprTwoLedgerBridgePass"`

`trace.log` shows:

- three `action.clpr003.src.evm.sendAppMessage`
- `sense.clpr003.dst.echo.requestCount` reaching `3`
- `sense.clpr003.src.queue.inboundResponseDelivered.3` reaching `true`

Interpretation: ODIN/HARP already demonstrates reliable two-ledger CLPR bridge execution with explicit evidence-based verification.

---

## 6) JSON-RPC relay flakiness analysis (queue medium and source gateway)

### A) As source transaction gateway (Ethereum-native `eth_sendRawTransaction`)

Observed failure patterns:

- Relay startup/crash dependency on mirror endpoint correctness.
- Address/account resolution failures when mirror ingestion is stale.
- Transaction submission failure with:
  - `Requested resource not found. address '0x...'`

Evidence:

- `SOLO_TWO_NETWORK_CLPR_BRIDGE_NOTES.md` documents repeated `eth_sendRawTransaction` address-not-found failures and mirror ingestion dependency.

### B) As medium for two-ledger bridge execution

Observed failure patterns:

- Mirror ingress wiring mismatch causes relay crashloop.
- Record ingestion stalls, leaving mirror stale.
- Port-forward and endpoint lifecycle issues can create false negatives.

Fresh evidence from today (February 11, 2026):

- `solo relay node add -d solo-clpr-src` failed readiness.
- Relay logs show fatal mirror DNS resolution failure:
  - `getaddrinfo ENOTFOUND mirror-ingress-controller.solo-clpr-src.svc.cluster.local`
- ConfigMap pointed relay at non-existent in-namespace mirror ingress service.
- Mirror importer repeatedly logs:
  - `No new signature files to download after file: ... .rcd.gz`
- Consensus node record stream check currently shows:
  - `.rcd.gz` file size `10`
  - `.rcd_sig` count `0`

Relevant notes and diagnostics:

- `SOLO_TWO_NETWORK_CLPR_BRIDGE_NOTES.md`
- `AGENTS.md` (mirror/ingress gotchas and patches)

### C) Comparison vs HAPI gRPC gateway

- JSON-RPC path is more infrastructure-coupled (relay + mirror + ingress + ingestion).
- HAPI path can operate with fewer moving parts and is currently more reliable for CLPR correctness validation.
- Practical conclusion:
  - JSON-RPC should be treated as compatibility/interop coverage.
  - HAPI should be the correctness baseline while CLPR evolves.

---

## 7) Comparative analysis of testing frameworks and methods

### Summary matrix

| Framework / Method | Best fit | Strengths | Weaknesses | Recommended role |
|---|---|---|---|---|
| Hardhat (single-ledger, in-process) | Multi-contract integration on one chain | Fast iteration, good JS ergonomics, event/assertion tooling | Not representative of distributed infra | Day-to-day contract integration checks |
| Foundry | Solidity-level unit + invariant-style contract testing | Very fast, deterministic, Solidity-native assertions | Less suited for cross-ledger orchestration | Core contract correctness and edge-case coverage |
| JS relay + JSON-RPC relay | Ethereum-native compatibility path | Exercises real `eth_*` flow and relay behavior | Highly sensitive to mirror/ingress/record pipeline | Optional compatibility suite, not primary gate |
| JS relay + HAPI gRPC | Two-ledger bridge with minimal extra infra | More reliable than JSON-RPC path, direct node interaction | More custom scripting and operator-key plumbing | Transitional two-ledger smoke/integration path |
| ODIN/HARP (two-ledger and beyond) | Distributed scenario orchestration (N ledgers, agents, evidence) | Explicit sense-reason-act loop, structured evidence, scalable orchestration model | Higher framework complexity; DSL/system design overhead | Primary framework for multi-ledger integration, scenario, and eventually chaos/fuzz orchestration |

### Suitability by test scope

| Test scope | Hardhat | Foundry | JS Relay | ODIN/HARP |
|---|---|---|---|---|
| Single contract / local logic | Good | Excellent | Poor | Poor |
| Multi-contract one-ledger integration | Excellent | Good | Poor | Fair |
| Two-ledger bridge behavior | Fair | Poor | Good (HAPI), Fair (JSON-RPC) | Excellent |
| N>2 ledger distributed orchestration | Poor | Poor | Fair (manual complexity rises fast) | Excellent |
| Long-running autonomy / policy-driven tests | Poor | Poor | Fair | Excellent |

### Recommendation going forward

1. Keep Hardhat + Foundry as mandatory fast local gates for every middleware increment.
2. Keep JS relay tests for tactical bridge/path validation.
3. Make ODIN/HARP the strategic framework for multi-ledger scenario growth (N>2), autonomy loops, and richer verification.
4. Keep JSON-RPC relay path in a separate compatibility track so infra flake does not block core CLPR progress.

---

## Appendix: key evidence files used in this report

- `SOLO_TWO_NETWORK_CLPR_BRIDGE_NOTES.md`
- `ODIN_HARP_VS_JSONRPC_RELAY.md`
- `test/odin/clpr/it1/runtime/odin-result.json`
- `test/odin/clpr/it1/runtime/diag-0x02c69c56c3d0f0ce9ddc97a0aaa4a78387ece54b68bad33009f78f4b38545344.json`
- `/Users/user/IdeaProjects/hiero-autonomous-agent-platform/build/odin-runs/scn-clpr-003-two-ledger-bridge/1770824365165/result.json`
- `/Users/user/IdeaProjects/hiero-autonomous-agent-platform/build/odin-runs/scn-clpr-003-two-ledger-bridge/1770824365165/trace.log`

