const { ethers: { ContractFactory, Wallet, Contract } } = require('ethers');
const { loadArtifact } = require('../../../utils/artifact');
const { options, DEFAULT_GAS_LIMIT } = require('../options');

const artifact = loadArtifact('ERC721');

/**
 * @param {string} address
 * @param {Wallet} wallet
 * @returns {import('ethers').BaseContract | {
 *   mint: (string, any) => Promise<import('ethers').TransactionResponse>,
 *   burn: (number, any) => Promise<import('ethers').TransactionResponse>,
 *   approve: (string, number, any) => Promise<import('ethers').TransactionResponse>,
 *   setApprovalForAll: (string, boolean, any) => Promise<import('ethers').TransactionResponse>,
 *   transferFrom: (string, string, number, any) => Promise<import('ethers').TransactionResponse>,
 *   safeTransferFrom: (string, string, number, any) => Promise<import('ethers').TransactionResponse>,
 * }}
 */
const getContract = function (address, wallet) {
  return new Contract(address, artifact.abi, wallet);
}

const initTokenId = async function (wallet, cache) {
  let contractAddress = cache.read('erc721::contract');
  if (contractAddress === null) contractAddress = (await deploy(wallet, cache)).additionalData.contractAddress;
  const contract = getContract(contractAddress, wallet);
  let lastToken = Number(cache.read('erc721::last') || '0');
  if (!lastToken) lastToken = (await mint(wallet, cache)).additionalData.lastToken;
  return { contractAddress, contract, lastToken };
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
  cache.write('erc721::contract', contractAddress);
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
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string, additionalData: {lastToken: number}}>}
 */
const mint = async function (wallet, cache) {
  let contractAddress = cache.read('erc721::contract');
  if (contractAddress === null) contractAddress = (await deploy(wallet, cache)).additionalData.contractAddress;
  const contract = getContract(contractAddress, wallet);
  const tx = await contract.mint(wallet.address, await options(wallet, 5000000));
  const receipt = await tx.wait();
  if (!receipt) throw new Error('Failed to get transaction receipt');
  const totalTokens = Number(cache.read('erc721::total') || '0');
  cache.write('erc721::total', `${totalTokens + 1}`);
  cache.write('erc721::last', `${totalTokens + 1}`);
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
const burn = async function (wallet, cache) {
  const { contract, lastToken } = await initTokenId(wallet, cache);
  const tx = await contract.burn(lastToken - 1, await options(wallet, 5000000));
  cache.write('erc721::last', '0');
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
  const { contract, lastToken } = await initTokenId(wallet, cache);
  const randomWallet = Wallet.createRandom();
  const tx = await contract.approve(randomWallet.address, lastToken - 1, await options(wallet, 5000000));
  cache.write('erc721::last', '0');
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
const setApprovalForAll = async function (wallet, cache) {
  let contractAddress = cache.read('erc721::contract');
  if (contractAddress === null) contractAddress = (await deploy(wallet, cache)).additionalData.contractAddress;
  const contract = getContract(contractAddress, wallet);
  const randomWallet = Wallet.createRandom();
  const tx = await contract.setApprovalForAll(randomWallet.address, true, await options(wallet, DEFAULT_GAS_LIMIT));
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
  const { contract, lastToken } = await initTokenId(wallet, cache);
  const randomWallet = Wallet.createRandom();
  const tx = await contract.transferFrom(wallet.address, randomWallet.address, lastToken - 1, await options(wallet, 5000000));
  cache.write('erc721::last', '0');
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
const safeTransferFrom = async function (wallet, cache) {
  const { contract, lastToken } = await initTokenId(wallet, cache);
  const randomWallet = Wallet.createRandom();
  const tx = await contract['safeTransferFrom(address,address,uint256)'](wallet.address, randomWallet.address, lastToken - 1, await options(wallet, DEFAULT_GAS_LIMIT));
  cache.write('erc721::last', '0');
  const receipt = await tx.wait();
  if (!receipt) throw new Error('Failed to get transaction receipt');
  return {
    success: true,
    gasUsed: Number(receipt.gasUsed) || 0,
    transactionHash: receipt.hash,
  };
};

module.exports = { deploy, mint, burn, approve, setApprovalForAll, transferFrom, safeTransferFrom };
