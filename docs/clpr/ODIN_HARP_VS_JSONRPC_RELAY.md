# ODIN/HARP (HAPI-Only) vs Hardhat + JSON-RPC Relay (Two-Solo CLPR Bridge)

This note captures my candid take on why the ODIN/OODA + HARP approach (as planned in
`../hiero-autonomous-agent-platform/docs/development/v0.2.0/plan/README.md`) is a better path for **reliable** two-ledger
CLPR testing than the earlier approach we attempted here using **Hardhat + JSON-RPC relays**.

This is grounded in the concrete failure investigation captured in `SOLO_TWO_NETWORK_CLPR_BRIDGE_NOTES.md`.

## What We Tried In This Repo (And Why It Was Brittle)

The “two-ledger bridged test” posture here depended on:

- two Solo consensus nodes (two namespaces)
- two Mirror nodes (two namespaces)
- two JSON-RPC relays (two namespaces)
- local port-forwarding to reach both relays/consensus endpoints
- Hardhat tests sending EVM transactions via `eth_sendRawTransaction`
- a thin relayer loop ferrying `bytes` across ledgers

The key practical takeaway is that the relay is not a self-contained “RPC endpoint”; it depends on Mirror being healthy
and ingesting. When Mirror ingestion stalled, relay submissions failed even though the consensus node itself was
responding normally to gRPC/HAPI queries.

## The Root Cause That Dominated Everything

From `SOLO_TWO_NETWORK_CLPR_BRIDGE_NOTES.md`:

- Mirror importer repeatedly reported no new signature files.
- Consensus node produced record stream `.rcd.gz` files that were only 10 bytes, and no `.rcd_sig` marker appeared.
- Without `.rcd_sig`, the uploader never uploads record streams to MinIO; without those, importer never ingests; without
  ingestion, Mirror REST never advances.
- Relay then rejected `eth_sendRawTransaction` with “resource not found” for the sender address (Mirror-backed alias /
  account lookups failed).

This failure mode is “outside” the CLPR middleware itself, but it blocks any JSON-RPC-relay-based two-ledger testing.

## Why ODIN/HARP’s v0.2.0 Strategy Is The Right Default

The v0.2.0 plan is explicitly:

- multi-ledger in one run (`spec.harp.ledgers`)
- HAPI/gRPC-first sensing and actuation
- Mirror optional (not required for PASS/FAIL)

That matches what we learned empirically:

- Consensus node gRPC can still resolve alias/account state even when Mirror is stale.
- If your PASS/FAIL evidence can be obtained via HAPI contract calls (or other HAPI queries), you can keep making forward
  progress on CLPR middleware behavior even while the record-stream + mirror ingestion pipeline is unstable.

In other words: ODIN/HARP lets us test “what matters” (contract behavior + cross-ledger relaying logic) without being
held hostage by Mirror ingestion health.

## Critique: ODIN/OODA Framing vs What Actually Needs To Work

The OODA framing is useful as an organizing principle, but the success criteria here are not “AI” outcomes; they are
boring systems-engineering outcomes:

- explicit endpoints and key management per-ledger
- supervised, repeatable environment setup
- deterministic PASS/FAIL based on contract state (and/or receipts) without Mirror
- rich artifacts (trace logs + structured results) so failures are explainable and actionable

As long as ODIN stays pragmatic (agents as deterministic rule engines, not “LLM agents”), the OODA decomposition is a net
positive: it forces a clean separation of sensing, deciding, and acting, and it produces good traces.

Where the approach can go wrong:

- over-investing in new DSL surface area too early
- letting “agent intelligence” become a substitute for reliable sensors/actuators and crisp verification conditions

## What ODIN/HARP Still Needs (Even In HAPI-Only Mode)

Even with HAPI-only sensors/actuators, two-ledger testing is still operationally fragile unless ODIN/HARP bakes in:

- “freshness” start checks (to avoid false PASS on dirty namespaces)
- per-ledger endpoint sanity checks (to avoid accidentally targeting one ledger twice)
- clear logs that distinguish:
  - expected EVM reverts used as “no data yet” signals (queue polling), vs
  - transport failures / platform not active, vs
  - decode/encoding bugs (bytes handling)
- a stable bytes encoding convention across sensor outputs and actuator inputs (base64 vs hex)

## My Recommendation For How To Use Both Approaches

1. Make ODIN/HARP HAPI-only the correctness baseline for CLPR ITs (especially two-ledger bridge scenarios).
2. Keep JSON-RPC relay tests as optional “compatibility” checks.
   - If they fail, ODIN should be able to fail fast with diagnostics that point at Mirror ingestion health rather than
     looking like “CLPR is broken”.
3. Consider adding an `EthereumTransaction` (type 51) actuator later.
   - This would let ODIN reproduce “relay path” semantics without having to depend on the relay+mirror stack to be
     healthy, and it would help isolate whether a revert is coming from contract logic vs the submission path.

## Why This Matters For CLPR Middleware Work

CLPR middleware development is incremental. We need a test harness that:

- reliably tells us when we broke the middleware or apps, and
- does not conflate middleware failures with infrastructure failures (mirror ingestion, ingress routing, port-forwarding).

ODIN/HARP’s stated v0.2.0 posture is aligned with that need.

