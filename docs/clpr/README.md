# CLPR Docs

This folder contains CLPR middleware design notes, reports, and operational troubleshooting for this repository.

## Documents

- `CLPR_MIDDLEWARE_OVERVIEW.md`
  - High-level overview of the current CLPR middleware implementation, contract layout, and test strategy.
- `CLPR_DEMO_REPORT_2026-02-11.md`
  - Comprehensive demo report covering middleware behavior, single-ledger and two-ledger test flows, and framework comparison.
- `SOLO_TWO_NETWORK_CLPR_BRIDGE_NOTES.md`
  - Detailed troubleshooting log for running two Solo networks with a bridged CLPR scenario.
- `ODIN_HARP_VS_JSONRPC_RELAY.md`
  - Comparison of ODIN/HARP (HAPI-first) versus JSON-RPC-relay-centric test paths.

## Source Code Map

- Contracts: `contracts/solidity/clpr/`
- Hardhat tests: `test/solidity/clpr/` and `test/network/clpr/`
- Foundry tests: `test/foundry/`
- Helper scripts: `scripts/`

## Recommended Reading Order

1. `CLPR_MIDDLEWARE_OVERVIEW.md`
2. `CLPR_DEMO_REPORT_2026-02-11.md`
3. `SOLO_TWO_NETWORK_CLPR_BRIDGE_NOTES.md`
4. `ODIN_HARP_VS_JSONRPC_RELAY.md`
