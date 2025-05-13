// SPDX-License-Identifier: Apache-2.0

const { loadArtifact } = require('../../../../utils/artifact');
const hedera = require("../../client");
const { ContractFunctionParameters, ContractId } = require("@hashgraph/sdk");

const callerArtifact = loadArtifact('Caller');
const counterArtifact = loadArtifact('Counter');

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, additionalData: {contractAddress: string}, transactionHash: string}>}
 */
const initCaller = async function (client, cache) {
  const { status, gasUsed, contractId, transactionHash } =
    await hedera.deploy(client, callerArtifact.bytecode, new ContractFunctionParameters());

  const contractAddress = contractId.toSolidityAddress();
  cache.write('delegatecall::caller', contractAddress);
  return {
    success: status,
    gasUsed,
    transactionHash: '',
    additionalData: { contractAddress, contractId, hederaTxId: `0x${transactionHash}` },
  };
}

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, additionalData: {contractAddress: string}, transactionHash: string}>}
 */
const initCounter = async function (client, cache) {
  const { status, gasUsed, contractId, transactionHash } =
    await hedera.deploy(client, counterArtifact.bytecode, new ContractFunctionParameters());

  const contractAddress = contractId.toSolidityAddress();
  cache.write('delegatecall::counter', contractAddress);
  return {
    success: status,
    gasUsed,
    transactionHash: '',
    additionalData: { contractAddress, contractId, hederaTxId: `0x${transactionHash}` },
  };
}


/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string}>}
 */
const call = async function (client, cache) {
  let callerAddress = cache.read('delegatecall::caller');
  let counterAddress = cache.read('delegatecall::counter');
  if (callerAddress === null) callerAddress = (await initCaller(client, cache)).additionalData.contractAddress;
  if (counterAddress === null) counterAddress = (await initCounter(client, cache)).additionalData.contractAddress;
  const contractId = ContractId.fromEvmAddress(0, 0, callerAddress);
  const { status, gasUsed, transactionHash } = await hedera.call(
    client,
    contractId,
    'callIncrement',
    new ContractFunctionParameters().addAddress(counterAddress)
  );
  return {
    success: status,
    gasUsed,
    transactionHash: '',
    additionalData: { hederaTxId: `0x${transactionHash}` },
  };
}

module.exports = {
  call,
};
