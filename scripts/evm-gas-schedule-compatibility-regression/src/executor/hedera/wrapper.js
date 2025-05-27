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
        const { contractResult } = await this.mirrorNode.getContractResult(searchBy);
        if (contractResult) {
          if (!result.additionalData) result.additionalData = {};
          result.additionalData.gasConsumed = contractResult.gas_consumed;
          result.additionalData.inputData = contractResult.function_parameters;
          result.additionalData.contractCreated = (contractResult.created_contract_ids.length > 0);
          if (!result.transactionHash) result.transactionHash = contractResult.hash;
        }
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
