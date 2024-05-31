const { QUERY_GAS, QUERY_HBAR_PAYMENT } = require('./config');
const { Hbar } = require('@hashgraph/sdk');
const { ContractCallQuery, ContractFunctionParameters } = require('@hashgraph/sdk');
const { arrayify }  = require('../utils/arrayify');
const { sign }  = require('../utils/sign');

const getAddressRecoveredFromEcRecover = async (
  contractId,
  client,
  message,
  signature,
) => {
    const verifySignatureQuery = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(QUERY_GAS)
      .setFunction(
        'verifySignature',
        new ContractFunctionParameters()
          .addString(message)
          .addUint8(signature.v)
          .addBytes32(arrayify(signature.r))
          .addBytes32(arrayify(signature.s)),
      )
      .setQueryPayment(new Hbar(QUERY_HBAR_PAYMENT));
    const verifySignatureTransaction = await verifySignatureQuery.execute(client);
    return verifySignatureTransaction.getAddress();
}

const getMsgSenderAddress = async (contractId, client) => {
    const getSenderQuery = new ContractCallQuery()

      .setContractId(contractId)
      .setGas(QUERY_GAS)
      .setFunction('getSender')
      .setQueryPayment(new Hbar(QUERY_HBAR_PAYMENT));
    const getSenderTransaction = await getSenderQuery.execute(client);
    return getSenderTransaction.getAddress();
}

async function verifyEcrecover(contractId, client, privateKey) {
    const message = 'Test message';
    const addressRecoveredFromEcRecover = await getAddressRecoveredFromEcRecover(
      contractId,
      client,
      message,
      await sign(message, privateKey)
    );
    const msgSenderFromSmartContract = await getMsgSenderAddress(contractId, client);
    return addressRecoveredFromEcRecover === msgSenderFromSmartContract;
}

export { verifyEcrecover };
