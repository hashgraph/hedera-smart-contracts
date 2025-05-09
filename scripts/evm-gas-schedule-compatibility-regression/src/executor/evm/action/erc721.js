const { ethers: { ContractFactory, parseUnits, Wallet, Contract } } = require('ethers');
const { loadArtifact } = require('../../../utils/artifact');
const { options } = require('../options');
const artifact = loadArtifact('ERC721');

/**
 * @param {string} address
 * @param {Wallet} wallet
 * @returns {import('ethers').BaseContract | {
 *   transfer: (string, BigInt, any) => Promise<import('ethers').TransactionResponse>,
 *   mint: (string, any) => Promise<import('ethers').TransactionResponse>,
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
  const tx = await contractFactory.deploy('Test Token', 'TT', await options(wallet, 5000000));
  const contractAddress = await tx.getAddress();
  const receipt = await tx.deploymentTransaction().wait();
  if (!receipt) throw new Error('Failed to get transaction receipt');
  cache.write('erc712::contract', contractAddress);
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
  let contractAddress = cache.read('erc712::contract');
  if (contractAddress === null) contractAddress = (await deploy(wallet, cache)).additionalData.contractAddress;
  const contract = getContract(contractAddress, wallet);
  const tx = await contract.mint(wallet.address, await options(wallet, 200000));
  const receipt = await tx.wait();
  if (!receipt) throw new Error("Failed to get transaction receipt");
  const totalTokens = Number(cache.read('erc712::total') || '0');
  cache.write('erc712::total', `${totalTokens + 1}`);
  cache.write('erc712::last', `${totalTokens + 1}`);
  return {
    success: true,
    gasUsed: Number(receipt.gasUsed) || 0,
    transactionHash: receipt.hash,
    additionalData: { lastToken: totalTokens + 1 },
  };
};

/**
 * @param {import('ethers').Wallet|import('ethers').AbstractSigner} wallet
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string}>}
 */
const transfer = async function (wallet, cache) {
  let contractAddress = cache.read('erc712::contract');
  if (contractAddress === null) contractAddress = (await deploy(wallet, cache)).additionalData.contractAddress;
  const contract = getContract(contractAddress, wallet);
  let lastToken = Number(cache.read('erc712::last') || '0');
  if (!lastToken) lastToken = (await mint(wallet, cache)).additionalData.lastToken;
  const randomWallet = Wallet.createRandom();
  const tx = await contract.transferFrom(wallet.address, randomWallet.address, lastToken - 1, await options(wallet, 200000));
  const receipt = await tx.wait();
  cache.write('erc712::last', '0');
  if (!receipt) throw new Error("Failed to get transaction receipt");
  return {
    success: true,
    gasUsed: Number(receipt.gasUsed) || 0,
    transactionHash: receipt.hash,
  };
};

module.exports = { mint, transfer, deploy };
