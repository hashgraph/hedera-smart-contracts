const { loadArtifact } = require('../../../../utils/artifact');
const hedera = require("../../client");
const { ethers: { ContractFactory, Wallet, Contract } } = require('ethers');
const { options } = require("../../../evm/options");

const callerArtifact = loadArtifact('Caller');
const counterArtifact = loadArtifact('Counter');

/**
 * @param {number} ms
 * @returns {Promise<unknown>}
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * @param {string} address
 * @param {Wallet} wallet
 * @returns {import('ethers').BaseContract | {
 *   transfer: (string, BigInt, any) => Promise<import('ethers').TransactionResponse>,
 *   balanceOf: (string) => Promise<number>,
 * }}
 */
const getContract = function (address, wallet) {
  return new Contract(address, callerArtifact.abi, wallet);
}

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {import('ethers').Wallet} wallet
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, additionalData: {contractAddress: string}, transactionHash: string}>}
 */
const initCaller = async function (client, wallet, cache) {
  const contractFactory = new ContractFactory(callerArtifact.abi, callerArtifact.bytecode, wallet);
  const tx = await contractFactory.getDeployTransaction(await options(wallet, 5000000));
  const { status, gasUsed, evmAddress, contractId, transactionHash } = await hedera.forward(
    client,
    client.getOperator().accountId,
    wallet,
    { ...tx, to: null, type: 2, accessList: [] }
  );
  const contractAddress = evmAddress || contractId.toSolidityAddress();
  cache.write('delegatecall::caller::sdk-ethtx', contractAddress);
  await delay(2000);
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
 * @returns {Promise<{gasUsed: (number|number), success: boolean, additionalData: {contractAddress: string}, transactionHash: string}>}
 */
const initCounter = async function (client, wallet, cache) {
  const contractFactory = new ContractFactory(counterArtifact.abi, counterArtifact.bytecode, wallet);
  const tx = await contractFactory.getDeployTransaction(await options(wallet, 5000000));
  const { status, gasUsed, evmAddress, contractId, transactionHash } = await hedera.forward(
    client,
    client.getOperator().accountId,
    wallet,
    { ...tx, to: null, type: 2, accessList: [] }
  );
  const contractAddress = evmAddress || contractId.toSolidityAddress();
  cache.write('delegatecall::counter::sdk-ethtx', contractAddress);
  await delay(2000);
  return {
    success: status,
    gasUsed,
    transactionHash: '',
    additionalData: { contractAddress, contractId, hederaTxId: `0x${transactionHash}` },
  };
}


/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {import('ethers').Wallet} wallet
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, transactionHash: string}>}
 */
const call = async function (client, wallet, cache) {
  let callerAddress = cache.read('delegatecall::caller::sdk-ethtx');
  let counterAddress = cache.read('delegatecall::counter::sdk-ethtx');
  if (callerAddress === null) callerAddress = (await initCaller(client, wallet, cache)).additionalData.contractAddress;
  if (counterAddress === null) counterAddress = (await initCounter(client, wallet, cache)).additionalData.contractAddress;
  const contract = getContract(callerAddress, wallet);
  const txData = contract.interface.encodeFunctionData('callIncrement(address)', [counterAddress]);
  const tx = {
    ...(await options(wallet, 200000)),
    to: callerAddress,
    data: txData,
  };
  const { status, gasUsed, transactionHash } = await hedera.forward(
    client,
    client.getOperator().accountId,
    wallet,
    { ...tx, type: 2, accessList: [] }
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
