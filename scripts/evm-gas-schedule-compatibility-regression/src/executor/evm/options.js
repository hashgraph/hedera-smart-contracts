// SPDX-License-Identifier: Apache-2.0

module.exports = {
  DEFAULT_GAS_LIMIT: 5000000,
  options: async function (wallet, gasLimit) {
    const feeData = await wallet.provider.getFeeData();
    const options = { gasLimit };
    if (feeData.maxFeePerGas) {
      options.maxFeePerGas = feeData.maxFeePerGas;
      options.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
    } else if (feeData.gasPrice) {
      options.gasPrice = feeData.gasPrice;
    }
    return options;
  }
};
