// SPDX-License-Identifier: Apache-2.0

module.exports = {
  info: function () {
    return new Promise(resolve => resolve({
      name: 'Hedera Testnet EVM',
      network: 'Hedera Testnet',
      chainId: 11155111,
      blockNumber: 100,
      blockTimestamp: 1600000000,
      softwareVersion: '0.1.0',
    }));
  },
  run: function (operations) {
    return new Promise(resolve => resolve(operations.map(
      operation => ({
        transactionId: 1,
        transactionHash: '0x1234567890',
        gasUsed: 100000,
        success: true,
        operation,
        additionalData: [],
      }),
    )));
  },
};
