/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2022-2024 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

require('hardhat-abi-exporter');
require('@openzeppelin/hardhat-upgrades');
require('@nomicfoundation/hardhat-foundry');
require('@nomicfoundation/hardhat-chai-matchers');

const {
  OPERATOR_ID_A,
  OPERATOR_KEY_A,
  NETWORKS,
  PRIVATE_KEYS,
} = require('./utils/constants');

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
    version: '0.8.23',
    settings: {
      optimizer: {
        enabled: true,
        runs: 500,
      },
    },
  },
  abiExporter: {
    path: './contracts-abi',
    runOnCompile: true,
  },
  defaultNetwork: NETWORKS.local.name,
  networks: {
    local: {
      url: NETWORKS.local.url,
      accounts: PRIVATE_KEYS,
      chainId: NETWORKS.local.chainId,
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
      accounts: PRIVATE_KEYS,
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
      accounts: PRIVATE_KEYS,
      chainId: NETWORKS.previewnet.chainId,
      sdkClient: {
        operatorId: OPERATOR_ID_A,
        operatorKey: OPERATOR_KEY_A,
        networkNodeUrl: NETWORKS.previewnet.networkNodeUrl,
        nodeId: NETWORKS.previewnet.nodeId,
        mirrorNode: NETWORKS.previewnet.mirrorNode,
      },
    },
    // besu local node
    besu_local: {
      url: NETWORKS.besu.url,
      allowUnlimitedContractSize: NETWORKS.besu.allowUnlimitedContractSize,
      blockGasLimit: NETWORKS.besu.blockGasLimit,
      gas: NETWORKS.besu.gas,
      timeout: NETWORKS.besu.timeout,
      chainId: NETWORKS.besu.chainId,
      accounts: [
        // private keys are configured in the genesis file https://github.com/hyperledger/besu/blob/main/config/src/main/resources/dev.json#L20
        // private key for 0xf17f52151EbEF6C7334FAD080c5704D77216b732
        'ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f',
        // private key for 0x627306090abaB3A6e1400e9345bC60c78a8BEf57
        'c87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
      ],
    },
  },
};
