#!/bin/bash
set -e

echo "solo falcon destroy (ignore errors if nothing is running)"
npx @hashgraph/solo falcon destroy || true
sleep 5

echo "starting Hiero Solo one-shot falcon deploy (consensus node, mirror node and JSON-RPC relay)"
npx @hashgraph/solo one-shot falcon deploy --dev --deploy-explorer=false

echo "hardhat prepare"
npx hardhat prepare
sleep 1

echo "graph-local-clean"
npm run graph-local-clean
sleep 1

echo "graph-local"
npm run graph-local -- --detach
sleep 10

echo "create-local"
npm run create-local
sleep 1

echo "deploy-local"
npm run deploy-local -- --network local

# Note: The Solo one-shot process will terminate when this script ends, tearing down the local network.
# If you need to keep the network running after this script, start Solo in your shell and run steps manually.
