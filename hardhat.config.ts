import 'dotenv/config';
import type { HardhatUserConfig } from 'hardhat/types/config';
import hardhatMocha from '@nomicfoundation/hardhat-mocha';
import hardhatAbiExporter from '@solidstate/hardhat-abi-exporter';

/**  @type string */
const OPERATOR_ID_A: string = process.env.OPERATOR_ID_A ?? '0.0.0';
/**  @type string */
const OPERATOR_KEY_A: string =
  process.env.OPERATOR_KEY_A ??
  '0x0000000000000000000000000000000000000000000000000000000000000000';

const PRIVATE_KEYS: string[] = process.env.PRIVATE_KEYS
  ? process.env.PRIVATE_KEYS.split(',')
      .map((k) => k.trim())
      .filter(Boolean)
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
} as const;

const config: HardhatUserConfig = {
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
  networks: {
    local: {
      type: 'http',
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
    } as any,
    testnet: {
      type: 'http',
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
    } as any,
    previewnet: {
      type: 'http',
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
    } as any,
    besu_local: {
      type: 'http',
      url: NETWORKS.besu.url,
      allowUnlimitedContractSize: NETWORKS.besu
        .allowUnlimitedContractSize as any,
      blockGasLimit: NETWORKS.besu.blockGasLimit as any,
      gas: NETWORKS.besu.gas,
      timeout: NETWORKS.besu.timeout,
      chainId: NETWORKS.besu.chainId,
      accounts: [
        '0xae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f',
        '0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3',
        '0x8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63',
      ],
    } as any,
  },
  abiExporter: {
    path: './contracts-abi',
    runOnCompile: true,
  },
  test: {
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
  },
};

export default {
  plugins: [hardhatMocha, hardhatAbiExporter],
  ...config,
};
