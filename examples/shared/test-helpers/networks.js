// SPDX-License-Identifier: Apache-2.0

// Hardhat network definitions shared by the examples. Values come from the example's .env
// (see .env.example); the `local` network points at the ports forwarded by
// `solo one-shot falcon deploy`.

require('dotenv').config({ quiet: true });

/**  @type string */
const OPERATOR_ID_A = process.env.OPERATOR_ID_A || '0.0.0';

/**  @type string */
const OPERATOR_KEY_A =
  process.env.OPERATOR_KEY_A ||
  '0x0000000000000000000000000000000000000000000000000000000000000000';

const PRIVATE_KEYS = process.env.PRIVATE_KEYS
  ? process.env.PRIVATE_KEYS.split(',')
      .map((key) => key.replace(/"/g, '').trim())
      .filter(Boolean)
  : [];

// Consensus node of the local network, e.g. HEDERA_NETWORK={"127.0.0.1:50211":"0.0.3"}.
const [LOCAL_NETWORK_NODE_URL, LOCAL_NODE_ACCOUNT_ID] = Object.entries(
  JSON.parse(process.env.HEDERA_NETWORK || '{"127.0.0.1:35211":"0.0.3"}'),
)[0];

const NETWORKS = {
  local: {
    name: 'local',
    url: process.env.RELAY_ENDPOINT || 'http://127.0.0.1:37546',
    chainId: 298,
    networkNodeUrl: LOCAL_NETWORK_NODE_URL,
    nodeId: LOCAL_NODE_ACCOUNT_ID.split('.').pop(),
    mirrorNode: process.env.MIRROR_NODE_URL || 'http://127.0.0.1:38081',
  },
  testnet: {
    name: 'testnet',
    url: 'https://testnet.hashio.io/api',
    chainId: 296,
    networkNodeUrl: '0.testnet.hedera.com:50211', // https://docs.hedera.com/hedera/networks/testnet/testnet-nodes
    nodeId: '3',
    mirrorNode: 'testnet.mirrornode.hedera.com:443', // https://docs.hedera.com/hedera/core-concepts/mirror-nodes/hedera-mirror-node#testnet
  },
  previewnet: {
    name: 'previewnet',
    url: 'https://previewnet.hashio.io/api',
    chainId: 297,
    networkNodeUrl: '0.previewnet.hedera.com:50211', // https://docs.hedera.com/hedera/networks/testnet/testnet-nodes#preview-testnet-nodes
    nodeId: '3',
    mirrorNode: 'previewnet.mirrornode.hedera.com:443', // https://docs.hedera.com/hedera/core-concepts/mirror-nodes/hedera-mirror-node#previewnet
  },
};

/**
 * Hardhat `networks` config for the Hedera networks above. Each one carries an `sdkClient`
 * block that the Hedera SDK based helpers (hedera-token-service.js) use to build a client.
 */
const hardhatNetworks = Object.fromEntries(
  Object.values(NETWORKS).map((network) => [
    network.name,
    {
      url: network.url,
      accounts: PRIVATE_KEYS,
      chainId: network.chainId,
      // Contract creations with large bytecode go through several HAPI file transactions
      // in the relay and can take longer than Hardhat's 20s default.
      timeout: 120000,
      sdkClient: {
        operatorId: OPERATOR_ID_A,
        operatorKey: OPERATOR_KEY_A,
        networkNodeUrl: network.networkNodeUrl,
        nodeId: network.nodeId,
        mirrorNode: network.mirrorNode,
      },
    },
  ])
);

const getMirrorNodeUrl = (network) => {
  switch (network) {
    case 'mainnet':
      return 'https://mainnet.mirrornode.hedera.com/api/v1';
    case 'testnet':
      return 'https://testnet.mirrornode.hedera.com/api/v1';
    case 'previewnet':
      return 'https://previewnet.mirrornode.hedera.com/api/v1';
    case 'local':
      return `${process.env.MIRROR_NODE_URL || 'http://127.0.0.1:38081'}/api/v1`;
    default:
      throw new Error('Unknown network');
  }
};

module.exports = {
  OPERATOR_ID_A,
  OPERATOR_KEY_A,
  PRIVATE_KEYS,
  NETWORKS,
  hardhatNetworks,
  getMirrorNodeUrl,
};
