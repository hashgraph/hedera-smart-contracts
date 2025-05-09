const { ethers: { ContractFactory } } = require('ethers');
const { loadArtifact } = require('../../../utils/artifact');
const { options } = require('../options');

const artifact = loadArtifact('Counter');

module.exports = {
  /**
   * @param {import('ethers').Wallet|import('ethers').AbstractSigner} wallet
   * @param _
   * @returns {Promise<{gasUsed: (number|number), success: boolean, additionalData: {contractAddress: string}, transactionHash: string}>}
   */
  deploy: async function (wallet, _) {
    const contractFactory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const tx = await contractFactory.deploy(await options(wallet, 5000000));
    const contractAddress = await tx.getAddress();
    const receipt = await tx.deploymentTransaction().wait();
    if (!receipt) throw new Error('Failed to get transaction receipt');
    return {
      success: true,
      gasUsed: Number(receipt.gasUsed) || 0,
      transactionHash: receipt.hash,
      additionalData: { contractAddress },
    };
  },
};
