// SPDX-License-Identifier: Apache-2.0

const { ContractFactory } = require('ethers');
const hedera = require('../../client');
const { loadArtifact } = require('../../../../utils/artifact');
const { options } = require('../../../evm/options');

const artifact = loadArtifact('Counter');

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {import('ethers').Wallet} wallet
 * @param {Cache} _
 * @returns {Promise<{gasUsed: (number|number), success: boolean, additionalData: {contractAddress: string}, transactionHash: string}>}
 */
const deploy = async function (client, wallet, _) {
  const contractFactory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const tx = await contractFactory.getDeployTransaction(await options(wallet, 5000000));
  const { status, gasUsed, contractId, transactionHash } = await hedera.forward(
    client,
    client.getOperator().accountId,
    wallet,
    { ...tx, to: null, type: 2, accessList: [] }
  );
  const contractAddress = contractId.toSolidityAddress();
  return {
    success: status,
    gasUsed,
    transactionHash: '',
    additionalData: { contractAddress, contractId, hederaTxId: `0x${transactionHash}` },
  };
};

module.exports = { deploy };
