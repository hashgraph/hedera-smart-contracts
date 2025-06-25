// SPDX-License-Identifier: Apache-2.0

const { ethers: { JsonRpcProvider, Wallet } } = require('ethers');
const dotenv = require('dotenv');
const { Cache } = require('../../cache');

dotenv.config();

const DEFAULT_GAS_LIMIT = 5000000;

class EvmExecutor {
  constructor(name) {
    const envVariablePrefix = name.split('::EVM')[0].split('::').join('_').toUpperCase();
    const getEnvVar = (variable) => {
      const value = process.env[`${envVariablePrefix}_${variable}`] || '';
      if (!value) throw new Error(`Missing environment variable: ${envVariablePrefix}_${variable}. It needs to be set in order for evm executor ${name} to work correctly`);
      return value;
    };
    const rpcUrl = getEnvVar('RPC_URL');
    const privateKey = getEnvVar('PRIVATE_KEY');
    if (!privateKey.startsWith('0x')) throw new Error(`Private key ${envVariablePrefix}_PRIVATE_KEY must start with 0x prefix`);
    try { new URL(rpcUrl); } catch (_) {  throw new Error(`RPC URL: ${envVariablePrefix}_RPC_URL must be a valid url.`); }

    this.provider = new JsonRpcProvider(rpcUrl);
    this.wallet = new Wallet(privateKey, this.provider);
    this.name = name;
    this.cache = new Cache(this.name.replace('::EVM', ''));
  }

  async info() {
    const { name, chainId }  = await this.provider.getNetwork();
    const block = await this.provider.getBlock('latest');
    return {
      name: 'EVM Executor',
      network: name,
      chainId: Number(chainId),
      blockNumber: await this.provider.getBlockNumber(),
      blockTimestamp: block ? Number(block.timestamp) : 0,
      softwareVersion: await this.provider.send('web3_clientVersion', []),
    };
  }

  async run(operations) {
    const results = [];
    for (const operation of operations) {
      try {
        const [type, action] = operation.split('::');
        let result = await require(`./action/${type}`)[action](this.wallet, this.cache);
        const receipt = await this.provider.getTransactionReceipt(result.transactionHash);
        const transaction = await this.provider.getTransaction(result.transactionHash);
        if (!result.additionalData) result.additionalData = {};
        result.additionalData.inputData = transaction.data;
        result.additionalData.contractCreated = (receipt.contractAddress != null);
        results.push(result);
      } catch (error) {
        results.push({ success: false, gasUsed: 0, error: error.shortMessage || (error instanceof Error ? error.message : String(error)) });
      }
    }

    return results;
  }
}

module.exports = {
  EvmExecutor
};
