// SPDX-License-Identifier: Apache-2.0

const { ethers: { ContractFactory, Wallet, Contract } } = require('ethers');
const hedera = require('../../client');
const { loadArtifact } = require('../../../../utils/artifact');
const { options } = require('../../../evm/options');

const [factoryArtifact, counterArtifact] = [
  loadArtifact('Factory'),
  loadArtifact('Counter')
];

/**
 * @param {string} address
 * @param {Wallet} wallet
 * @returns {import('ethers').BaseContract | {
 *    getPredictedAddress: (string, number) => Promise<string>,
 *    deploy2: (string, number) => Promise<import('ethers').TransactionResponse>,
 * }}
 */
const getFactoryContract = (address, wallet) => new Contract(address, factoryArtifact.abi, wallet);

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {import('ethers').Wallet} wallet
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, additionalData: {contractAddress: string}, transactionHash: string}>}
 */
const initFactory = async function (client, wallet, cache) {
  const contractFactory = new ContractFactory(factoryArtifact.abi, factoryArtifact.bytecode, wallet);
  const tx = await contractFactory.getDeployTransaction(await options(wallet, DEFAULT_GAS_LIMIT));
  const { status, gasUsed, evmAddress, contractId, transactionHash } = await hedera.forward(
    client,
    client.getOperator().accountId,
    wallet,
    { ...tx, to: null, type: 2, accessList: [] }
  );
  const contractAddress = evmAddress || contractId.toSolidityAddress();
  cache.write('create-via-factory-deterministic::contract', contractAddress);
  return {
    success: status,
    gasUsed,
    transactionHash: '',
    additionalData: { contractAddress, contractId, hederaTxId: `0x${transactionHash}` },
  };
}

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {import('ethers').Wallet|import('ethers').AbstractSigner} wallet
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string}>}
 */
const deploy = async function (client, wallet, cache) {
  let contractAddress = cache.read('create-via-factory-deterministic::contract');
  if (contractAddress === null) contractAddress = (await initFactory(client, wallet, cache)).additionalData.contractAddress;
  const contract = getFactoryContract(contractAddress, wallet);
  const counterFactory = new ContractFactory(counterArtifact.abi, counterArtifact.bytecode, wallet);
  const salt = Math.floor(Math.random() * (9999999999 - 1000000000 + 1)) + 1000000000;
  const txData = contract.interface.encodeFunctionData('deploy2(bytes,uint256)', [counterFactory.bytecode, salt]);
  const tx = {
    ...(await options(wallet, DEFAULT_GAS_LIMIT)),
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
}

module.exports = {
  deploy
};
