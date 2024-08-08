require('dotenv').config();
const { ethers } = require('ethers');

/**  @type string */
const OPERATOR_ID_A = process.env.OPERATOR_ID_A
  ? process.env.OPERATOR_ID_A
  : '0.0.0';

/**  @type string */
const OPERATOR_KEY_A = process.env.OPERATOR_KEY_A
  ? process.env.OPERATOR_KEY_A
  : ethers.ZeroHash;

const PRIVATE_KEYS = process.env.PRIVATE_KEYS
  ? process.env.PRIVATE_KEYS.split(',').map((key) => key.trim())
  : [];

const NETWORKS = {
  local: {
    name: 'local',
    url: 'http://localhost:7546',
    chainId: 298,
    networkNodeUrl: '127.0.0.1:50211',
    nodeId: '3',
    mirrorNode: 'http://127.0.0.1:5600',
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
  besu: {
    name: 'besu_local',
    url: 'http://127.0.0.1:8540',
    chainId: 1337,
    allowUnlimitedContractSize: true,
    blockGasLimit: 0x1fffffffffffff,
    gas: 1_000_000_000,
    timeout: 60_000,
  },
};

module.exports = {
  OPERATOR_ID_A,
  OPERATOR_KEY_A,
  PRIVATE_KEYS,
  NETWORKS,
};
