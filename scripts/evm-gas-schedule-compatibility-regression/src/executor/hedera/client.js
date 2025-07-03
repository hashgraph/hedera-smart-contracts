// SPDX-License-Identifier: Apache-2.0

const {
  TransactionId,
  EthereumTransaction,
  Hbar,
  ContractFunctionParameters,
  ContractCreateFlow,
  ContractExecuteTransaction,
  FileCreateTransaction,
  FileAppendTransaction,
  EthereumTransactionData,
} = require('@hashgraph/sdk');

const FILE_APPEND_CHUNK_SIZE = 5120;
const FILE_APPEND_MAX_CHUNKS = 30;
const DEFAULT_GAS_LIMIT = 5000000;

async function extractCorrectNonceForAddress(wallet)
{
  await new Promise(resolve => setTimeout(resolve, 2000));
  return await wallet.provider.getTransactionCount(wallet.address);
}

async function createFile(callData, client) {
  const hexedCallData = Buffer.from(callData).toString('hex');
  const fileCreateTx = new FileCreateTransaction()
    .setContents(hexedCallData.substring(0, FILE_APPEND_CHUNK_SIZE))
    .setKeys(client.operatorPublicKey ? [client.operatorPublicKey] : []);
  const fileCreateTxResponse = await fileCreateTx.execute(client);
  const { fileId } = await fileCreateTxResponse.getReceipt(client);
  if (fileId && callData.length > FILE_APPEND_CHUNK_SIZE) {
    const fileAppendTx = new FileAppendTransaction()
      .setFileId(fileId)
      .setContents(hexedCallData.substring(FILE_APPEND_CHUNK_SIZE, hexedCallData.length))
      .setChunkSize(FILE_APPEND_CHUNK_SIZE)
      .setMaxChunks(FILE_APPEND_MAX_CHUNKS);
    await fileAppendTx.executeAll(client);
  }
  return fileId;
}

module.exports = {
  /**
   * @param {import('@hashgraph/sdk').Client} client
   * @param {import('@hashgraph/sdk').AccountId} accountId
   * @param {import('ethers').Wallet} wallet
   * @param {import('ethers').PreparedTransactionRequest} ethTransaction
   * @returns {Promise<{ status: boolean, gasUsed: number, transactionId: string }>}
   */
  forward: async function (client, accountId, wallet, ethTransaction) {
    const { to, gasLimit, data, accessList, type } = ethTransaction;
    const pluck  = { to, gasLimit, data, accessList, type };
    const { chainId } = await wallet.provider.getNetwork();
    const nonce = await extractCorrectNonceForAddress(wallet);
    const tx = { ...pluck, from: wallet.address, chainId, nonce };
    if (ethTransaction.value) tx.value = ethTransaction.value;
    const signedTx = await wallet.signTransaction(tx);
    const transactionId = TransactionId.generate(accountId);
    const ethTx = new EthereumTransaction().setTransactionId(transactionId);
    const ethData = EthereumTransactionData.fromBytes(Uint8Array.from(Buffer.from(signedTx.substring(2), 'hex')));
    if (ethData.callData.length <= FILE_APPEND_CHUNK_SIZE) {
      ethTx.setEthereumData(ethData.toBytes());
    } else {
      let fileId = await createFile(ethData.callData, client);
      ethData.callData = new Uint8Array();
      ethTx.setEthereumData(ethData.toBytes()).setCallDataFileId(fileId);
    }
    const transaction = await ethTx
      .setEthereumData(ethData.toBytes())
      .setMaxGasAllowanceHbar(new Hbar(100))
      .freezeWith(client)
      .execute(client);

    const receipt = await transaction.getReceipt(client);
    const record = await transaction.getRecord(client);
    let evmAddress = null;
    if (record.contractFunctionResult?.evmAddress) {
      evmAddress = `0x${record.contractFunctionResult?.evmAddress.toString('hex')}`;
    }
    return {
      status: receipt.status.toString() === 'SUCCESS',
      gasUsed: Number(record.contractFunctionResult?.gasUsed) || 0,
      transactionId: record.transactionId.toString(),
      transactionHash: record.toJSON().transactionHash,
      contractId: record.contractFunctionResult?.contractId,
      evmAddress
    }
  },

  /**
   * @param {import('@hashgraph/sdk').Client} client
   * @param {string} bytecode
   * @param {ContractFunctionParameters|undefined} parameters
   * @returns {Promise<{ status: boolean, gasUsed: number, transactionId: string, transactionHash: string, contractId: import('@hashgraph/sdk').ContractId }>}
   */
  deploy: async function (client, bytecode, parameters) {
    const contractTx = await new ContractCreateFlow()
      .setBytecode(bytecode)
      .setGas(DEFAULT_GAS_LIMIT);
    if (parameters) contractTx.setConstructorParameters(parameters);
    const contractResponse = await contractTx.execute(client);
    const contractReceipt = await contractResponse.getReceipt(client);
    const record = await contractResponse.getRecord(client);
    return {
      status: contractReceipt.status.toString() === 'SUCCESS',
      gasUsed: (Number(record.contractFunctionResult?.gasUsed) || 0),
      transactionId: contractResponse.transactionId.toString(),
      transactionHash: contractResponse.toJSON().transactionHash,
      contractId: contractReceipt.contractId,
    }
  },

  /**
   * @param {import('@hashgraph/sdk').Client} client
   * @param {import('@hashgraph/sdk').ContractId} contractId
   * @param {string} method
   * @param {ContractFunctionParameters|undefined} parameters
   * @returns {Promise<{ status: boolean, gasUsed: number, transactionId: string, transactionHash: string, contractAddress: string }>}
   */
  call: async function (client, contractId, method, parameters) {
    const executeTx = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(DEFAULT_GAS_LIMIT)
      .setFunction(method, parameters);
    const response = await executeTx.execute(client);
    const receipt = await response.getReceipt(client);
    const record = await response.getRecord(client);
    return {
      status: receipt.status.toString() === 'SUCCESS',
      gasUsed: (Number(record.contractFunctionResult?.gasUsed) || 0),
      transactionId: response.transactionId.toString(),
      contractAddress: receipt.contractId.toSolidityAddress(),
      transactionHash: response.toJSON().transactionHash,
    }
  }
};
