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
  KeyList,
} = require('@hashgraph/sdk');
const path = require('path');
const protobuf = require('protobufjs');

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
      expect(evmAddressAliasLog[1].toLowerCase()).to.eq(
        walletAHederaAccountNumAlias
      ); // evm address
    });

    it('Should execute getEvmAddressAliasPublic with not long zero address and get INVALID_ACOUNT_ID', async () => {
      const tx = await aliasAccountUtility.getEvmAddressAliasPublic(
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

  describe(`IsAuthorizedRaw`, () => {
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

      const correctSignerReceiptResponse = correctSignerReceipt.logs.find(
        (l) => l.fragment.name === 'AccountAuthorizationResponse'
      ).args;

      expect(correctSignerReceiptResponse[0]).to.eq(22);
      expect(correctSignerReceiptResponse[1]).to.eq(walletB.address);
      expect(correctSignerReceiptResponse[2]).to.be.true;
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

      const incorrectSignerReceiptResponse = incorrectSignerReceipt.logs.find(
        (l) => l.fragment.name === 'AccountAuthorizationResponse'
      ).args;

      expect(incorrectSignerReceiptResponse[0]).to.eq(22);
      expect(incorrectSignerReceiptResponse[1]).to.eq(walletC.address);
      expect(incorrectSignerReceiptResponse[2]).to.be.false;
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

      const correctSignerReceiptResponse = correctSignerReceipt.logs.find(
        (l) => l.fragment.name === 'AccountAuthorizationResponse'
      ).args;

      expect(correctSignerReceiptResponse[0]).to.eq(22);
      expect(correctSignerReceiptResponse[1].toLowerCase()).to.eq(
        EDItems[0].signerAlias.toLowerCase()
      );
      expect(correctSignerReceiptResponse[2]).to.be.true;
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

      const incorrectSignerReceiptResponse = incorrectSignerReceipt.logs.find(
        (l) => l.fragment.name === 'AccountAuthorizationResponse'
      ).args;

      expect(incorrectSignerReceiptResponse[0]).to.eq(22);
      expect(incorrectSignerReceiptResponse[1].toLowerCase()).to.eq(
        EDItems[0].signerAlias.toLowerCase()
      );
      expect(incorrectSignerReceiptResponse[1].toLowerCase()).to.not.eq(
        EDItems[1].signerAlias.toLowerCase()
      );
      expect(incorrectSignerReceiptResponse[2]).to.be.false;
    });
  });

  // The isAuthorized function is responsible for verifying message signatures against the keys associated with a Hedera account.
  // This function is particularly complex as it accommodates various signature types available in the Hedera ecosystem, including ECDSA and ED25519.
  //
  // The function takes an address, a message, and a signatureBlob as inputs. The signatureBlob contains one or more signatures encoded in protobuf format, which correspond to the provided message.
  //
  // It is important to note that calls to this method incur additional gas charges, which are determined by the resource cost of validating each signature, along with the variable cost associated with performing a cryptographic hash on the message.
  // The tests for this function encompass:
  // - Verifying individual signatures from ECDSA and ED25519 keys
  // - Validating signatures from threshold keys that include multiple ECDSA and ED25519 keys
  // - Managing cases of unauthorized signatures
  // The function utilizes protobuf encoding to create signature blobs that conform to the SignatureMap message format.
  describe(`IsAuthorized`, () => {
    // raw messageToSign
    const messageToSign = 'Hedera Account Service';

    before(async () => {
      // Load and compile protobuf definitions
      const signatureMapProto = path.resolve(__dirname, 'signature_map.proto');
      root = await protobuf.load(signatureMapProto);
      SignatureMap = root.lookupType('SignatureMap');
    });

    // Helper function to create a signature blob which align with the SignatureMap protobuf message struct
    const createSignatureBlob = (signatures) => {
      const sigPairs = signatures.map((sig) => ({
        pubKeyPrefix: Buffer.from(sig.pubKeyPrefix),
        [sig.signatureType]: Buffer.from(sig.signatureValue),
      }));

      const message = SignatureMap.create({ sigPair: sigPairs });

      const encodedMessage = SignatureMap.encode(message).finish();

      return encodedMessage;
    };

    const prepareSigBlobData = async (
      sdkClient,
      signatureTypes,
      unauthorized = false
    ) => {
      let keyData = {
        pubKeys: [],
        signatureBlobDatas: [],
      };

      // loop through signatureTypes to prepare
      signatureTypes.forEach((sigType) => {
        if (sigType !== 'ECDSAsecp256k1' && sigType !== 'ed25519') {
          throw new Error('Invalid signature type.');
        }

        const privateKey =
          sigType === 'ECDSAsecp256k1'
            ? PrivateKey.generateECDSA()
            : PrivateKey.generateED25519();

        // Extract public key prefix from private key
        const pubKey = privateKey.publicKey;
        const pubKeyBytes = pubKey.toBytesRaw();
        const pubKeyPrefix = pubKeyBytes.slice(0, 32);

        // Sign message using private key
        let signature = privateKey.sign(Buffer.from(messageToSign, 'utf-8'));

        // create unauthorized signature if unauthorized is set to true
        if (unauthorized) {
          // create a new random key. This key will not be included in the threshold key during account creation and signatureBlob creation
          const unauthorizedKey = PrivateKey.generateECDSA();

          // re-assign signature with a new one signed by the `unauthorizedKey`
          signature = unauthorizedKey.sign(Buffer.from(messageToSign, 'utf-8'));
        }

        // Create signature blob data
        // depends on `unauthorized`, this signatureBlobData might be invalid as pubKeyPrefix and signature don't match if `unauthorized` is true
        const signatureBlobData = {
          pubKeyPrefix: pubKeyPrefix,
          signatureType: sigType,
          signatureValue: signature,
        };

        keyData.pubKeys.push(pubKey);
        keyData.signatureBlobDatas.push(signatureBlobData);
      });

      // Create a threshold key with both public keys
      const thresholdKey = new KeyList(
        [...keyData.pubKeys],
        keyData.pubKeys.length
      );

      // Create new account with the new key
      const accountCreateTx = await new AccountCreateTransaction()
        .setKey(thresholdKey)
        .setInitialBalance(Hbar.fromTinybars(1000))
        .execute(sdkClient);
      const receipt = await accountCreateTx.getReceipt(sdkClient);
      const newAccount = receipt.accountId;
      const accountAddress = `0x${newAccount.toSolidityAddress()}`;

      // Create signature blob
      const signatureBlob = createSignatureBlob(keyData.signatureBlobDatas);

      return { accountAddress, signatureBlob };
    };

    it('Should verify message signature and return TRUE using isAuthorized for ECDSA key', async () => {
      const sigBlobData = await prepareSigBlobData(sdkClient, [
        'ECDSAsecp256k1',
      ]);

      const tx = await aliasAccountUtility.isAuthorizedPublic(
        sigBlobData.accountAddress,
        Buffer.from(messageToSign, 'utf-8'),
        sigBlobData.signatureBlob,
        Constants.GAS_LIMIT_10_000_000
      );
      const txReceipt = await tx.wait();

      const accountAuthorizationResponse = txReceipt.logs.find(
        (l) => l.fragment.name === 'AccountAuthorizationResponse'
      ).args;

      expect(accountAuthorizationResponse[0]).to.eq(22);
      expect(accountAuthorizationResponse[1].toLowerCase()).to.eq(
        sigBlobData.accountAddress.toLowerCase()
      );
      expect(accountAuthorizationResponse[2]).to.be.true;
    });

    it('Should verify message signature and return TRUE using isAuthorized for ED25519 key', async () => {
      const sigBlobData = await prepareSigBlobData(sdkClient, ['ed25519']);

      const tx = await aliasAccountUtility.isAuthorizedPublic(
        sigBlobData.accountAddress,
        Buffer.from(messageToSign, 'utf-8'),
        sigBlobData.signatureBlob,
        Constants.GAS_LIMIT_10_000_000
      );
      const txReceipt = await tx.wait();

      const accountAuthorizationResponse = txReceipt.logs.find(
        (l) => l.fragment.name === 'AccountAuthorizationResponse'
      ).args;

      expect(accountAuthorizationResponse[0]).to.eq(22);
      expect(accountAuthorizationResponse[1].toLowerCase()).to.eq(
        sigBlobData.accountAddress.toLowerCase()
      );
      expect(accountAuthorizationResponse[2]).to.be.true;
    });

    it('Should verify message signature and return TRUE using isAuthorized for threshold key includes multiple ED25519 and ECDSA keys', async () => {
      const sigBlobData = await prepareSigBlobData(sdkClient, [
        'ECDSAsecp256k1',
        'ed25519',
        'ed25519',
        'ed25519',
        'ECDSAsecp256k1',
        'ECDSAsecp256k1',
        'ed25519',
        'ECDSAsecp256k1',
      ]);

      const tx = await aliasAccountUtility.isAuthorizedPublic(
        sigBlobData.accountAddress,
        Buffer.from(messageToSign, 'utf-8'),
        sigBlobData.signatureBlob,
        Constants.GAS_LIMIT_10_000_000
      );
      const txReceipt = await tx.wait();

      const accountAuthorizationResponse = txReceipt.logs.find(
        (l) => l.fragment.name === 'AccountAuthorizationResponse'
      ).args;

      expect(accountAuthorizationResponse[0]).to.eq(22);
      expect(accountAuthorizationResponse[1].toLowerCase()).to.eq(
        sigBlobData.accountAddress.toLowerCase()
      );
      expect(accountAuthorizationResponse[2]).to.be.true;
    });

    it('Should FAIL to verify message signature and return FALSE using isAuthorized for unauthorized key', async () => {
      const sigBlobData = await prepareSigBlobData(
        sdkClient,
        ['ECDSAsecp256k1'],
        true // set unauthorized to true
      );

      const tx = await aliasAccountUtility.isAuthorizedPublic(
        sigBlobData.accountAddress,
        Buffer.from(messageToSign, 'utf-8'),
        sigBlobData.signatureBlob,
        Constants.GAS_LIMIT_10_000_000
      );
      const txReceipt = await tx.wait();

      const accountAuthorizationResponse = txReceipt.logs.find(
        (l) => l.fragment.name === 'AccountAuthorizationResponse'
      ).args;

      expect(accountAuthorizationResponse[0]).to.eq(22);
      expect(accountAuthorizationResponse[1].toLowerCase()).to.eq(
        sigBlobData.accountAddress.toLowerCase()
      );
      expect(accountAuthorizationResponse[2]).to.be.false; // unauthorized
    });
  });
});
