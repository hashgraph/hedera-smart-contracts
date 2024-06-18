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
const utils  = require('./utils');
const htsUtils = require('../../hts-precompile/utils');
const hre = require('hardhat');
const { PrivateKey } = require('@hashgraph/sdk');

const TestEcrecover = async (initialKey, withAlias, changedTo) => {
  const address = `${await utils.deploy()}`;
  const network = htsUtils.getCurrentNetwork();
  const operatorId = hre.config.networks[network].sdkClient.operatorId;
  const operatorKey = PrivateKey.fromStringECDSA(hre.config.networks[network].sdkClient.operatorKey.replace('0x', ''));
  const client = await htsUtils.createSDKClient(operatorId, operatorKey);
  const account = await utils.createAccount(client, initialKey, withAlias);
  const initialResult = await utils.verifyEcrecover(
    address,
    client.setOperator(account.accountId, account.privateKey),
    utils.formatPrivateKey(account.privateKey),
  );
  if (changedTo === '' || !initialResult) { // Changing keys to the new ones was not requested, we can quit here.
    return initialResult;
  }
  account.privateKey = await utils.changeAccountKeys(account, changedTo);

  return await utils.verifyEcrecover(
    address,
    client.setOperator(account.accountId, account.privateKey),
    utils.formatPrivateKey(account.privateKey),
  );
}

describe('EcrecoverCheck', function () {
  describe('Deployment', function () {
    it('Should be deployed correctly', async function () {
      const address = await utils.deploy();
      expect(address).to.not.null;
    });
  });

  describe('Verification', function () {
    it(
      'Ecrecover should work correctly for account with ECDSA key and EVM alias derived from ECDSA key.',
      async function () {
        expect(await TestEcrecover('ECDSA', true, '')).to.true;
      }
    );

    it(
      'Ecrecover should fail for account with ECDSA key replaced by new ECDSA private key. EVMAlias (msg.sender) will remain the same but signer extracted with ecrecover will be derived from new key pair.',
      async function () {
        expect(await TestEcrecover('ECDSA', true, 'ECDSA')).to.false;
      }
    );

    it(
      'Ecrecover should fail for account with ECDSA key replaced by new ED25519 private key. EVMAlias (msg.sender) will remain the same but signer extracted with ecrecover will be some random value, because ecrecover will not work for ED25519 keys.',
      async function () {
        expect(await TestEcrecover('ECDSA', true, 'ED25519')).to.false;
      }
    );

    it(
      'Ecrecover should be broken for account with ECDSA key and default EVM alias. EVM alias is not connected in any way to the ECDSA key, so ecrecover result will not return it.',
      async function () {
        expect(await TestEcrecover('ECDSA', false, '')).to.false;
      }
    );

    it(
      'Ecrecover should be broken for ED25519 keys. No matter what they will be replaced with.',
      async function () {
        expect(await TestEcrecover('ED25519', false, '')).to.false;
        expect(await TestEcrecover('ED25519', false, 'ED25519')).to.false;
        expect(await TestEcrecover('ED25519', false, 'ECDSA')).to.false;
      },
    );
  });
});
