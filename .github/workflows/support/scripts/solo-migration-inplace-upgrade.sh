#!/usr/bin/env bash
# Runs in-place Solo upgrades (consensus, mirror, relay) when normalized tags differ.
# Intended for migration-testing and similar CI. Run from repository root.
#
# Required environment:
#   SOLO_DEPLOYMENT
#   INITIAL_NETWORK_TAG, TARGET_NETWORK_TAG
#   INITIAL_MIRROR_TAG, TARGET_MIRROR_TAG
#   INITIAL_RELAY_TAG, TARGET_RELAY_TAG
#   SOLO_VERSION — npm dist-tag or version for @hashgraph/solo
set -euo pipefail

DEPLOYMENT="${SOLO_DEPLOYMENT:?SOLO_DEPLOYMENT is required}"
INITIAL_NETWORK_TAG="${INITIAL_NETWORK_TAG:?}"
TARGET_NETWORK_TAG="${TARGET_NETWORK_TAG:?}"
INITIAL_MIRROR_TAG="${INITIAL_MIRROR_TAG:?}"
TARGET_MIRROR_TAG="${TARGET_MIRROR_TAG:?}"
INITIAL_RELAY_TAG="${INITIAL_RELAY_TAG:?}"
TARGET_RELAY_TAG="${TARGET_RELAY_TAG:?}"
SOLO_VERSION="${SOLO_VERSION:?SOLO_VERSION is required}"

normalize_version() {
  printf '%s' "$1" | sed 's/^v//'
}

if [[ "$(normalize_version "$INITIAL_NETWORK_TAG")" != "$(normalize_version "$TARGET_NETWORK_TAG")" ]]; then
  npx @hashgraph/solo@${SOLO_VERSION} consensus network upgrade \
    --deployment "$DEPLOYMENT" \
    --upgrade-version "$(normalize_version "$TARGET_NETWORK_TAG")" \
    --dev \
    --force
fi

if [[ "$(normalize_version "$INITIAL_MIRROR_TAG")" != "$(normalize_version "$TARGET_MIRROR_TAG")" ]]; then
  npx @hashgraph/solo@${SOLO_VERSION} mirror node upgrade \
    --deployment "$DEPLOYMENT" \
    --mirror-node-version "$TARGET_MIRROR_TAG" \
    --values-file .github/mirror-node-values.yaml \
    --enable-ingress \
    --pinger \
    --force-port-forward
fi

if [[ "$(normalize_version "$INITIAL_RELAY_TAG")" != "$(normalize_version "$TARGET_RELAY_TAG")" ]]; then
  npx @hashgraph/solo@${SOLO_VERSION} relay node upgrade \
    --deployment "$DEPLOYMENT" \
    --relay-release "$TARGET_RELAY_TAG" \
    --node-aliases "node1" \
    --values-file .github/relay-values.yaml \
    --force-port-forward
fi
