// SPDX-License-Identifier: Apache-2.0

const { ContractFunctionParameters, ContractId } = require('@hashgraph/sdk');
const hedera = require('../../client');
const { loadArtifact } = require('../../../../utils/artifact');

const artifact = loadArtifact('ContextShowcase');

const value = 100;

const initContractId = async function(client, cache) {
    let contractAddress = cache.read('context-showcase::contract');
    if (contractAddress === null) contractAddress = (await deploy(client, cache)).additionalData.contractAddress;
    return ContractId.fromEvmAddress(0, 0, contractAddress);
}

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, additionalData: {contractAddress: string}, transactionHash: string}>}
 */
const deploy = async function (client, cache) {
    const { status, gasUsed, contractId, transactionHash } =
        await hedera.deploy(client, artifact.bytecode);

    const contractAddress = contractId.toSolidityAddress();
    cache.write('context-showcase::contract', contractAddress);
    return {
        success: status,
        gasUsed,
        transactionHash: '',
        additionalData: { contractAddress, contractId, hederaTxId: `0x${transactionHash}` },
    };
};

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string, additionalData: {hederaTxId: string}}>}
 */
const precision = async function (client, cache) {
    const contractId = await initContractId(client, cache);
    const { status, gasUsed, transactionHash } = await hedera.call(
        client,
        contractId,
        'precision',
        new ContractFunctionParameters().addUint256(value),
        value,
    );

    return {
        success: status,
        gasUsed,
        transactionHash: '',
        additionalData: { hederaTxId: `0x${transactionHash}` },
    };
};

module.exports = { deploy, precision };
