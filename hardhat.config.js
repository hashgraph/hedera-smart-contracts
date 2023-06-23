require("@nomicfoundation/hardhat-chai-matchers");
require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  mocha: {
    timeout: 3600000,
    color: true,
    failZero: Boolean(process.env.CI),
    forbidOnly: Boolean(process.env.CI),
    reporter: "mocha-multi-reporters",
    reporterOption: {
      "reporterEnabled": "spec, mocha-junit-reporter",
      "mochaJunitReporterReporterOptions": {
        mochaFile: "test-results.[hash].xml",
        "includePending": true,
        "outputs": true
      }
    }
  },
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 500,
      },
    },
  },
  defaultNetwork: "relay",
  networks: {
    relay: {
      url: "http://localhost:7546",
      accounts: [
        "0x2e1d968b041d84dd120a5860cee60cd83f9374ef527ca86996317ada3d0d03e7",
        "0x45a5a7108a18dd5013cf2d5857a28144beadc9c70b3bdbd914e38df4e804b8d8",
      ],
      chainId: 298,
      sdkClient: {
        operatorId: '0.0.2',
        operatorKey: '302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137',
        networkNodeUrl: '127.0.0.1:50211',
        nodeId: '3',
        mirrorNode: '127.0.0.1:5600'
      }
    },
    testnet: {
      url: "https://testnet.hashio.io/api",
      accounts: [
        "0x2e1d968b041d84dd120a5860cee60cd83f9374e0000000000000000000000000", //Add valid account for testnet
        "0x45a5a7108a18dd5013cf2d5857a28144beadc9c0000000000000000000000000", //Add valid account for testnet
      ],
      chainId: 296,
      sdkClient: {
        operatorId: '', //Format 0.0.ID
        operatorKey: '302e...',
        networkNodeUrl: 'https://testnet.hedera.com',
        nodeId: '3',
        mirrorNode: 'https://testnet.mirrornode.hedera.com'
      }
    },
    previewnet: {
      url: "https://previewnet.hashio.io/api",
      accounts: [
        "0x2e1d968b041d84dd120a5860cee60cd83f9374e0000000000000000000000000", //Add valid account for previewnet
        "0x45a5a7108a18dd5013cf2d5857a28144beadc9c0000000000000000000000000", //Add valid account for previewnet
      ],
      chainId: 297,
      sdkClient: {
        operatorId: '', //Format 0.0.ID
        operatorKey: '302e...',
        networkNodeUrl: 'https://previewnet.hedera.com',
        nodeId: '3',
        mirrorNode: 'https://previewnet.mirrornode.hedera.com'
      }
    },
  }
};
