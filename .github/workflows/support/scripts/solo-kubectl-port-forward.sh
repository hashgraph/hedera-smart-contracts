#!/usr/bin/env bash
# Starts background kubectl port-forward processes so localhost matches @hashgraph/sdk
# local-node expectations (127.0.0.1:50211 → consensus via HAProxy) and mirror Web3
# (127.0.0.1:8545 → svc/mirror-1-web3), consistent with hiero-sdk-js solo-lib.js.
#
# Required environment:
#   SOLO_NAMESPACE — Kubernetes namespace from Solo deploy (e.g. steps.*.outputs.namespace).
set -euo pipefail

NS="${SOLO_NAMESPACE:?SOLO_NAMESPACE is required}"

kubectl get svc haproxy-node1-svc -n "$NS"
kubectl port-forward -n "$NS" svc/haproxy-node1-svc 50211:50211 &
echo "Forwarding svc/haproxy-node1-svc → localhost:50211 (consensus gRPC for local-node)"

if kubectl get svc mirror-1-web3 -n "$NS" &>/dev/null; then
  kubectl port-forward -n "$NS" svc/mirror-1-web3 8545:80 &
  echo "Forwarding svc/mirror-1-web3 → localhost:8545 (mirror Web3)"
else
  echo "::warning::svc/mirror-1-web3 not found in $NS; skipping 8545 forward"
fi

sleep 3
