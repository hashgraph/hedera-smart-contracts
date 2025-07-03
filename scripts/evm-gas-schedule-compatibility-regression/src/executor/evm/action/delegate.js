// SPDX-License-Identifier: Apache-2.0

const { ethers: { ContractFactory,  Wallet, Contract } } = require('ethers');
const { loadArtifact } = require('../../../utils/artifact');
const { options, DEFAULT_GAS_LIMIT } = require('../options');

const callerArtifact = loadArtifact('Caller');
const counterArtifact = loadArtifact('Counter');

/**
 * @param {string} address
 * @param {Wallet} wallet
 * @returns {import('ethers').BaseContract | {
 *    callIncrement: (string) =>  Promise<import('ethers').TransactionResponse>,
 * }}
 */
const getCallerContract = function (address, wallet) {
  return new Contract(address, callerArtifact.abi, wallet);
}

/**
 * @param {import('ethers').Wallet|import('ethers').AbstractSigner} wallet
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, additionalData: {contractAddress: string}, transactionHash: string}>}
 */
const initCaller = async function (wallet, cache) {
  const contractFactory = new ContractFactory(callerArtifact.abi, callerArtifact.bytecode, wallet);
  const tx = await contractFactory.deploy(await options(wallet, DEFAULT_GAS_LIMIT));
  const contractAddress = await tx.getAddress();
  const receipt = await tx.deploymentTransaction().wait();
  if (!receipt) throw new Error('Failed to get transaction receipt');
  cache.write('delegate::call::caller', contractAddress);
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
 * @returns {Promise<{gasUsed: (number|number), success: boolean, additionalData: {contractAddress: string}, transactionHash: string}>}
 */
const initCounter = async function (wallet, cache) {
  const contractFactory = new ContractFactory(counterArtifact.abi, counterArtifact.bytecode, wallet);
  const tx = await contractFactory.deploy(await options(wallet, DEFAULT_GAS_LIMIT));
  const contractAddress = await tx.getAddress();
  const receipt = await tx.deploymentTransaction().wait();
  if (!receipt) throw new Error('Failed to get transaction receipt');
  cache.write('delegate::call::counter', contractAddress);
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
const call = async function (wallet, cache) {
  let callerAddress = cache.read('delegate::call::caller');
  let counterAddress = cache.read('delegate::call::counter');
  if (callerAddress === null) callerAddress = (await initCaller(wallet, cache)).additionalData.contractAddress;
  if (counterAddress === null) counterAddress = (await initCounter(wallet, cache)).additionalData.contractAddress;
  const caller = getCallerContract(callerAddress, wallet);
  const tx = await caller.callIncrement(counterAddress, await options(wallet, DEFAULT_GAS_LIMIT));
  const receipt = await tx.wait();
  if (!receipt) throw new Error('Failed to get transaction receipt');
  return {
    success: true,
    gasUsed: Number(receipt.gasUsed) || 0,
    transactionHash: receipt.hash,
  };
}

module.exports = {
  call,
};
