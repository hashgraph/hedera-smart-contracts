// SPDX-License-Identifier: Apache-2.0

const { Client, PrivateKey, AccountId } = require('@hashgraph/sdk');
const dotenv = require('dotenv');
const { JsonRpcProvider, Wallet } = require('ethers');
const { Cache } = require('../../cache');

dotenv.config();

function getChainIdFromMirrorUrl(mirrorUrl) {
  if (mirrorUrl.includes('mainnet')) return 295;
  if (mirrorUrl.includes('testnet')) return 296;
  if (mirrorUrl.includes('previewnet')) return 297;
  return 0; // Unknown or custom network
}

class HederaSdkExecutor {
  constructor(name) {
    const envVariablePrefix = `${name.split('::')[0]}_${name.split('::')[1]}`.toUpperCase();
    const getEnvVar = (variable) => process.env[`${envVariablePrefix}_${variable}`] || '';
    const requiredTxt = (msg) => `Missing environment variable: ${envVariablePrefix}_${msg}. It needs to be set in order for executor ${name} to work correctly`;
    const operatorPrivateKey = PrivateKey.fromStringECDSA(getEnvVar('PRIVATE_KEY'));
    const operatorId = AccountId.fromString(getEnvVar('ACCOUNT_ID'));
    if (!operatorId) throw new Error(requiredTxt('ACCOUNT_ID'));
    if (!operatorPrivateKey) throw new Error(requiredTxt('PRIVATE_KEY'));
    const getGrpcConfig = () => {
      const grpcUrl = getEnvVar('GRPC_URL');
      if (!grpcUrl) throw new Error(requiredTxt('GRPC_URL'));
      let result = {};
      result[grpcUrl] = getEnvVar('NODE_ACCOUNT') || '0.0.3';
      return result;
    };
    const networkClient = {
      mainnet: () => Client.forMainnet(),
      testnet: () => Client.forTestnet(),
      previewnet: () => Client.forPreviewnet(),
      custom: () => Client.forNetwork(getGrpcConfig()),
    }[name.split('::')[1].toLowerCase()] || null;
    if (networkClient === null) throw new Error(`Unknown hedera network: ${name.split('::')[1]}`);
    this.client = networkClient().setOperator(operatorId, operatorPrivateKey);
    this.cache = new Cache(name);
    this.network = name.split('::')[1].toLowerCase();
  }

  async info(mirrorNode) {
    return {
      name: 'Hedera SDK Executor',
      network: `Hedera ${this.network}`,
      chainId: getChainIdFromMirrorUrl(mirrorNode.url),
      ...(await mirrorNode.getLatestBlock())
    };
  }

  async run(operations) {
    const results = [];
    for (const operation of operations) {
      const [type, action] = operation.split('::');
      results.push(await this.process(type, action));
    }

    return results;
  }

  async process(type, action) {
    return await require(`./sdk/action/${type}`)[action](this.client, this.cache);
  }
}

class HederaSdkEthTxExecutor extends HederaSdkExecutor {
  constructor(name) {
    super(name);
    const envVariablePrefix = `${name.split('::')[0]}_${name.split('::')[1]}`.toUpperCase();
    const getEnvVar = (variable) => {
      const value = process.env[`${envVariablePrefix}_${variable}`] || '';
      if (!value) throw new Error(`Missing environment variable: ${envVariablePrefix}_${variable}. It needs to be set in order for executor ${name} to work correctly`);
      return value;
    };
    const privateKey = getEnvVar('PRIVATE_KEY');
    const rpcUrl = getEnvVar('RPC_URL');
    if (!privateKey.startsWith('0x')) throw new Error(`Private key ${envVariablePrefix}_PRIVATE_KEY must start with 0x prefix`);
    try { new URL(rpcUrl); } catch (_) {  throw new Error(`RPC URL: ${envVariablePrefix}_RPC_URL must be a valid url.`); }
    this.provider = new JsonRpcProvider(rpcUrl);
    this.wallet = new Wallet(privateKey, this.provider);
    this.cache = new Cache(name.split('::')[0] + '::' + name.split('::')[1]);
  }

  async process(type, action) {
    return await require(`./sdk-ethtx/action/${type}`)[action](this.client, this.wallet, this.cache);
  }
}

module.exports = {
  HederaSdkExecutor,
  HederaSdkEthTxExecutor
};
