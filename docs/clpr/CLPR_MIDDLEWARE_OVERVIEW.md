# CLPR Middleware Overview

## Purpose

The CLPR middleware in this repository is a Solidity reference implementation that models cross-ledger request/response routing with connector-aware policy checks.

Current source root:

- `contracts/solidity/clpr/`

## Main Components

- `middleware/ClprMiddleware.sol`
  - Registers local applications and connectors.
  - Handles source send flow and destination receive flow.
  - Tracks remote connector status from responses.
  - Enforces destination connector out-of-funds prechecks.
- `apps/SourceApplication.sol`
  - Sends application messages through middleware.
  - Supports connector preference ordering and failover (`sendWithFailover`).
- `apps/EchoApplication.sol`
  - Reference destination app used for request/response validation.
- `mocks/MockClprConnector.sol`
  - Connector mock for authorization, balance reporting, and reimbursement behavior.
- `mocks/MockClprQueue.sol`
  - Single-ledger queue mock for deterministic async-style request/response testing.
- `mocks/MockClprRelayedQueue.sol`
  - Two-ledger queue mock used with an off-chain relayer.

## Core Flow (Logical)

1. Source app calls middleware `send(...)`.
2. Source middleware validates app/connector and calls source connector `authorize(...)`.
3. Queue stores and forwards `ClprMessage` to destination middleware.
4. Destination middleware validates destination connector and funds policy.
5. Destination app handles message (or middleware returns connector failure status).
6. Destination connector reimbursement behavior is applied.
7. Response returns to source middleware.
8. Source middleware updates remote status cache and delivers response to source app.

## Current Behavioral Focus

The implementation is aligned with the current connector-aware increment:

- Connector registration and remote pairing semantics.
- Source-side authorization before enqueue.
- Destination-side safety threshold and minimum charge checks.
- Remote balance/policy propagation in middleware response handling.
- Source-side pre-enqueue rejection when remote connector is known out-of-funds.
- Connector preference and failover in the source app.

## Testing Strategy

### Single-ledger (fast feedback)

- Hardhat integration:
  - `npx hardhat test test/solidity/clpr/clprMiddleware.js --network hardhat`
- Foundry unit/integration:
  - `forge test --match-path test/foundry/ClprMiddleware.t.sol`

### Two-ledger (bridge behavior)

- Hardhat bridged test:
  - `test/network/clpr/clprBridgeRelayedQueue.js`
- Relayer scripts:
  - `scripts/clpr-bridge-relayer.js` (JSON-RPC path)
  - `scripts/clpr-bridge-relayer-hapi.js` (HAPI/gRPC path)

## Known Operational Notes

- JSON-RPC relay based testing is sensitive to mirror/ingress/record-ingestion health.
- HAPI/gRPC-based paths are currently the more reliable baseline for multi-ledger correctness checks.
- Detailed operational notes are in `docs/clpr/SOLO_TWO_NETWORK_CLPR_BRIDGE_NOTES.md`.

## Related Documentation

- CLPR report: `docs/clpr/CLPR_DEMO_REPORT_2026-02-11.md`
- ODIN/HARP comparison: `docs/clpr/ODIN_HARP_VS_JSONRPC_RELAY.md`
- CLPR contract-local README: `contracts/solidity/clpr/README.md`
