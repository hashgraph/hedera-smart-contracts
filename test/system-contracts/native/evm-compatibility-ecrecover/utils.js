/*-
 *
 * Hedera JSON RPC Relay - Hardhat Example
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

const { Signature, Wallet } = require('ethers');
const {
  PrivateKey,
  AccountCreateTransaction,
  Hbar,
  ContractCallQuery,
  ContractFunctionParameters,
  AccountUpdateTransaction,
} = require('@hashgraph/sdk');
const hre = require('hardhat');
const { ethers } = hre;
const htsUtils = require('../../hedera-token-service/utils');
const { arrayify } = require('@ethersproject/bytes');

class Utils {
  static sign = async (message, privateKey) => {
    const provider = ethers.getDefaultProvider();
    const signer = new Wallet(privateKey, provider);
    const flatSignature = await signer.signMessage(message);
    return Signature.from(flatSignature);
  };

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
      const ecrecoverCheck = await EcrecoverCheck.deploy();
      await ecrecoverCheck.waitForDeployment();
      const address = await ecrecoverCheck.getAddress();
      const contractQuery =
        Utils.getMirrorNodeUrl(network) + '/contracts/' + address;
      let result;
      let cnt = 0;
      while (cnt < 20 && (!result || result.status === 404)) {
        cnt++;
        result = await fetch(contractQuery);
        await new Promise((r) => setTimeout(r, 1000));
      }
      const json = await result.json();
      return json.contract_id;
    } catch (e) {
      return null;
    }
  }

  static QUERY_GAS = 100000;
  static QUERY_HBAR_PAYMENT = 2;

  static getAddressRecoveredFromEcRecover = async (
    contractId,
    client,
    message,
    signature
  ) => {
    const verifySignatureQuery = new ContractCallQuery()
      .setContractId(contractId)
      .setGas(Utils.QUERY_GAS)
      .setFunction(
        'verifySignature',
        new ContractFunctionParameters()
          .addString(message)
          .addUint8(signature.v)
          .addBytes32(arrayify(signature.r))
          .addBytes32(arrayify(signature.s))
      )
      .setQueryPayment(new Hbar(Utils.QUERY_HBAR_PAYMENT));
    const verifySignatureTransaction =
      await verifySignatureQuery.execute(client);
    return verifySignatureTransaction.getAddress();
  };

  static getMsgSenderAddress = async (contractId, client) => {
    const getSenderQuery = new ContractCallQuery()

      .setContractId(contractId)
      .setGas(Utils.QUERY_GAS)
      .setFunction('getSender')
      .setQueryPayment(new Hbar(Utils.QUERY_HBAR_PAYMENT));
    const getSenderTransaction = await getSenderQuery.execute(client);
    return getSenderTransaction.getAddress();
  };

  static async getMsgSenderAndEcRecover(contractId, client, privateKey) {
    const message = 'Test message';
    const addressRecoveredFromEcRecover =
      await Utils.getAddressRecoveredFromEcRecover(
        contractId,
        client,
        message,
        await Utils.sign(message, privateKey)
      );
    const msgSenderFromSmartContract = await Utils.getMsgSenderAddress(
      contractId,
      client
    );
    return { addressRecoveredFromEcRecover, msgSenderFromSmartContract };
  }

  static formatPrivateKey = (pk) => `0x${pk.toStringRaw()}`;

  static async changeAccountKeyType(account, keyType) {
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
    return await this.changeAccountKey(account, newPrivateKey);
  }

  static async changeAccountKey(account, newPrivateKey) {
    const network = htsUtils.getCurrentNetwork();
    const operatorId = hre.config.networks[network].sdkClient.operatorId;
    const operatorKey = PrivateKey.fromStringDer(
      hre.config.networks[network].sdkClient.operatorKey.replace('0x', '')
    );
    const client = await htsUtils.createSDKClient(operatorId, operatorKey);
    const newPublicKey = newPrivateKey.publicKey;
    const transaction = new AccountUpdateTransaction()
      .setAccountId(account.accountId)
      .setKey(newPublicKey)
      .freezeWith(client);
    let oldPrivateKey = account.privateKey;
    const signTx = await (
      await transaction.sign(oldPrivateKey)
    ).sign(newPrivateKey);
    const submitTx = await signTx.execute(client);
    await submitTx.getReceipt(client);
    return newPrivateKey;
  }

  static getMirrorNodeUrl(network) {
    switch (network) {
      case 'mainnet':
        return 'https://mainnet.mirrornode.hedera.com/api/v1';
      case 'testnet':
        return 'https://testnet.mirrornode.hedera.com/api/v1';
      case 'previewnet':
        return 'https://previewnet.mirrornode.hedera.com/api/v1';
      case 'local':
        return 'http://127.0.0.1:5551/api/v1';
      default:
        throw new Error('Unknown network');
    }
  }
}

module.exports = Utils;
