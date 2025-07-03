// SPDX-License-Identifier: Apache-2.0

const { ContractFunctionParameters, ContractId } = require('@hashgraph/sdk');
const hedera = require('../../client');
const { loadArtifact } = require('../../../../utils/artifact');

const factoryArtifact = loadArtifact('Factory');
const counterArtifact = loadArtifact('Counter');

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, additionalData: {contractAddress: string}, transactionHash: string}>}
 */
const initFactory = async function (client, cache) {
    const { status, gasUsed, contractId, transactionHash } =
      await hedera.deploy(client, factoryArtifact.bytecode, new ContractFunctionParameters());
    const contractAddress = contractId.toSolidityAddress();
    cache.write('create-via-factory::contract', contractAddress);
    return {
        success: status,
        gasUsed,
        transactionHash: '',
        additionalData: { contractAddress, contractId, hederaTxId: `0x${transactionHash}` },
    };
}

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string}>}
 */
const deploy = async function (client, cache) {
    let contractAddress = cache.read('create-via-factory::contract');
    if (contractAddress === null) contractAddress = (await initFactory(client, cache)).additionalData.contractAddress;
    const contractId = ContractId.fromEvmAddress(0, 0, contractAddress);
    const { status, gasUsed, transactionHash } = await hedera.call(
      client,
      contractId,
      'deploy',
      new ContractFunctionParameters()
        .addBytes(Uint8Array.from(Buffer.from(counterArtifact.bytecode.substring(2), 'hex')))
    );
    return {
        success: status,
        gasUsed,
        transactionHash: '',
        additionalData: { hederaTxId: `0x${transactionHash}` },
    };
}

module.exports = {
    deploy
};
