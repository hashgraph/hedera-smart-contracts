// SPDX-License-Identifier: Apache-2.0

const { ethers: { ContractFactory, Wallet, Contract } } = require('ethers');
const hedera = require('../../client');
const { loadArtifact } = require('../../../../utils/artifact');
const { options, DEFAULT_GAS_LIMIT} = require('../../../evm/options');

const artifact = loadArtifact('ContextShowcase');

const value = 10**10;

/**
 * @param {string} address
 * @param {Wallet} wallet
 * @returns {import('ethers').BaseContract | {
 *   transfer: (string, BigInt, any) => Promise<import('ethers').TransactionResponse>,
 *   balanceOf: (string) => Promise<number>,
 * }}
 */
const getContract = function (address, wallet) {
    return new Contract(address, artifact.abi, wallet);
}

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {import('ethers').Wallet} wallet
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, additionalData: {contractAddress: string}, transactionHash: string}>}
 */
const deploy = async function (client, wallet, cache) {
    const contractFactory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const tx = await contractFactory.getDeployTransaction(await options(wallet, DEFAULT_GAS_LIMIT));
    const { status, gasUsed, evmAddress, contractId, transactionHash } = await hedera.forward(
        client,
        client.getOperator().accountId,
        wallet,
        { ...tx, to: null, type: 2, accessList: [] }
    );
    const contractAddress = evmAddress || contractId.toSolidityAddress();
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
 * @param {import('ethers').Wallet} wallet
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string, additionalData: { hederaTxId: string }}>}
 */
const precision = async function (client, wallet, cache) {
    let contractAddress = cache.read('context-showcase::contract');
    if (contractAddress === null) contractAddress = (await deploy(client, wallet, cache)).additionalData.contractAddress;
    const contract = getContract(contractAddress, wallet);
    const txData = contract.interface.encodeFunctionData('precision(uint256)', [value]);
    const tx = {
        ...(await options(wallet, DEFAULT_GAS_LIMIT)),
        to: contractAddress,
        data: txData,
        value,
    };
    const { status, gasUsed, contractId, transactionHash } = await hedera.forward(
        client,
        client.getOperator().accountId,
        wallet,
        { ...tx, type: 2, accessList: [] }
    );
    return {
        success: status,
        gasUsed,
        transactionHash: '',
        additionalData: { contractAddress, contractId, hederaTxId: `0x${transactionHash}` },
    };
};

module.exports = { deploy, precision };
