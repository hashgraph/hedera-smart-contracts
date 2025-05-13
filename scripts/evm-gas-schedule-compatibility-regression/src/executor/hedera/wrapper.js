// SPDX-License-Identifier: Apache-2.0

class HederaExecutorsWrapper {
  constructor(decorated, mirrorNode) {
    this.decorated = decorated;
    this.mirrorNode = mirrorNode;
  }

  async run(operations) {
    const results = await this.decorated.run(operations);
    if (!this.mirrorNode) return results;
    for (const result of results) {
      let searchBy = result.transactionHash;
      if (!result.transactionHash && result.additionalData?.hederaTxId) {
        searchBy = await this.mirrorNode.getEvmAddressOfTheTransaction(result.additionalData?.hederaTxId);
      }
      if (searchBy) {
        const { gasConsumed, hash } = await this.mirrorNode.getGasConsumedOnTransaction(searchBy);
        if (!result.additionalData) result.additionalData = {};
        if (gasConsumed) result.additionalData.gasConsumed = gasConsumed;
        if (!result.transactionHash && hash) result.transactionHash = hash;
      }
    }
    return results;
  }

  async info() {
    return this.decorated.info(this.mirrorNode);
  }
}

module.exports = {
  HederaExecutorsWrapper
};
