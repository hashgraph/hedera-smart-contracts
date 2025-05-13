// SPDX-License-Identifier: Apache-2.0

const { loadArtifact } = require('../../../../utils/artifact');
const hedera = require('../../client');
const { ContractFunctionParameters, ContractId } = require('@hashgraph/sdk');
const { Wallet } = require('ethers');
const artifact = loadArtifact('ERC721');

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, additionalData: {contractAddress: string}, transactionHash: string}>}
 */
const deploy = async function (client, cache) {
  const { status, gasUsed, contractId, transactionHash } =
    await hedera.deploy(client, artifact.bytecode, new ContractFunctionParameters()
      .addString('Test Token').addString('TT'));

  const contractAddress = contractId.toSolidityAddress();
  cache.write('erc721::contract::sdk', contractAddress);
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
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string}>}
 */
const mint = async function (client, cache) {
  let contractAddress = cache.read('erc721::contract::sdk');
  if (contractAddress === null) contractAddress = (await deploy(client, cache)).additionalData.contractAddress;
  const contractId = ContractId.fromEvmAddress(0, 0, contractAddress);

  const { status, gasUsed, transactionHash } = await hedera.call(
    client,
    contractId,
    'mint',
    new ContractFunctionParameters()
      .addAddress(`${client.getOperator().publicKey.toEvmAddress()}`),
  );

  const totalTokens = Number(cache.read('erc721::total::sdk') || '0');
  cache.write('erc721::total::sdk', `${totalTokens + 1}`);
  cache.write('erc721::last::sdk', `${totalTokens + 1}`);

  return {
    success: status,
    gasUsed,
    transactionHash: '',
    additionalData: { hederaTxId: `0x${transactionHash}`, lastToken: totalTokens + 1 },
  };
};

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string}>}
 */
const burn = async function (client, cache) {
  let contractAddress = cache.read('erc721::contract::sdk');
  if (contractAddress === null) contractAddress = (await deploy(client, cache)).additionalData.contractAddress;
  let lastToken = Number(cache.read('erc721::last::sdk') || '0');
  if (!lastToken) lastToken = (await mint(client, cache)).additionalData.lastToken;
  const contractId = ContractId.fromEvmAddress(0, 0, contractAddress);
  const { status, gasUsed, transactionHash } = await hedera.call(
      client,
      contractId,
      'burn',
      new ContractFunctionParameters().addUint256(lastToken - 1),
  );
  cache.write('erc721::last::sdk', '0');
  return {
    success: status,
    gasUsed,
    transactionHash: '',
    additionalData: { hederaTxId: `0x${transactionHash}` },
  };
};

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string}>}
 */
const approve = async function (client, cache) {
  let contractAddress = cache.read('erc721::contract::sdk');
  if (contractAddress === null) contractAddress = (await deploy(client, cache)).additionalData.contractAddress;
  let lastToken = Number(cache.read('erc721::last::sdk') || '0');
  if (!lastToken) lastToken = (await mint(client, cache)).additionalData.lastToken;
  const randomWallet = Wallet.createRandom();
  const contractId = ContractId.fromEvmAddress(0, 0, contractAddress);
  cache.write('erc721::last::sdk', '0');
  const { status, gasUsed, transactionHash } = await hedera.call(
    client,
    contractId,
    'approve',
    new ContractFunctionParameters()
      .addAddress(randomWallet.address)
      .addUint256(lastToken - 1),
  );
  return {
    success: status,
    gasUsed,
    transactionHash: '',
    additionalData: { hederaTxId: `0x${transactionHash}` },
  };
};

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string}>}
 */
const setApprovalForAll = async function (client, cache) {
  let contractAddress = cache.read('erc721::contract::sdk');
  if (contractAddress === null) contractAddress = (await deploy(client, cache)).additionalData.contractAddress;
  const contractId = ContractId.fromEvmAddress(0, 0, contractAddress);
  const randomWallet = Wallet.createRandom();
  const { status, gasUsed, transactionHash } = await hedera.call(
    client,
    contractId,
    'setApprovalForAll',
    new ContractFunctionParameters()
      .addAddress(randomWallet.address)
      .addBool(true)
    ,
  );
  return {
    success: status,
    gasUsed,
    transactionHash: '',
    additionalData: { hederaTxId: `0x${transactionHash}` },
  };
};

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string}>}
 */
const transferFrom = async function (client, cache) {
  let contractAddress = cache.read('erc721::contract::sdk');
  if (contractAddress === null) contractAddress = (await deploy(client, cache)).additionalData.contractAddress;
  let lastToken = Number(cache.read('erc721::last::sdk') || '0');
  if (!lastToken) lastToken = (await mint(client, cache)).additionalData.lastToken;
  const randomWallet = Wallet.createRandom();
  const contractId = ContractId.fromEvmAddress(0, 0, contractAddress);
  const { status, gasUsed, transactionHash } = await hedera.call(
    client,
    contractId,
    'transferFrom',
    new ContractFunctionParameters()
      .addAddress(`${client.getOperator().publicKey.toEvmAddress()}`)
      .addAddress(randomWallet.address)
      .addUint256(lastToken - 1),
  );
  cache.write('erc721::last::sdk', '0');
  return {
    success: status,
    gasUsed,
    transactionHash: '',
    additionalData: { hederaTxId: `0x${transactionHash}` },
  };
};

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string}>}
 */
const safeTransferFrom = async function (client, cache) {
  let contractAddress = cache.read('erc721::contract::sdk');
  if (contractAddress === null) contractAddress = (await deploy(client, cache)).additionalData.contractAddress;
  let lastToken = Number(cache.read('erc721::last::sdk') || '0');
  if (!lastToken) lastToken = (await mint(client, cache)).additionalData.lastToken;
  const randomWallet = Wallet.createRandom();
  const contractId = ContractId.fromEvmAddress(0, 0, contractAddress);
  const { status, gasUsed, transactionHash } = await hedera.call(
    client,
    contractId,
    'safeTransferFrom',
    new ContractFunctionParameters()
      .addAddress(`${client.getOperator().publicKey.toEvmAddress()}`)
      .addAddress(randomWallet.address)
      .addUint256(lastToken - 1),
  );
  cache.write('erc721::last::sdk', '0');
  return {
    success: status,
    gasUsed,
    transactionHash: '',
    additionalData: { hederaTxId: `0x${transactionHash}` },
  };
};

module.exports = { deploy, mint, burn, approve, setApprovalForAll, transferFrom, safeTransferFrom };
