/*-
 *
 * Hedera Smart Contracts
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

const {
  Hbar,
  Status,
  PrivateKey,
  AccountInfoQuery,
  AccountCreateTransaction,
  AccountUpdateTransaction,
} = require('@hashgraph/sdk');
const { expect } = require('chai');
const Utils = require('../system-contracts/hedera-token-service/utils');

describe('Key Rotation Test Suite', function () {
  let client;
  let accountId_Alpha;
  let accountPrivateKey_Alpha;
  let accountPublicKey_Alpha;
  let accountEvmAddress_Alpha;

  beforeEach(async function () {
    client = await Utils.createSDKClient();

    // Generate a new ECDSA keys
    accountPrivateKey_Alpha = PrivateKey.generateECDSA();
    accountPublicKey_Alpha = accountPrivateKey_Alpha.publicKey;
    accountEvmAddress_Alpha = accountPublicKey_Alpha.toEvmAddress();

    // Create new account and assign the ECDSA public key as admin key
    const newAccountAlphaTx = await new AccountCreateTransaction()
      .setKey(accountPublicKey_Alpha)
      .setInitialBalance(Hbar.fromTinybars(1000))
      .setAlias(accountEvmAddress_Alpha)
      .execute(client);

    // Get the new account ID
    const newAccountAlphaTxRceipt = await newAccountAlphaTx.getReceipt(client);
    accountId_Alpha = newAccountAlphaTxRceipt.accountId;

    console.log('\n>>>>>>> accountId_Alpha <<<<<<<');
    console.log(`- accountId: ${accountId_Alpha}`);
    console.log(`- public key: ${accountPublicKey_Alpha}`);
    console.log(`- evm address: ${accountEvmAddress_Alpha}`);
  });

  it('Should remain the same EVM key alias after key rotation with a different ECDSA key', async function () {
    // Generate a new ECDSA key
    const accountPrivateKey_Beta = PrivateKey.generateECDSA();
    const accountPublicKey_Beta = accountPrivateKey_Beta.publicKey;
    const accountEvmAddress_Beta = accountPublicKey_Beta.toEvmAddress();

    // Create the transaction to rotate and change the key to a different ECDSA key
    const accountUpdateTransaction = new AccountUpdateTransaction()
      .setAccountId(accountId_Alpha)
      .setKey(accountPublicKey_Beta)
      .freezeWith(client);

    // Sign with the old key
    const signTxByAlpha = await accountUpdateTransaction.sign(
      accountPrivateKey_Alpha
    );

    // Sign with the new key
    const signTxByBeta = await signTxByAlpha.sign(accountPrivateKey_Beta);

    // Submit the transaction
    const txResponse = await signTxByBeta.execute(client);

    // Get the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    // Get the transaction consensus status
    const transactionStatus = receipt.status;
    expect(transactionStatus).to.equal(Status.Success);

    // Check the account info after key rotation
    const accountInfoAfterKeyRotation = await new AccountInfoQuery()
      .setAccountId(accountId_Alpha)
      .execute(client);

    console.log('>>>>>>> accountInfoAfterKeyRotation - ECDSA <<<<<<<');
    console.log(`- accountId: ${accountInfoAfterKeyRotation.accountId}`);
    console.log(`- public key: ${accountInfoAfterKeyRotation.key}`);
    console.log(
      `- evm address: ${accountInfoAfterKeyRotation.contractAccountId}`
    );

    // expect the account ID to be the same
    expect(accountInfoAfterKeyRotation.accountId).to.deep.equal(
      accountId_Alpha
    );

    // expect the key to be the new key
    expect(accountInfoAfterKeyRotation.key).to.deep.equal(
      accountPublicKey_Beta
    );

    // expect the key to not be the old key
    expect(accountInfoAfterKeyRotation.key).to.not.deep.equal(
      accountPublicKey_Alpha
    );

    // expect the contract account ID to be the same
    expect(accountInfoAfterKeyRotation.contractAccountId).to.equal(
      accountEvmAddress_Alpha
    );

    // expect the contract account ID to not be the old EVM address
    expect(accountInfoAfterKeyRotation.contractAccountId).to.not.equal(
      accountEvmAddress_Beta
    );
  });

  it('Should remain the same EVM key alias after key rotation with a different ED25519 key', async function () {
    // Generate a new ECDSA key
    const accountPrivateKey_Charlie = PrivateKey.generateED25519();
    const accountPublicKey_Charlie =
      accountPrivateKey_Charlie.publicKey.toStringDer();

    // Create the transaction to rotate and change the key to a different ED25519 key
    const accountUpdateTransaction = new AccountUpdateTransaction()
      .setAccountId(accountId_Alpha)
      .setKey(accountPrivateKey_Charlie.publicKey)
      .freezeWith(client);

    // Sign with the old key
    const signTxByAlpha = await accountUpdateTransaction.sign(
      accountPrivateKey_Alpha
    );

    // Sign with the new key
    const signTxByCharlie = await signTxByAlpha.sign(accountPrivateKey_Charlie);

    // Submit the transaction
    const txResponse = await signTxByCharlie.execute(client);

    // Get the receipt of the transaction
    const receipt = await txResponse.getReceipt(client);

    // Get the transaction consensus status
    const transactionStatus = receipt.status;
    expect(transactionStatus).to.equal(Status.Success);

    // Check the account info after key rotation
    const accountInfoAfterKeyRotation = await new AccountInfoQuery()
      .setAccountId(accountId_Alpha)
      .execute(client);

    console.log('>>>>>>> accountInfoAfterKeyRotation - ED25519 <<<<<<<');
    console.log(`- accountId: ${accountInfoAfterKeyRotation.accountId}`);
    console.log(`- public key: ${accountInfoAfterKeyRotation.key}`);
    console.log(
      `- evm address: ${accountInfoAfterKeyRotation.contractAccountId}`
    );

    // expect the account ID to be the same
    expect(accountInfoAfterKeyRotation.accountId).to.deep.equal(
      accountId_Alpha
    );

    // expect the key to be the new key
    expect(accountInfoAfterKeyRotation.key.toStringDer()).to.deep.equal(
      accountPublicKey_Charlie
    );

    // expect the key to not be the old key
    expect(accountInfoAfterKeyRotation.key).to.not.deep.equal(
      accountPublicKey_Alpha
    );

    // expect the contract account ID to be the same
    expect(accountInfoAfterKeyRotation.contractAccountId).to.equal(
      accountEvmAddress_Alpha
    );
  });
});
