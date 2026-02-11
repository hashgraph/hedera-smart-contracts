## CLPR two-network (bridged) tests

These tests are intended to run against **two separate Solo deployments** to validate CLPR behavior with
truly separated ledgers before the real messaging layer is integrated.

They use:

- `MockClprRelayedQueue` as a minimal on-ledger outbox/inbox queue contract, and
- a thin off-chain "relayer" loop that forwards ABI-encoded messages and responses between networks.

### Prerequisites

1. Two Solo networks running (distinct Kubernetes namespaces).
2. Two reachable JSON-RPC endpoints (one per network), via port-forward or in-cluster DNS.

Example (port-forward two relay services to different local ports):

```bash
kubectl port-forward -n <solo-ns-a> svc/relay-1 7546:7546
kubectl port-forward -n <solo-ns-b> svc/relay-1 7547:7546
```

### Running

```bash
export CLPR_SRC_RPC_URL=http://127.0.0.1:7546
export CLPR_DST_RPC_URL=http://127.0.0.1:7547

# Uses CLPR_PRIVATE_KEY if set; otherwise uses the first key from PRIVATE_KEYS.
export CLPR_PRIVATE_KEY=<0x...>

npx hardhat test test/network/clpr/clprBridgeRelayedQueue.js --network hardhat
```

