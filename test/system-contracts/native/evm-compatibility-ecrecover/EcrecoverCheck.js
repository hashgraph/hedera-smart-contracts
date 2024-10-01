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

const { expect } = require('chai');
const utils = require('./utils');
const htsUtils = require('../../hedera-token-service/utils');
const hre = require('hardhat');
const { PrivateKey } = require('@hashgraph/sdk');

describe('EcrecoverCheck', function () {
  let address;
  let client;

  before(async () => {
    address = await utils.deploy();
  });

  const initializeAccount = async (keyType, withAlias) => {
    const network = htsUtils.getCurrentNetwork();
    const operatorId = hre.config.networks[network].sdkClient.operatorId;
    const operatorKey = PrivateKey.fromStringDer(
      hre.config.networks[network].sdkClient.operatorKey.replace('0x', '')
    );
    client = await htsUtils.createSDKClient(operatorId, operatorKey);
    const account = await utils.createAccount(client, keyType, withAlias);
    client.setOperator(account.accountId, account.privateKey);
    return account;
  };

  /**
   * This method will sign a sample message and extract its signer using ecrecover.
   *
   * @param {Object} account - The account object containing the private key.
   * @returns {Promise<string>} - The recovered address of the signer.
   */
  const ecrecover = async (account) => {
    const message = 'Test message';
    return await utils.getAddressRecoveredFromEcRecover(
      address,
      client,
      message,
      await utils.sign(message, utils.formatPrivateKey(account.privateKey))
    );
  };

  const msgSender = () => utils.getMsgSenderAddress(address, client);

  const changeAccountKeyType = async (account, keyType) => {
    account.privateKey = await utils.changeAccountKeyType(account, keyType);
    client.setOperator(account.accountId, account.privateKey);
  };

  describe('Deployment', function () {
    it('Should be deployed correctly', async function () {
      expect(address).to.not.null;
    });
  });

  describe('Verification', function () {
    it('Ecrecover should work correctly for account with ECDSA key and EVM alias derived from ECDSA key.', async function () {
      const account = await initializeAccount('ECDSA', true);
      expect(await ecrecover(account)).to.equals(await msgSender());
    });

    it('Ecrecover should fail for account with ECDSA key replaced by new ECDSA private key. EVMAlias (msg.sender) will remain the same but signer extracted with ecrecover will be derived from new key pair.', async function () {
      const account = await initializeAccount('ECDSA', true);
      expect(await ecrecover(account)).to.equals(await msgSender());
      await changeAccountKeyType(account, 'ECDSA');
      expect(await ecrecover(account)).to.not.equals(await msgSender());
    });

    it('Ecrecover should fail for account with ECDSA key replaced by new ED25519 private key. EVMAlias (msg.sender) will remain the same but signer extracted with ecrecover will be some random value, because ecrecover will not work for ED25519 keys.', async function () {
      const account = await initializeAccount('ECDSA', true);
      expect(await ecrecover(account)).to.equals(await msgSender());
      await changeAccountKeyType(account, 'ED25519');
      expect(await ecrecover(account)).to.not.equals(await msgSender());
    });

    it('Ecrecover should be broken for account with ECDSA key and default EVM alias. EVM alias is not connected in any way to the ECDSA key, so ecrecover result will not return it.', async function () {
      const account = await initializeAccount('ECDSA', false);
      expect(await ecrecover(account)).to.not.equals(await msgSender());
    });

    it('Ecrecover should be broken for ED25519 keys. No matter what they will be replaced with.', async function () {
      const ed25519 = await initializeAccount('ED25519', false);
      expect(await ecrecover(ed25519)).to.not.equals(await msgSender());

      await changeAccountKeyType(ed25519, 'ED25519');
      expect(await ecrecover(ed25519)).to.not.equals(await msgSender());

      const ed25519ToEcdsa = await initializeAccount('ED25519', false);
      await initializeAccount('ED25519', false);

      await changeAccountKeyType(ed25519ToEcdsa, 'ECDSA');
      expect(await ecrecover(ed25519ToEcdsa)).to.not.equals(await msgSender());
    });

    it('Ecrecover should work correctly when reverting to previous ECDSA key for which ecrecover used to work.', async function () {
      const account = await initializeAccount('ECDSA', true);
      expect(await ecrecover(account)).to.equals(await msgSender());

      const initialCorrectPrivateKey = account.privateKey;
      await changeAccountKeyType(account, 'ED25519');

      expect(await ecrecover(account)).to.not.equals(await msgSender());

      await utils.changeAccountKey(account, initialCorrectPrivateKey);
      account.privateKey = initialCorrectPrivateKey;
      client.setOperator(account.accountId, initialCorrectPrivateKey);

      expect(await ecrecover(account)).to.equals(await msgSender());
    });
  });
});
