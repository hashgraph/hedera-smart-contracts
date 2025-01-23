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

const Utils = require('../../hedera-token-service/utils');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../../constants');
const {
  Hbar,
  PrivateKey,
  AccountCreateTransaction,
} = require('@hashgraph/sdk');

describe('@HAS IHRC-632 Test Suite', () => {
  let walletA,
    walletB,
    walletC,
    aliasAccountUtility,
    sdkClient,
    walletAHederaAccountNumAlias;

  before(async () => {
    [walletA, walletB, walletC] = await ethers.getSigners();

    // deploy cyprtoAllowanceContract
    const AliasAccountUtilityFactory = await ethers.getContractFactory(
      Constants.Contract.AliasAccountUtility
    );
    aliasAccountUtility = await AliasAccountUtilityFactory.deploy();
    await aliasAccountUtility.waitForDeployment();

    sdkClient = await Utils.createSDKClient();

    const walletAAccountId = await Utils.getAccountId(
      walletA.address,
      sdkClient
    );

    walletAHederaAccountNumAlias =
      `0x` + (await Utils.convertAccountIdToLongZeroAddress(walletAAccountId));
  });

  describe('getEvmAddressAlias', () => {
    // skipping since there's a bug in getEvmAddressAlias in the services
    xit('Should execute getEvmAddressAliasPublic and get the corressponded evmAddressAlias', async () => {
      const tx = await aliasAccountUtility.getEvmAddressAliasPublic(
        walletAHederaAccountNumAlias,
        Constants.GAS_LIMIT_1_000_000
      );

      const receipt = await tx.wait();
      const evmAddressAliasLog = receipt.logs.find(
        (log) => log.fragment.name === 'AddressAliasResponse'
      ).args;

      expect(evmAddressAliasLog[0]).to.eq(22); // responseCode 22 = success
      expect(evmAddressAliasLog[1]).to.eq(walletA.address); // evm address
    });

    it('Should execute getEvmAddressAliasPublic with NOT long zero address and get INVALID_ACOUNT_ID', async () => {
      const tx = await aliasAccountUtility.getEvmAddressAliasPublic(
        walletA.address, // not a long zero address
        Constants.GAS_LIMIT_1_000_000
      );

      const receipt = await tx.wait();

      const evmAddressAlias = receipt.logs.find(
        (log) => log.fragment.name === 'AddressAliasResponse'
      ).args;
      expect(evmAddressAlias[0]).to.eq(15); // responseCode 15 = INVALID_ACCOUNT_ID
      expect(evmAddressAlias[1]).to.eq(ethers.ZeroAddress);
    });
  });

  describe('getHederaAccountNumAlias', () => {
    it('Should execute getHederaAccountNumAlias and get the corressponded accountNumAlias', async () => {
      const tx = await aliasAccountUtility.getHederaAccountNumAliasPublic(
        walletA.address,
        Constants.GAS_LIMIT_1_000_000
      );

      const receipt = await tx.wait();

      const evmAddressAliasLog = receipt.logs.find(
        (log) => log.fragment.name === 'AddressAliasResponse'
      ).args;

      expect(evmAddressAliasLog[0]).to.eq(22); // responseCode 22 = success
      expect(evmAddressAliasLog[1]).to.eq(walletAHederaAccountNumAlias); // evm address
    });

    it('Should execute getEvmAddressAliasPublic with not long zero address and get INVALID_ACOUNT_ID', async () => {
      const tx = await aliasAccountUtility.getEvmAddressAliasPublic(
        walletALongZeroAddress, // a long zero address
        walletAHederaAccountNumAlias, // a long zero address
        Constants.GAS_LIMIT_1_000_000
      );

      const receipt = await tx.wait();

      const evmAddressAlias = receipt.logs.find(
        (log) => log.fragment.name === 'AddressAliasResponse'
      ).args;
      expect(evmAddressAlias[0]).to.eq(15); // responseCode 15 = INVALID_ACCOUNT_ID
      expect(evmAddressAlias[1]).to.eq(ethers.ZeroAddress);
    });
  });

  describe('isValidAlias', () => {
    it('Should execute isValidAliasPublic with EVM address alias param and return TRUE', async () => {
      const tx = await aliasAccountUtility.isValidAliasPublic(
        walletA.address,
        Constants.GAS_LIMIT_1_000_000
      );

      const receipt = await tx.wait();

      const evmAddressAliasLog = receipt.logs.find(
        (log) => log.fragment.name === 'IsValidAliasResponse'
      ).args;

      expect(evmAddressAliasLog[0]).to.eq(22); // responseCode 22 = success
      expect(evmAddressAliasLog[1]).to.be.true;
    });

    it('Should execute isValidAliasPublic with Hedera Account Num Alias param and return TRUE', async () => {
      const tx = await aliasAccountUtility.isValidAliasPublic(
        walletAHederaAccountNumAlias,
        Constants.GAS_LIMIT_1_000_000
      );

      const receipt = await tx.wait();

      const evmAddressAliasLog = receipt.logs.find(
        (log) => log.fragment.name === 'IsValidAliasResponse'
      ).args;

      expect(evmAddressAliasLog[0]).to.eq(22); // responseCode 22 = success
      expect(evmAddressAliasLog[1]).to.be.true;
    });

    it('Should execute isValidAliasPublic with a non existed account param and return FALSE', async () => {
      const tx = await aliasAccountUtility.isValidAliasPublic(
        ethers.Wallet.createRandom().address,
        Constants.GAS_LIMIT_1_000_000
      );

      const receipt = await tx.wait();

      const evmAddressAliasLog = receipt.logs.find(
        (log) => log.fragment.name === 'IsValidAliasResponse'
      ).args;

      expect(evmAddressAliasLog[0]).to.eq(22); // responseCode 22 = success
      expect(evmAddressAliasLog[1]).to.be.false;
    });
  });

    const messageToSign = 'Hedera Account Service';
    const messageHashEC = ethers.hashMessage(messageToSign);
    const messageHashED = Buffer.from(messageToSign);
    const EDItems = [];

    before(async () => {
      for (let i = 0; i < 2; i++) {
        const newEdPK = PrivateKey.generateED25519();
        const newEdPubKey = newEdPK.publicKey;
        const client = await Utils.createSDKClient();

        const edSignerAccount = (
          await (
            await new AccountCreateTransaction()
              .setKey(newEdPubKey)
              .setInitialBalance(Hbar.fromTinybars(1000))
              .execute(client)
          ).getReceipt(client)
        ).accountId;
        const signerAlias = `0x${edSignerAccount.toSolidityAddress()}`;
        const signature = `0x${Buffer.from(newEdPK.sign(messageHashED)).toString('hex')}`;

        const obj = {
          signature,
          signerAlias,
        };

        EDItems.push(obj);
      }
    });

    it('Should verify message signature and return TRUE using isAuthorizedRawPublic for ECDSA account', async () => {
      const signature = await walletB.signMessage(messageToSign);
      expect(signature.slice(2).length).to.eq(65 * 2); // 65 bytes ECDSA signature

      const correctSignerReceipt = await (
        await aliasAccountUtility.isAuthorizedRawPublic(
          walletB.address, // correct signer
          messageHashEC,
          signature,
          Constants.GAS_LIMIT_1_000_000
        )
      ).wait();

      const correctSignerReceiptResponseCode = correctSignerReceipt.logs.find(
        (l) => l.fragment.name === 'ResponseCode'
      ).args[0];

      const correctSignerReceiptResponse = correctSignerReceipt.logs.find(
        (l) => l.fragment.name === 'IsAuthorizedRaw'
      ).args;

      expect(correctSignerReceiptResponseCode).to.eq(22n);
      expect(correctSignerReceiptResponse[0]).to.eq(walletB.address);
      expect(correctSignerReceiptResponse[1]).to.be.true;
    });

    it('Should verify message signature and return FALSE using isAuthorizedRawPublic for ECDSA account', async () => {
      const signature = await walletB.signMessage(messageToSign);
      expect(signature.slice(2).length).to.eq(65 * 2); // 65 bytes ECDSA signature

      const incorrectSignerReceipt = await (
        await aliasAccountUtility.isAuthorizedRawPublic(
          walletC.address, // incorrect signer
          messageHashEC,
          signature,
          Constants.GAS_LIMIT_1_000_000
        )
      ).wait();

      const incorrectSignerReceiptResponseCode =
        incorrectSignerReceipt.logs.find(
          (l) => l.fragment.name === 'ResponseCode'
        ).args[0];

      const incorrectSignerReceiptResponse = incorrectSignerReceipt.logs.find(
        (l) => l.fragment.name === 'IsAuthorizedRaw'
      ).args;

      expect(incorrectSignerReceiptResponseCode).to.eq(22n);
      expect(incorrectSignerReceiptResponse[0]).to.eq(walletC.address);
      expect(incorrectSignerReceiptResponse[1]).to.be.false;
    });

    it('Should verify message signature and return TRUE using isAuthorizedRawPublic for ED25519 account', async () => {
      const correctSignerReceipt = await (
        await aliasAccountUtility.isAuthorizedRawPublic(
          EDItems[0].signerAlias, // correct alias
          messageHashED,
          EDItems[0].signature, // correct signature
          Constants.GAS_LIMIT_10_000_000
        )
      ).wait();

      const correctSignerReceiptResponseCode = correctSignerReceipt.logs.find(
        (l) => l.fragment.name === 'ResponseCode'
      ).args[0];

      const correctSignerReceiptResponse = correctSignerReceipt.logs.find(
        (l) => l.fragment.name === 'IsAuthorizedRaw'
      ).args;

      expect(correctSignerReceiptResponseCode).to.eq(22n);
      expect(correctSignerReceiptResponse[0].toLowerCase()).to.eq(
        EDItems[0].signerAlias.toLowerCase()
      );
      expect(correctSignerReceiptResponse[1]).to.be.true;
    });

    it('Should verify message signature and return FALSE using isAuthorizedRawPublic for ED25519 account', async () => {
      const incorrectSignerReceipt = await (
        await aliasAccountUtility.isAuthorizedRawPublic(
          EDItems[0].signerAlias, // incorrect signer
          messageHashED,
          EDItems[1].signature, // different signature
          Constants.GAS_LIMIT_10_000_000
        )
      ).wait();

      const incorrectSignerReceiptResponseCode =
        incorrectSignerReceipt.logs.find(
          (l) => l.fragment.name === 'ResponseCode'
        ).args[0];

      const incorrectSignerReceiptResponse = incorrectSignerReceipt.logs.find(
        (l) => l.fragment.name === 'IsAuthorizedRaw'
      ).args;

      expect(incorrectSignerReceiptResponseCode).to.eq(22n);
      expect(incorrectSignerReceiptResponse[0].toLowerCase()).to.eq(
        EDItems[0].signerAlias.toLowerCase()
      );
      expect(incorrectSignerReceiptResponse[0].toLowerCase()).to.not.eq(
        EDItems[1].signerAlias.toLowerCase()
      );
      expect(incorrectSignerReceiptResponse[1]).to.be.false;
    });
  });
});
