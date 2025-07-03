// SPDX-License-Identifier: Apache-2.0

const { ethers: { ContractFactory, Wallet, Contract } } = require('ethers');
const { loadArtifact } = require('../../../utils/artifact');
const { options, DEFAULT_GAS_LIMIT } = require('../options');

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
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, additionalData: {contractAddress: string}, transactionHash: string}>}
 */
const initFactory = async function (wallet, cache) {
  const contractFactory = new ContractFactory(factoryArtifact.abi, factoryArtifact.bytecode, wallet);
  const tx = await contractFactory.deploy(await options(wallet, DEFAULT_GAS_LIMIT));
  const contractAddress = await tx.getAddress();
  const receipt = await tx.deploymentTransaction().wait();
  if (!receipt) throw new Error('Failed to get transaction receipt');
  cache.write('create-via-factory-deterministic::contract', contractAddress);
  return {
    success: true,
    gasUsed: Number(receipt.gasUsed) || 0,
    transactionHash: receipt.hash,
    additionalData: {contractAddress},
  };
}

/**
 * @param {import('ethers').Wallet|import('ethers').AbstractSigner} wallet
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string}>}
 */
const deploy = async function (wallet, cache) {
  let contractAddress = cache.read('create-via-factory-deterministic::contract');
  if (contractAddress === null) contractAddress = (await initFactory(wallet, cache)).additionalData.contractAddress;
  const contract = getFactoryContract(contractAddress, wallet);
  const counterFactory = new ContractFactory(counterArtifact.abi, counterArtifact.bytecode, wallet);
  const salt = Math.floor(Math.random() * (9999999999 - 1000000000 + 1)) + 1000000000;
  const predictedAddress = await contract.getPredictedAddress(counterFactory.bytecode, salt);
  const tx = await contract.deploy2(counterFactory.bytecode, salt, await options(wallet, DEFAULT_GAS_LIMIT));
  const receipt = await tx.wait();
  if (!receipt) throw new Error('Failed to get transaction receipt');
  if (receipt.logs[0]?.args[0].toLowerCase() !== predictedAddress.toLowerCase()) throw new Error(`Address requested for this smart contract: ${predictedAddress} is different than actual`);
  return {
    success: true,
    gasUsed: Number(receipt.gasUsed) || 0,
    transactionHash: receipt.hash,
  };
}

module.exports = {
  deploy,
  initFactory
};
