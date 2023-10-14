require('@nomicfoundation/hardhat-chai-matchers')
require('@nomiclabs/hardhat-ethers')
require('@openzeppelin/hardhat-upgrades')
require('@nomicfoundation/hardhat-foundry');
const {
  OPERATOR_ID_A,
  OPERATOR_KEY_A,
  HEX_PRIVATE_KEY_A,
  HEX_PRIVATE_KEY_B,
  NETWORKS,
} = require('./utils/constants')

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  mocha: {
    timeout: 3600000,
    color: true,
    failZero: Boolean(process.env.CI),
    forbidOnly: Boolean(process.env.CI),
    reporter: 'mocha-multi-reporters',
    reporterOption: {
      reporterEnabled: 'spec, mocha-junit-reporter',
      mochaJunitReporterReporterOptions: {
        mochaFile: 'test-results.[hash].xml',
        includePending: true,
        outputs: true,
      },
    },
  },
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 500,
      },
    },
  },
  defaultNetwork: NETWORKS.local.name,
  networks: {
    local: {
      url: NETWORKS.local.url,
      accounts: [HEX_PRIVATE_KEY_A, HEX_PRIVATE_KEY_B],
      chainId: NETWORKS.local.chainId,
      gas: 10000000,
      sdkClient: {
        operatorId: OPERATOR_ID_A,
        operatorKey: OPERATOR_KEY_A,
        networkNodeUrl: NETWORKS.local.networkNodeUrl,
        nodeId: NETWORKS.local.nodeId,
        mirrorNode: NETWORKS.local.mirrorNode,
      },
    },
    testnet: {
      url: NETWORKS.testnet.url,
      accounts: [HEX_PRIVATE_KEY_A, HEX_PRIVATE_KEY_B],
      chainId: NETWORKS.testnet.chainId,
      sdkClient: {
        operatorId: OPERATOR_ID_A,
        operatorKey: OPERATOR_KEY_A,
        networkNodeUrl: NETWORKS.testnet.networkNodeUrl,
        nodeId: NETWORKS.testnet.nodeId,
        mirrorNode: NETWORKS.testnet.mirrorNode,
      },
    },
    previewnet: {
      url: NETWORKS.previewnet.url,
      accounts: [HEX_PRIVATE_KEY_A, HEX_PRIVATE_KEY_B],
      chainId: NETWORKS.previewnet.chainId,
      sdkClient: {
        operatorId: OPERATOR_ID_A,
        operatorKey: OPERATOR_KEY_A,
        networkNodeUrl: NETWORKS.previewnet.networkNodeUrl,
        nodeId: NETWORKS.previewnet.nodeId,
        mirrorNode: NETWORKS.previewnet.mirrorNode,
      },
    },
  },
}

