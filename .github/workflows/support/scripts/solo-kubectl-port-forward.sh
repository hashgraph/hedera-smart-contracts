#!/usr/bin/env bash
# Forwards the mirror node Web3 service to localhost:8545 for the ERC-registry
# indexer (its MIRROR_NODE_URL_WEB3). Consensus gRPC (35211), JSON-RPC relay (37546)
# and mirror REST ingress (38081) are exposed automatically by Solo's one-shot
# falcon deploy (@hashgraph/solo >= 0.74.0 forwards them to the host by default),
# so no manual port-forward is needed for those.
#
# Required environment:
#   SOLO_NAMESPACE — Kubernetes namespace from Solo deploy (e.g. steps.*.outputs.namespace).
set -euo pipefail

NS="${SOLO_NAMESPACE:?SOLO_NAMESPACE is required}"

if kubectl get svc mirror-1-web3 -n "${NS}" &>/dev/null; then
  kubectl port-forward -n "${NS}" svc/mirror-1-web3 8545:80 &
  echo "Forwarding svc/mirror-1-web3 → localhost:8545 (mirror Web3)"
else
  echo "::warning::svc/mirror-1-web3 not found in ${NS}; skipping 8545 forward"
fi

sleep 3
