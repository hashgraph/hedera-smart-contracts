// SPDX-License-Identifier: Apache-2.0

require('@nomicfoundation/hardhat-chai-matchers');
const { hardhatNetworks } = require('hedera-examples-test-helpers/networks');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.24',
    settings: {
      optimizer: {
        enabled: true,
        runs: 500,
      },
      evmVersion: 'cancun',
    },
  },
  // `local` is a Solo network (see .env.example); use --network testnet|previewnet for public networks.
  defaultNetwork: 'local',
  networks: hardhatNetworks,
  mocha: {
    timeout: 3600000,
  },
};
