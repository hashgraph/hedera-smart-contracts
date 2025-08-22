// SPDX-License-Identifier: Apache-2.0

const { ethers: { ContractFactory, Contract }} = require('ethers');
const { getNonExistentAddress } = require('../../../utils/address');
const { loadArtifact } = require('../../../utils/artifact');
const { options, DEFAULT_GAS_LIMIT } = require('../options');

const artifact = loadArtifact('AccountCreator');

/**
 * @param {string} address
 * @param {Wallet} wallet
 * @returns {import('ethers').BaseContract | {
 *   send: (address: string, any) => Promise<import('ethers').TransactionResponse>
 * }}
 */
const getContract = function (address, wallet) {
    return new Contract(address, artifact.abi, wallet);
}

/**
 * @param {import('ethers').Wallet|import('ethers').AbstractSigner} wallet
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, additionalData: {contractAddress: string}, transactionHash: string}>}
 */
const deploy = async function (wallet, cache) {
    const contractFactory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);
    const tx = await contractFactory.deploy({...await options(wallet, DEFAULT_GAS_LIMIT), value: 100000000000});
    const contractAddress = await tx.getAddress();
    const receipt = await tx.deploymentTransaction().wait();
    if (!receipt) throw new Error('Failed to get transaction receipt');
    cache.write('account-creator::contract', contractAddress);
    return {
        success: true,
        gasUsed: Number(receipt.gasUsed) || 0,
        transactionHash: receipt.hash,
        additionalData: { contractAddress },
    };
};

/**
 * @param {import('ethers').Wallet|import('ethers').AbstractSigner} wallet
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string}>}
 */
const send = async function (wallet, cache) {
    let contractAddress = cache.read('account-creator::contract');
    if (contractAddress === null) contractAddress = (await deploy(wallet, cache)).additionalData.contractAddress;
    const contract = getContract(contractAddress, wallet);
    const nonExistentAddress = await getNonExistentAddress(wallet.provider);
    const tx = await contract.send(nonExistentAddress, await options(wallet, DEFAULT_GAS_LIMIT));
    const receipt = await tx.wait();
    if (!receipt) throw new Error('Failed to get transaction receipt');
    return {
        success: true,
        gasUsed: Number(receipt.gasUsed) || 0,
        transactionHash: receipt.hash,
    };
}

module.exports = { deploy, send };
