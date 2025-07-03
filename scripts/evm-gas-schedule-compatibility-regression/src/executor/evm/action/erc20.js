// SPDX-License-Identifier: Apache-2.0

const { ethers: { ContractFactory, parseUnits, Wallet, Contract } } = require('ethers');
const { loadArtifact } = require('../../../utils/artifact');
const { options, DEFAULT_GAS_LIMIT } = require('../options');

const artifact = loadArtifact('ERC20');

/**
 * @param {string} address
 * @param {Wallet} wallet
 * @returns {import('ethers').BaseContract | {
 *   mint: (BigInt, any) => Promise<import('ethers').TransactionResponse>,
 *   burn: (BigInt, any) => Promise<import('ethers').TransactionResponse>,
 *   transfer: (string, BigInt, any) => Promise<import('ethers').TransactionResponse>,
 *   approve: (string, BigInt, any) => Promise<import('ethers').TransactionResponse>,
 *   transferFrom: (string, string, BigInt, any) => Promise<import('ethers').TransactionResponse>,
 *   balanceOf: (string) => Promise<number>,
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
  const tx = await contractFactory.deploy('Test Token', 'TT', parseUnits('1000000', 18), await options(wallet, DEFAULT_GAS_LIMIT));
  const contractAddress = await tx.getAddress();
  const receipt = await tx.deploymentTransaction().wait();
  if (!receipt) throw new Error('Failed to get transaction receipt');
  cache.write('erc20::contract', contractAddress);
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
const mint = async function (wallet, cache) {
  let contractAddress = cache.read('erc20::contract');
  if (contractAddress === null) contractAddress = (await deploy(wallet, cache)).additionalData.contractAddress;
  const contract = getContract(contractAddress, wallet);
  const tx = await contract.mint(parseUnits('100', 18), await options(wallet, DEFAULT_GAS_LIMIT));
  const receipt = await tx.wait();
  if (!receipt) throw new Error('Failed to get transaction receipt');
  return {
    success: true,
    gasUsed: Number(receipt.gasUsed) || 0,
    transactionHash: receipt.hash,
  };
};

/**
 * @param {import('ethers').Wallet|import('ethers').AbstractSigner} wallet
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string}>}
 */
const burn = async function (wallet, cache) {
  let contractAddress = cache.read('erc20::contract');
  if (contractAddress === null) contractAddress = (await deploy(wallet, cache)).additionalData.contractAddress;
  const contract = getContract(contractAddress, wallet);
  const tx = await contract.burn(parseUnits('100', 18), await options(wallet, DEFAULT_GAS_LIMIT));
  const receipt = await tx.wait();
  if (!receipt) throw new Error('Failed to get transaction receipt');
  return {
    success: true,
    gasUsed: Number(receipt.gasUsed) || 0,
    transactionHash: receipt.hash,
  };
};

/**
 * @param {import('ethers').Wallet|import('ethers').AbstractSigner} wallet
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string}>}
 */
const transfer = async function (wallet, cache) {
  let contractAddress = cache.read('erc20::contract');
  if (contractAddress === null) contractAddress = (await deploy(wallet, cache)).additionalData.contractAddress;
  const contract = getContract(contractAddress, wallet);
  const randomWallet = Wallet.createRandom();
  const tx = await contract.transfer(randomWallet.address, parseUnits('100', 18), await options(wallet, DEFAULT_GAS_LIMIT));
  const receipt = await tx.wait();
  if (!receipt) throw new Error('Failed to get transaction receipt');
  return {
    success: true,
    gasUsed: Number(receipt.gasUsed) || 0,
    transactionHash: receipt.hash,
  };
};

/**
 * @param {import('ethers').Wallet|import('ethers').AbstractSigner} wallet
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string}>}
 */
const approve = async function (wallet, cache) {
  let contractAddress = cache.read('erc20::contract');
  if (contractAddress === null) contractAddress = (await deploy(wallet, cache)).additionalData.contractAddress;
  const contract = getContract(contractAddress, wallet);
  const randomWallet = Wallet.createRandom();
  const tx = await contract.approve(randomWallet.address, parseUnits('100', 18), await options(wallet, DEFAULT_GAS_LIMIT));
  const receipt = await tx.wait();
  if (!receipt) throw new Error('Failed to get transaction receipt');
  return {
    success: true,
    gasUsed: Number(receipt.gasUsed) || 0,
    transactionHash: receipt.hash,
  };
};

/**
 * @param {import('ethers').Wallet|import('ethers').AbstractSigner} wallet
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string}>}
 */
const transferFrom = async function (wallet, cache) {
  let contractAddress = cache.read('erc20::contract');
  if (contractAddress === null) contractAddress = (await deploy(wallet, cache)).additionalData.contractAddress;
  const contract = getContract(contractAddress, wallet);
  const randomWallet = Wallet.createRandom();
  const tx = await contract.transferFrom(wallet.address, randomWallet.address, parseUnits('100', 18), await options(wallet, DEFAULT_GAS_LIMIT));
  const receipt = await tx.wait();
  if (!receipt) throw new Error('Failed to get transaction receipt');
  return {
    success: true,
    gasUsed: Number(receipt.gasUsed) || 0,
    transactionHash: receipt.hash,
  };
};

module.exports = { deploy, mint, burn, transfer, approve, transferFrom };
