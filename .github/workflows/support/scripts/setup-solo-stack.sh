#!/usr/bin/env bash
# Deploys Solo Falcon one-shot on Kind. Expects repo root as cwd and Kind tooling
# already installed (e.g. via helm/kind-action). Writes deployment_name and namespace
# to GITHUB_OUTPUT when set (GitHub Actions).
set -euo pipefail

# Pinned versions live in .github/network-versions.env; env vars of the same name override them.
VERSIONS_FILE=".github/network-versions.env"
pinned() { sed -n "s/^$1=//p" "${VERSIONS_FILE}"; }

NETWORK_TAG="${NETWORK_TAG:-$(pinned NETWORK_TAG)}"
MIRROR_TAG="${MIRROR_TAG:-$(pinned MIRROR_TAG)}"
RELAY_TAG="${RELAY_TAG:-$(pinned RELAY_TAG)}"
SOLO_VERSION="${SOLO_VERSION:-$(pinned SOLO_VERSION)}"
RELAY_VALUES_FILE="${RELAY_VALUES_FILE:-.github/examples-relay-values.yaml}"
# Set EXTERNAL_ADDRESS=0.0.0.0 when docker containers must reach the forwarded ports.
EXTERNAL_ADDRESS="${EXTERNAL_ADDRESS:-}"

# Generated per run, outside the repository so it never shows up as a change.
FALCON_VALUES="$(mktemp "${RUNNER_TEMP:-${TMPDIR:-/tmp}}/solo-falcon-XXXXXX.yml")"
cat >"${FALCON_VALUES}" <<EOF
consensusNode:
  --node-aliases: "node1"
mirrorNode:
  --enable-ingress: true
  --pinger: true
relayNode:
  --values-file: ${RELAY_VALUES_FILE}
  --node-aliases: "node1"
EOF

NS_BASE="sc-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}-${GITHUB_JOB:-solo}"
SOLO_NS="$(echo "${NS_BASE}" | tr '[:upper:]_' '[:lower:]-' | cut -c1-63)"
SOLO_DEPLOYMENT="${SOLO_NS}"

if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "deployment_name=${SOLO_DEPLOYMENT}"
    echo "namespace=${SOLO_NS}"
  } >>"${GITHUB_OUTPUT}"
fi

EXTRA_ARGS=()
if [[ -n "${EXTERNAL_ADDRESS}" ]]; then
  EXTRA_ARGS+=(--external-address "${EXTERNAL_ADDRESS}")
fi

npx @hashgraph/solo@${SOLO_VERSION} one-shot falcon deploy \
  --values-file "${FALCON_VALUES}" \
  --consensus-node-version "${NETWORK_TAG}" \
  --mirror-node-version "${MIRROR_TAG}" \
  --relay-version "${RELAY_TAG}" \
  --debug \
  --deploy-explorer=false \
  --deployment "${SOLO_DEPLOYMENT}" \
  --namespace "${SOLO_NS}" \
  ${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"}

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
