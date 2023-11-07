require('dotenv').config()
const { ethers } = require('ethers')

/**  @type string */
const OPERATOR_ID_A = process.env.OPERATOR_ID_A
  ? process.env.OPERATOR_ID_A
  : '0.0.0'
/**  @type string */
const OPERATOR_KEY_A = process.env.OPERATOR_KEY_A
  ? process.env.OPERATOR_KEY_A
  : ethers.constants.HashZero

const PRIVATE_KEYS = process.env.PRIVATE_KEYS
  ? process.env.PRIVATE_KEYS.split(',').map(key => key.trim())
  : [];

while (PRIVATE_KEYS.length < 6) {
  PRIVATE_KEYS.push(ethers.constants.HashZero);
}

const NETWORKS = {
  local: {
    name: 'local',
    url: 'http://localhost:7546',
    chainId: 298,
    networkNodeUrl: '127.0.0.1:50211',
    nodeId: '3',
    mirrorNode: '127.0.0.1:5600',
  },
  testnet: {
    name: 'testnet',
    url: 'https://testnet.hashio.io/api',
    chainId: 296,
    networkNodeUrl: 'https://testnet.hedera.com',
    nodeId: '3',
    mirrorNode: 'https://testnet.mirrornode.hedera.com',
  },
  previewnet: {
    name: 'previewnet',
    url: 'https://previewnet.hashio.io/api',
    chainId: 297,
    networkNodeUrl: 'https://previewnet.hedera.com',
    nodeId: '3',
    mirrorNode: 'https://previewnet.mirrornode.hedera.com',
  },
}

module.exports = {
  OPERATOR_ID_A,
  OPERATOR_KEY_A,
  PRIVATE_KEYS,
  NETWORKS,
}
