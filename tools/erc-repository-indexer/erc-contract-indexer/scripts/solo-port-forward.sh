#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
#
# Forwards only the ports used by CI and hiero-sdk-js-style local setup:
#   - 50211 → svc/haproxy-node1-svc (consensus gRPC; @hashgraph/sdk local-node / LocalNodeNetwork)
#   - 8545  → svc/mirror-1-web3 (mirror Web3; set MIRROR_NODE_URL_WEB3=http://127.0.0.1:8545)
#
# For mirror REST, mirror gRPC (5600), relay, etc., run additional kubectl port-forwards yourself
# or rely on Solo --force-port-forward host bindings.
#
# Usage:
#   export SOLO_NAMESPACE=your-namespace   # or pass as first argument
#   export KUBE_CONTEXT=kind-solo-cluster   # optional
#   ./scripts/solo-port-forward.sh
#
# Stop forwards from this namespace:
#   pkill -f "kubectl port-forward.*${SOLO_NAMESPACE}"

set -euo pipefail

NAMESPACE="${SOLO_NAMESPACE:-${1:-}}"
if [[ -z "${NAMESPACE}" ]]; then
  echo "Usage: SOLO_NAMESPACE=<ns> $0   OR   $0 <namespace>" >&2
  echo "Optional: KUBE_CONTEXT (e.g. kind-solo-cluster)" >&2
  exit 1
fi

kubectl_bin=(kubectl)
if [[ -n "${KUBE_CONTEXT:-}" ]]; then
  kubectl_bin=(kubectl --context "${KUBE_CONTEXT}")
fi

echo "[solo-port-forward] namespace=${NAMESPACE}"

if ! "${kubectl_bin[@]}" get "svc/haproxy-node1-svc" -n "${NAMESPACE}" &>/dev/null; then
  echo "[solo-port-forward] ERROR: svc/haproxy-node1-svc not found in namespace ${NAMESPACE}" >&2
  "${kubectl_bin[@]}" get svc -n "${NAMESPACE}" 2>/dev/null | grep -E 'mirror|ingress|haproxy|NAME' || true
  exit 1
fi

if pgrep -f "kubectl port-forward.*${NAMESPACE}" &>/dev/null; then
  echo "[solo-port-forward] Stopping existing kubectl port-forward for this namespace..."
  pkill -f "kubectl port-forward.*${NAMESPACE}" || true
  sleep 2
fi

forward() {
  local description=$1
  shift
  echo "[solo-port-forward] ${description}"
  "${kubectl_bin[@]}" "$@" &
}

forward "Consensus → localhost:50211 (svc/haproxy-node1-svc)" \
  port-forward "svc/haproxy-node1-svc" -n "${NAMESPACE}" "50211:50211"

if "${kubectl_bin[@]}" get "svc/mirror-1-web3" -n "${NAMESPACE}" &>/dev/null; then
  forward "Mirror Web3 → localhost:8545 (svc/mirror-1-web3)" \
    port-forward "svc/mirror-1-web3" -n "${NAMESPACE}" "8545:80"
else
  echo "[solo-port-forward] WARN: svc/mirror-1-web3 not found; skipping 8545"
fi

sleep 2
echo ""
echo "[solo-port-forward] Done. Active forwards:"
echo "  50211  consensus gRPC (local-node SDK)"
echo "  8545   mirror Web3 (when svc/mirror-1-web3 exists)"
echo ""
echo "Stop: pkill -f \"kubectl port-forward.*${NAMESPACE}\""
