const { ethers: { JsonRpcProvider, Wallet } } = require('ethers');
const dotenv = require('dotenv');
const { Cache } = require("../../cache");
const {HederaMirrorNode} = require("../hedera/mirrornode");

dotenv.config();

class EvmExecutor {
  constructor(name) {
    const envVariablePrefix = name.split('::EVM')[0].split('::').join('_').toUpperCase();
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
        results.push(await require(`./action/${type}`)[action](this.wallet, this.cache));
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
