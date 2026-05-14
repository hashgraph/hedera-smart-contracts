#!/usr/bin/env bash
# Deploys Solo Falcon one-shot on Kind. Expects repo root as cwd and Kind tooling
# already installed (e.g. via helm/kind-action). Writes deployment_name and namespace
# to GITHUB_OUTPUT when set (GitHub Actions).
set -euo pipefail

NETWORK_TAG="${NETWORK_TAG:-v0.72.0}"
MIRROR_TAG="${MIRROR_TAG:-v0.151.0}"
RELAY_TAG="${RELAY_TAG:-0.76.2}"
SOLO_VERSION="${SOLO_VERSION:-0.72.0}"

mkdir -p .github

cat >.github/falcon.yml <<EOF
network:
  --release-tag: "${NETWORK_TAG}"
setup:
  --release-tag: "${NETWORK_TAG}"
consensusNode:
  --force-port-forward: true
  --node-aliases: "node1"
mirrorNode:
  --enable-ingress: true
  --pinger: true
  --mirror-node-version: "${MIRROR_TAG}"
  --values-file: .github/mirror-node-values.yaml
  --force-port-forward: true
relayNode:
  --relay-release: "${RELAY_TAG}"
  --values-file: .github/relay-values.yaml
  --node-aliases: "node1"
  --force-port-forward: true
EOF

NS_BASE="sc-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}-${GITHUB_JOB:-solo}"
SOLO_NS="$(echo "$NS_BASE" | tr '[:upper:]_' '[:lower:]-' | cut -c1-63)"
SOLO_DEPLOYMENT="$SOLO_NS"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "deployment_name=${SOLO_DEPLOYMENT}"
    echo "namespace=${SOLO_NS}"
  } >>"$GITHUB_OUTPUT"
fi

npx @hashgraph/solo@${SOLO_VERSION} one-shot falcon deploy \
  --values-file .github/falcon.yml \
  --dev \
  --deploy-explorer=false \
  --deployment "$SOLO_DEPLOYMENT" \
  --namespace "$SOLO_NS"

echo "Waiting for mirror node REST API..."
for i in $(seq 1 30); do
  response=$(curl -sf http://localhost:38081/api/v1/accounts 2>/dev/null || true)
  if echo "${response}" | grep -q '"accounts"'; then
    echo "Mirror REST API is up."
    exit 0
  fi
  echo "Attempt ${i}/30: not ready, retrying in 10s..."
  sleep 10
done
echo "ERROR: Mirror REST API did not become available."
exit 1
