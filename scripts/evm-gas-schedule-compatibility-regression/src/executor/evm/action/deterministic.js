// SPDX-License-Identifier: Apache-2.0

const { ethers: { ContractFactory, Wallet, Contract } } = require('ethers');
const { loadArtifact } = require('../../../utils/artifact');
const { options } = require('../options');

const factoryArtifact = loadArtifact('Factory');
const counterArtifact = loadArtifact('Counter');

/**
 * @param {string} address
 * @param {Wallet} wallet
 * @returns {import('ethers').BaseContract | {
 *    getPredictedAddress: (string, number) => Promise<string>,
 *    deploy2: (string, number) => Promise<import('ethers').TransactionResponse>,
 * }}
 */
const getFactoryContract = function (address, wallet) {
    return new Contract(address, factoryArtifact.abi, wallet);
}

/**
 * @param {import('ethers').Wallet|import('ethers').AbstractSigner} wallet
 * @param {object} cache
 * @returns {Promise<{gasUsed: number, success: boolean, additionalData: object, transactionHash: string}>}
 */
async function deploy(wallet, cache) {
    let factoryAddress = cache.read('evm::factory');
    let factory;
    if (!factoryAddress) {
        const contractFactory = new ContractFactory(factoryArtifact.abi, factoryArtifact.bytecode, wallet);
        const factoryContract = await contractFactory.deploy(await options(wallet, 5000000));
        await factoryContract.deploymentTransaction().wait();
        factoryAddress = await factoryContract.getAddress();
        cache.write('evm::factory', factoryAddress);
        factory = factoryContract;
    } else {
        factory = getFactoryContract(factoryAddress, wallet);
    }

    const salt = Math.floor(Math.random() * (9999999999 - 1000000000 + 1)) + 1000000000;

    const computedAddress = await factory.getPredictedAddress(counterArtifact.bytecode, salt);

    const tx = await factory.deploy2(counterArtifact.bytecode, salt);
    const receipt = await tx.wait();

    if (!receipt) throw new Error('Failed to get transaction receipt');

    const event = receipt.logs.find(log => {
        try {
            return factory.interface.parseLog(log)?.name === 'Deployed';
        } catch (e) {
            return false;
        }
    });

    const deployedAddress = event
        ? factory.interface.parseLog(event).args.addr
        : null;

    const addressesMatch = computedAddress && deployedAddress
        ? computedAddress.toLowerCase() === deployedAddress.toLowerCase()
        : false;

    cache.write('evm::deterministic::contract', deployedAddress);

    return {
        success: addressesMatch,
        gasUsed: Number(receipt.gasUsed) || 0,
        transactionHash: receipt.hash,
        additionalData: {
            computedAddress,
            deployedAddress,
        }
    };
}

module.exports = { deploy };
