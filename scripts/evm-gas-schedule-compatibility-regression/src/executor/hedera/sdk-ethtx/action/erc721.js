// SPDX-License-Identifier: Apache-2.0

const { loadArtifact } = require('../../../../utils/artifact');
const hedera = require('../../client');
const { options } = require("../../../evm/options");
const { ethers: { ContractFactory, Wallet, Contract } } = require('ethers');
const artifact = loadArtifact('ERC721');

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
  const tx = await contractFactory.getDeployTransaction('Test Token', 'TT', await options(wallet, 5000000));
  const { status, gasUsed, evmAddress, contractId, transactionHash } = await hedera.forward(
    client,
    client.getOperator().accountId,
    wallet,
    { ...tx, to: null, type: 2, accessList: [] }
  );
  const contractAddress = evmAddress || contractId.toSolidityAddress();
  cache.write('erc721::contract::sdk-ethtx', contractAddress);
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
const mint = async function (client, wallet, cache) {
  let contractAddress = cache.read('erc721::contract::sdk-ethtx');
  if (contractAddress === null) contractAddress = (await deploy(client, wallet, cache)).additionalData.contractAddress;
  const contract = getContract(contractAddress, wallet);
  const txData = contract.interface.encodeFunctionData('mint(address)', [wallet.address]);
  const tx = {
    ...(await options(wallet, 200000)),
    to: contractAddress,
    data: txData,
  };
  const { status, gasUsed, contractId, transactionHash } = await hedera.forward(
    client,
    client.getOperator().accountId,
    wallet,
    { ...tx, type: 2, accessList: [] }
  );

  const totalTokens = Number(cache.read('erc721::total::sdk-ethtx') || '0');
  cache.write('erc721::total::sdk-ethtx', `${totalTokens + 1}`);
  cache.write('erc721::last::sdk-ethtx', `${totalTokens + 1}`);
  return {
    success: status,
    gasUsed,
    transactionHash: '',
    additionalData: { contractAddress, lastToken: totalTokens + 1, contractId, hederaTxId: `0x${transactionHash}` },
  };
};

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {import('ethers').Wallet} wallet
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string, additionalData: { hederaTxId: string }}>}
 */
const burn = async function (client, wallet, cache) {
  let contractAddress = cache.read('erc721::contract::sdk-ethtx');
  if (contractAddress === null) contractAddress = (await deploy(client, wallet, cache)).additionalData.contractAddress;
  const contract = getContract(contractAddress, wallet);
  let lastToken = Number(cache.read('erc721::last::sdk-ethtx') || '0');
  if (!lastToken) lastToken = (await mint(client, wallet, cache)).additionalData.lastToken;
  const txData = contract.interface.encodeFunctionData('burn(uint256)', [lastToken - 1]);
  const tx = {
    ...(await options(wallet, 200000)),
    to: contractAddress,
    data: txData,
  };
  cache.write('erc721::last::sdk-ethtx', '0');
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

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {import('ethers').Wallet} wallet
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string, additionalData: { hederaTxId: string }}>}
 */
const approve = async function (client, wallet, cache) {
  let contractAddress = cache.read('erc721::contract::sdk-ethtx');
  if (contractAddress === null) contractAddress = (await deploy(client, wallet, cache)).additionalData.contractAddress;
  const contract = getContract(contractAddress, wallet);
  let lastToken = Number(cache.read('erc721::last::sdk-ethtx') || '0');
  if (!lastToken) lastToken = (await mint(client, wallet, cache)).additionalData.lastToken;
  const randomWallet = Wallet.createRandom();
  cache.write('erc721::last::sdk-ethtx', '0');
  const txData = contract.interface.encodeFunctionData('approve(address,uint256)', [randomWallet.address, lastToken - 1]);
  const tx = {
    ...(await options(wallet, 200000)),
    to: contractAddress,
    data: txData,
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

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {import('ethers').Wallet} wallet
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string, additionalData: { hederaTxId: string }}>}
 */
const setApprovalForAll = async function (client, wallet, cache) {
  let contractAddress = cache.read('erc721::contract::sdk-ethtx');
  if (contractAddress === null) contractAddress = (await deploy(client, wallet, cache)).additionalData.contractAddress;
  const contract = getContract(contractAddress, wallet);
  const randomWallet = Wallet.createRandom();
  const txData = contract.interface.encodeFunctionData('setApprovalForAll(address,bool)', [randomWallet.address, true]);
  const tx = {
    ...(await options(wallet, 200000)),
    to: contractAddress,
    data: txData,
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

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {import('ethers').Wallet} wallet
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string, additionalData: { hederaTxId: string }}>}
 */
const transferFrom = async function (client, wallet, cache) {
  let contractAddress = cache.read('erc721::contract::sdk-ethtx');
  if (contractAddress === null) contractAddress = (await deploy(client, wallet, cache)).additionalData.contractAddress;
  const contract = getContract(contractAddress, wallet);
  let lastToken = Number(cache.read('erc721::last::sdk-ethtx') || '0');
  if (!lastToken) lastToken = (await mint(client, wallet, cache)).additionalData.lastToken;
  const randomWallet = Wallet.createRandom();
  const txData = contract.interface.encodeFunctionData('transferFrom(address,address,uint256)', [wallet.address, randomWallet.address, lastToken - 1]);
  const tx = {
    ...(await options(wallet, 200000)),
    to: contractAddress,
    data: txData,
  };
  cache.write('erc721::last::sdk-ethtx', '0');
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

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {import('ethers').Wallet} wallet
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string, additionalData: { hederaTxId: string }}>}
 */
const safeTransferFrom = async function (client, wallet, cache) {
  let contractAddress = cache.read('erc721::contract::sdk-ethtx');
  if (contractAddress === null) contractAddress = (await deploy(client, wallet, cache)).additionalData.contractAddress;
  const contract = getContract(contractAddress, wallet);
  let lastToken = Number(cache.read('erc721::last::sdk-ethtx') || '0');
  if (!lastToken) lastToken = (await mint(client, wallet, cache)).additionalData.lastToken;
  const randomWallet = Wallet.createRandom();
  const txData = contract.interface.encodeFunctionData('transferFrom(address,address,uint256)', [wallet.address, randomWallet.address, lastToken - 1]);
  const tx = {
    ...(await options(wallet, 200000)),
    to: contractAddress,
    data: txData,
  };
  cache.write('erc721::last::sdk-ethtx', '0');
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

module.exports = { deploy, mint, burn, approve, setApprovalForAll, transferFrom, safeTransferFrom };
