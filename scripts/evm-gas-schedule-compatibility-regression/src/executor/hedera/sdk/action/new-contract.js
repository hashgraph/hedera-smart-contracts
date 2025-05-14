// SPDX-License-Identifier: Apache-2.0

const { ContractFunctionParameters } = require('@hashgraph/sdk');
const { loadArtifact } = require('../../../../utils/artifact');
const hedera = require('../../client');

const artifact = loadArtifact('Counter');

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {import('ethers').Wallet} wallet
 * @param {Cache} _
 * @returns {Promise<{gasUsed: (number|number), success: boolean, additionalData: {contractAddress: string}, transactionHash: string}>}
 */
const deploy = async function (client, wallet, _) {
  const { status, gasUsed, contractId, transactionHash } =
    await hedera.deploy(client, artifact.bytecode, new ContractFunctionParameters());
  const contractAddress = contractId.toSolidityAddress();
  return {
    success: status,
    gasUsed,
    transactionHash: '',
    additionalData: { contractAddress, contractId, hederaTxId: `0x${transactionHash}` },
  };
};

module.exports = { deploy };
