// SPDX-License-Identifier: Apache-2.0

const axios = require('axios');

/**
 * @param {number} ms
 * @returns {Promise<unknown>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @param {string} name
 * @returns {HederaMirrorNode|null}
 */
function create(name) {
  if (name.split('::').length !== 3) throw new Error('For Hedera executor naming convention Hedera::{Network}::{Type} is required, for example: Hedera::Mainnet::SDK');
  const [_, network, type] = name.toUpperCase().split('::');
  if (!['EVM', 'SDK', 'SDK-ETHTX'].includes(type)) throw new Error('For hedera only SDK, EVM and SDK-ETHTX executors are supported');
  const mirrorNodeUrl = network === 'CUSTOM'
    ? process.env.HEDERA_CUSTOM_MIRRORNODE_URL || ''
    : `https://${network}.mirrornode.hedera.com/api/v1`;
  return mirrorNodeUrl ? new HederaMirrorNode(mirrorNodeUrl) : null;
}

class HederaMirrorNode {
  /**
   * @param {string} url
   */
  constructor(url) {
    this.url = url;
  }

  /**
   * @returns {Promise<{blockNumber, blockTimestamp: number, softwareVersion: string}>}
   */
  async getLatestBlock() {
    const blockRes = /** @type {{data: { blocks: { hapi_version: string, timestamp: { from: string } }[] }}} */ await axios.get(`${this.url}/blocks?limit=1&order=desc`);
    const latestBlock = blockRes.data.blocks[0] || { timestamp: { from: '', hapi_version: '', number: 0 } };
    return {
      blockNumber: latestBlock.number,
      blockTimestamp: Number(latestBlock.timestamp.from.split('.')[0]),
      softwareVersion: `HAPI ${latestBlock.hapi_version}`,
    };
  }

  /**
   * @param {string} hederaTxId
   * @param {number} attempt
   * @returns {Promise<string>}
   */
  async getEvmAddressOfTheTransaction(hederaTxId, attempt = 0) {
    try {
      const tx = /** @type {{data: { transactions: { transaction_id: string }[] }}} */ await axios.get(`${this.url}/transactions/${hederaTxId}`);
      if (tx.data.transactions.length > 0 || !tx.data.transactions[0]?.transaction_id) {
        return tx.data.transactions[0].transaction_id;
      }
    } catch (error) {
      // Ignore...
    }
    if (attempt > 10) return '';
    await delay(2000);
    return await this.getEvmAddressOfTheTransaction(hederaTxId, attempt + 1);
  }

  /**
   * @param {string} evmHash
   * @param {number} attempt
   * @returns {Promise<{ contractResult }>}
   */
  async getContractResult(evmHash, attempt = 0) {
    try {
      const result = /** @type {{data: { gas_consumed: number|undefined, hash: string|undefined }}} */ await axios.get(`${this.url}/contracts/results/${evmHash}`);
      if (result.data) return { contractResult: result.data };
    } catch (error) {
      // ignore
    }
    if (attempt > 10) return { contractResult: undefined };
    await delay(2000);
    return await this.getContractResult(evmHash, attempt + 1);
  }
}
module.exports = { create };
