const { Signature, Wallet } = require('ethers');
const { PrivateKey, AccountCreateTransaction, Hbar, ContractCallQuery, ContractFunctionParameters, AccountUpdateTransaction } = require('@hashgraph/sdk');
const hre = require('hardhat');
const { ethers } = hre;
const htsUtils = require('../../hts-precompile/utils');

class Utils {
  static arrayify = (hexString) => {
    if (!hexString.startsWith('0x')) {
      throw new Error('Hex string must start with 0x');
    }
    if ((hexString.length % 2) !== 0) {
      throw new Error('Hex string must have an even length');
    }
    const bytes = new Uint8Array((hexString.length - 2) / 2);
    for (let i = 2; i < hexString.length; i += 2) {
      bytes[(i - 2) / 2] = parseInt(hexString.slice(i, i + 2), 16);
    }
    return bytes;
  }

  static sign = async (message, privateKey) => {
    const provider = ethers.getDefaultProvider();
    const signer = new Wallet(privateKey, provider);
    const flatSignature = await signer.signMessage(message);
    return Signature.from(flatSignature);
  }

  static async createAccount(operator, keyType, withAlias) {
    let newPrivateKey;
    switch (keyType) {
      case 'ED25519': {
        newPrivateKey = PrivateKey.generateED25519();
        break;
      }
      case 'ECDSA': {
        newPrivateKey = PrivateKey.generateECDSA();
        break;
      }
      default: {
        throw new Error('Unsupported key type');
      }
    }
    const newPublicKey = newPrivateKey.publicKey;
    if (withAlias) {
      newPublicKey.toAccountId(0, 0);
    }

    const transaction = new AccountCreateTransaction()
      .setKey(newPublicKey)
      .setInitialBalance(new Hbar(20));
    if (withAlias) {
      transaction.setAlias(newPrivateKey.publicKey.toEvmAddress());
    }
    const response = await transaction.execute(operator);
    return {
      accountId: (await response.getReceipt(operator)).accountId,
      privateKey: newPrivateKey,
      accountType: keyType,
    };
  }

  static async deploy() {
    const EcrecoverCheck = await ethers.getContractFactory('EcrecoverCheck');
    try {
      const network = hre.network.name;
      const { mirrorNode } = hre.config.networks[network].sdkClient;
      const ecrecoverCheck = await EcrecoverCheck.deploy();
      await ecrecoverCheck.waitForDeployment();
      const address = await ecrecoverCheck.getAddress();
      const contractQuery = (!mirrorNode.startsWith('http://') && !mirrorNode.startsWith('https://') ? 'https://' + mirrorNode: mirrorNode) + '/api/v1/contracts/' + address;
      const result = await fetch(contractQuery);
      const json = await result.json();
      return json.contract_id;
    } catch (e) {
      return null;
    }
  }

  static QUERY_GAS = 100000
  static QUERY_HBAR_PAYMENT = 2

  static getAddressRecoveredFromEcRecover = async (
    contractId,
    client,
    message,
    signature,
  ) => {
    const verifySignatureQuery = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(Utils.QUERY_GAS)
      .setFunction(
        'verifySignature',
        new ContractFunctionParameters()
          .addString(message)
          .addUint8(signature.v)
          .addBytes32(Utils.arrayify(signature.r))
          .addBytes32(Utils.arrayify(signature.s)),
      )
      .setQueryPayment(new Hbar(Utils.QUERY_HBAR_PAYMENT));
    const verifySignatureTransaction = await verifySignatureQuery.execute(client);
    return verifySignatureTransaction.getAddress();
  }

  static getMsgSenderAddress = async (contractId, client) => {
    const getSenderQuery = new ContractCallQuery()

      .setContractId(contractId)
      .setGas(Utils.QUERY_GAS)
      .setFunction('getSender')
      .setQueryPayment(new Hbar(Utils.QUERY_HBAR_PAYMENT));
    const getSenderTransaction = await getSenderQuery.execute(client);
    return getSenderTransaction.getAddress();
  }

  static async verifyEcrecover(contractId, client, privateKey) {
    const message = 'Test message';
    const addressRecoveredFromEcRecover = await Utils.getAddressRecoveredFromEcRecover(
      contractId,
      client,
      message,
      await Utils.sign(message, privateKey)
    );
    const msgSenderFromSmartContract = await Utils.getMsgSenderAddress(contractId, client);
    return addressRecoveredFromEcRecover === msgSenderFromSmartContract;
  }

  static formatPrivateKey = (pk) => `0x${pk.toStringRaw()}`;

  static async changeAccountKeys(account, keyType) {
    const network = htsUtils.getCurrentNetwork();
    const operatorId = hre.config.networks[network].sdkClient.operatorId;
    const operatorKey = PrivateKey.fromStringECDSA(hre.config.networks[network].sdkClient.operatorKey.replace('0x', ''));
    const client = await htsUtils.createSDKClient(operatorId, operatorKey);
    let newPrivateKey;
    switch (keyType) {
      case 'ED25519': {
        newPrivateKey = PrivateKey.generateED25519();
        break;
      }
      case 'ECDSA': {
        newPrivateKey = PrivateKey.generateECDSA();
        break;
      }
      default: {
        throw new Error('Unsupported key type');
      }
    }
    const newPublicKey = newPrivateKey.publicKey;
    const transaction = new AccountUpdateTransaction()
      .setAccountId(account.accountId)
      .setKey(newPublicKey)
      .freezeWith(client);
    let oldPrivateKey = account.privateKey;
    const signTx = await(await transaction.sign(oldPrivateKey)).sign(newPrivateKey);
    const submitTx = await signTx.execute(client);
    await submitTx.getReceipt(client);
    return newPrivateKey;
  }
}

module.exports = Utils;
