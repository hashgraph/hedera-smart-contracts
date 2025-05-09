const { loadArtifact } = require('../../../../utils/artifact');
const hedera = require('../../client');
const { options } = require("../../../evm/options");
const { ethers: { ContractFactory, parseUnits, Wallet, Contract } } = require('ethers');
const artifact = loadArtifact('ERC721');
// FIXME
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
  cache.write('erc721::contract', contractAddress);
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
  let contractAddress = cache.read('erc721::contract');
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

  const totalTokens = Number(cache.read('erc712::total') || '0');
  cache.write('erc712::total', `${totalTokens + 1}`);
  cache.write('erc712::last', `${totalTokens + 1}`);
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
const transfer = async function (client, wallet, cache) {
  let contractAddress = cache.read('erc721::contract');
  if (contractAddress === null) contractAddress = (await deploy(client, wallet, cache)).additionalData.contractAddress;
  const contract = getContract(contractAddress, wallet);
  const randomWallet = Wallet.createRandom();
  const txData = contract.interface.encodeFunctionData('transferFrom(address,address,uint256)', [wallet.address, randomWallet.address, parseUnits('100', 18)]);
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

module.exports = { transfer, mint, deploy };
