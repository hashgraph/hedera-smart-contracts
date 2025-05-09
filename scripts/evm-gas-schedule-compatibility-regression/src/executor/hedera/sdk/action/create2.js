const { loadArtifact } = require('../../../../utils/artifact');
const hedera = require("../../client");
const { ContractFunctionParameters, ContractId} = require("@hashgraph/sdk");

const factoryArtifact = loadArtifact('Factory');
const counterArtifact = loadArtifact('Counter');

/**
 * @param {import('@hashgraph/sdk').Client} client
 * @param {Cache} cache
 * @returns {Promise<{gasUsed: (number|number), success: boolean, additionalData: {contractAddress: string}, transactionHash: string}>}
 */
const initFactory = async function (client, cache) {
  const { status, gasUsed, contractId, transactionHash } =
    await hedera.deploy(client, factoryArtifact.bytecode, new ContractFunctionParameters());

  const contractAddress = contractId.toSolidityAddress();
  cache.write('create2::contract', contractAddress);
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
const deploy = async function (client, cache) {
  let contractAddress = cache.read('create2::contract');
  if (contractAddress === null) contractAddress = (await initFactory(client, cache)).additionalData.contractAddress;
  const contractId = ContractId.fromEvmAddress(0, 0, contractAddress);
  const { status, gasUsed, transactionHash } = await hedera.call(
    client,
    contractId,
    'deploy2',
    new ContractFunctionParameters()
      .addBytes(Uint8Array.from(Buffer.from(counterArtifact.bytecode.substring(2), 'hex')))
      .addUint256(Math.floor(Math.random() * (9999999999 - 1000000000 + 1)) + 1000000000)
  );
  return {
    success: status,
    gasUsed,
    transactionHash: '',
    additionalData: { hederaTxId: `0x${transactionHash}` },
  };
}

module.exports = {
  deploy
};
