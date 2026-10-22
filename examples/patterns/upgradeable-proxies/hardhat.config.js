// SPDX-License-Identifier: Apache-2.0

require('@nomicfoundation/hardhat-chai-matchers');
require('@openzeppelin/hardhat-upgrades');
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
    // Fail a hanging test (e.g. a transaction that never gets a receipt) instead of the CI job.
    timeout: 600000,
  },
};
