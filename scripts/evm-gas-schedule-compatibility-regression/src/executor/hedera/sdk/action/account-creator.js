// SPDX-License-Identifier: Apache-2.0

const { ContractFunctionParameters, ContractId, Hbar, AccountId, AccountInfoQuery, ContractInfoQuery} = require('@hashgraph/sdk');
const { Wallet } = require('ethers');
const hedera = require('../../client');
const { loadArtifact } = require('../../../../utils/artifact');

const artifact = loadArtifact('AccountCreator');

const initContractId = async function(client, cache) {
    let contractAddress = cache.read('account-creator::contract');
    if (contractAddress === null) contractAddress = (await deploy(client, cache)).additionalData.contractAddress;
    return ContractId.fromEvmAddress(0, 0, contractAddress);
}

/**
 * @param {string} address
 * @param {import('@hashgraph/sdk').Client} client
 * @returns {Promise<boolean>}
 */
async function isNonExistingAccount(address, client) {
    try {
        const accountId = AccountId.fromEvmAddress(0, 0, address);
        await new AccountInfoQuery().setAccountId(accountId).execute(client);
    } catch (e) {
        try {
            const contractId = ContractId.fromEvmAddress(0, 0, address);
            await new ContractInfoQuery().setContractId(contractId).execute(client);
        } catch (e) {
            return true;
        }
    }
    return false;
}

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @returns {Promise<string>}
 */
const getNonExistentAddress = async function(client) {
    for (let i = 0; i < 50; i++) {
        const address = Wallet.createRandom().address;
        if (await isNonExistingAccount(address, client)) return address;
    }
    throw new Error('Could not find a non-existent address');
}

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, additionalData: {contractAddress: string}, transactionHash: string}>}
 */
const deploy = async function (client, cache) {
    const { status, gasUsed, contractId, transactionHash } =
        await hedera.deploy(client, artifact.bytecode, new ContractFunctionParameters(), Hbar.fromTinybars(10));

    const contractAddress = contractId.toSolidityAddress();
    cache.write('account-creator::contract', contractAddress);
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
const send = async function (client, cache) {
    const contractId = await initContractId(client, cache);
    const { status, gasUsed, transactionHash } = await hedera.call(
        client,
        contractId,
        'send',
        new ContractFunctionParameters().addAddress(await getNonExistentAddress(client))
    );

    return {
        success: status,
        gasUsed,
        transactionHash: '',
        additionalData: { hederaTxId: `0x${transactionHash}` },
    };
};

module.exports = { deploy, send };
