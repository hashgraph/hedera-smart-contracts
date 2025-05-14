// SPDX-License-Identifier: Apache-2.0

const { ContractFunctionParameters, ContractId } = require('@hashgraph/sdk');
const { Wallet } = require('ethers');
const hedera = require('../../client');
const { loadArtifact } = require('../../../../utils/artifact');

const artifact = loadArtifact('ERC20');

const initContractId = async function(client, cache) {
  let contractAddress = cache.read('erc20::contract');
  if (contractAddress === null) contractAddress = (await deploy(client, cache)).additionalData.contractAddress;
  return ContractId.fromEvmAddress(0, 0, contractAddress);
}

const amount = Number(BigInt(100) * BigInt(10**18));

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, additionalData: {contractAddress: string}, transactionHash: string}>}
 */
const deploy = async function (client, cache) {
  const { status, gasUsed, contractId, transactionHash } =
    await hedera.deploy(client, artifact.bytecode, new ContractFunctionParameters()
      .addString('Test Token').addString('TT').addUint256(
        Number(BigInt(1000000) * BigInt(10**18))
      ));

  const contractAddress = contractId.toSolidityAddress();
  cache.write('erc20::contract', contractAddress);
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
  const contractId = await initContractId(client, cache);
  const { status, gasUsed, transactionHash } = await hedera.call(
    client,
    contractId,
    'mint',
    new ContractFunctionParameters().addUint256(amount),
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
const burn = async function (client, cache) {
  const contractId = await initContractId(client, cache);
  const { status, gasUsed, transactionHash } = await hedera.call(
    client,
    contractId,
    'burn',
    new ContractFunctionParameters().addUint256(amount),
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
const transfer = async function (client, cache) {
  const contractId = await initContractId(client, cache);
  const { status, gasUsed, transactionHash } = await hedera.call(
    client,
    contractId,
    'transfer',
    new ContractFunctionParameters()
      .addAddress(Wallet.createRandom().address)
      .addUint256(amount),
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
const approve = async function (client, cache) {
  const contractId = await initContractId(client, cache);
  const { status, gasUsed, transactionHash } = await hedera.call(
    client,
    contractId,
    'approve',
    new ContractFunctionParameters()
      .addAddress(Wallet.createRandom().address)
      .addUint256(amount),
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
  const contractId = await initContractId(client, cache);
  const { status, gasUsed, transactionHash } = await hedera.call(
    client,
    contractId,
    'transferFrom',
    new ContractFunctionParameters()
      .addAddress(`${client.getOperator().publicKey.toEvmAddress()}`)
      .addAddress(Wallet.createRandom().address)
      .addUint256(amount),
  );

  return {
    success: status,
    gasUsed,
    transactionHash: '',
    additionalData: { hederaTxId: `0x${transactionHash}` },
  };
};

module.exports = { deploy, mint, burn, transfer, approve, transferFrom };
