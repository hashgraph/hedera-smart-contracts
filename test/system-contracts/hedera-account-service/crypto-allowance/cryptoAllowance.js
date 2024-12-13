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

const utils = require('../../hedera-token-service/utils');
const Utils = require('../../hedera-token-service/utils');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../../constants');
const {
  pollForNewSignerBalanceUsingProvider,
} = require('../../../../utils/helpers');
const {
  Hbar,
  PrivateKey,
  AccountCreateTransaction,
} = require('@hashgraph/sdk');

describe('@CryptoAllowance Test Suite', () => {
  let walletA,
    walletB,
    walletC,
    cryptoAllowanceContract,
    cryptoOwnerContract,
    cryptoAllowanceAddress,
    cryptoOwnerAddress;
  const amount = 3000;

  before(async () => {
    [walletA, walletB, walletC, receiver] = await ethers.getSigners();

    // deploy cyprtoAllowanceContract
    const CryptoAllowanceFactory = await ethers.getContractFactory(
      Constants.Contract.CryptoAllowance
    );
    cryptoAllowanceContract = await CryptoAllowanceFactory.deploy();
    await cryptoAllowanceContract.waitForDeployment();
    cryptoAllowanceAddress = cryptoAllowanceContract.target;

    // deploy cryptoOwnerContract
    const CryptoOwnerFactory = await ethers.getContractFactory(
      Constants.Contract.CryptoOwner
    );
    cryptoOwnerContract = await CryptoOwnerFactory.deploy();
    await cryptoOwnerContract.waitForDeployment();
    cryptoOwnerAddress = cryptoOwnerContract.target;

    // transfer funds to cryptoOwnerContract
    await (
      await walletA.sendTransaction({
        to: cryptoOwnerAddress,
        value: ethers.parseEther('30'),
        gasLimit: 1_000_000,
      })
    ).wait();
  });

  it('Should execute hbarApprovePublic and return success response code', async () => {
    const tx = await cryptoAllowanceContract.hbarApprovePublic(
      cryptoAllowanceAddress,
      walletA.address,
      amount,
      Constants.GAS_LIMIT_1_000_000
    );
    const receipt = await tx.wait();
    const responseCode = receipt.logs.find(
      (l) => l.fragment.name === 'ResponseCode'
    );
    expect(responseCode.args).to.deep.eq([22n]);
  });

  it('Should execute hbarAllowancePublic and return an event with the allowance information', async () => {
    const approveTx = await cryptoAllowanceContract.hbarApprovePublic(
      cryptoAllowanceAddress,
      walletB.address,
      amount,
      Constants.GAS_LIMIT_1_000_000
    );
    await approveTx.wait();

    const allowanceTx = await cryptoAllowanceContract.hbarAllowancePublic(
      cryptoAllowanceAddress,
      walletB.address,
      Constants.GAS_LIMIT_1_000_000
    );

    const receipt = await allowanceTx.wait();
    const responseCode = receipt.logs.find(
      (l) => l.fragment.name === 'ResponseCode'
    );
    const logs = receipt.logs.find((l) => l.fragment.name === 'HbarAllowance');

    expect(responseCode.args).to.deep.eq([22n]);
    expect(logs.args[0]).to.eq(cryptoAllowanceAddress);
    expect(logs.args[1]).to.eq(walletB.address);
    expect(logs.args[2]).to.eq(amount);
  });

  it('Should allow an approval on behalf of hbar owner WITH its signature', async () => {
    // update accountKeys
    const ecdsaPrivateKeys = await Utils.getHardhatSignersPrivateKeys(false);
    await utils.updateAccountKeysViaHapi(
      [cryptoAllowanceAddress],
      [ecdsaPrivateKeys[0]] // walletA's key
    );

    const approveTx = await cryptoAllowanceContract.hbarApprovePublic(
      walletA.address,
      walletB.address,
      amount,
      Constants.GAS_LIMIT_1_000_000
    );
    await approveTx.wait();

    const allowanceTx = await cryptoAllowanceContract.hbarAllowancePublic(
      walletA.address,
      walletB.address,
      Constants.GAS_LIMIT_1_000_000
    );

    const receipt = await allowanceTx.wait();
    const responseCode = receipt.logs.find(
      (l) => l.fragment.name === 'ResponseCode'
    );
    const logs = receipt.logs.find((l) => l.fragment.name === 'HbarAllowance');

    expect(responseCode.args).to.deep.eq([22n]);
    expect(logs.args[0]).to.eq(walletA.address);
    expect(logs.args[1]).to.eq(walletB.address);
    expect(logs.args[2]).to.eq(amount);
  });

  it('Should NOT allow an approval on behalf of hbar owner WITHOUT its signature', async () => {
    try {
      const tx = await cryptoAllowanceContract.hbarApprovePublic(
        walletB.address, // random EOA hbar owner
        walletC.address,
        amount,
        Constants.GAS_LIMIT_1_000_000
      );
      await tx.wait();
      expect(false).to.be.true;
    } catch (e) {
      expect(e).to.exist;
      expect(e.code).to.eq(Constants.CALL_EXCEPTION);
    }
  });

  it('Should allow owner to grant an allowance to spender using IHRC906Facade and spender to transfer allowance to receiver on behalf of owner', async () => {
    // set up IHRC906Facade
    const IHRC906Facade = new ethers.Interface(
      (await hre.artifacts.readArtifact('IHRC906Facade')).abi
    );

    const walletAIHRC906Facade = new ethers.Contract(
      walletA.address,
      IHRC906Facade,
      walletA
    );

    // grant an allowance to cryptoAllowanceContract
    const approveTx = await walletAIHRC906Facade.hbarApprove(
      cryptoAllowanceAddress,
      amount,
      Constants.GAS_LIMIT_1_000_000
    );
    await approveTx.wait();

    // cryptoTransferPublic
    const cryptoTransfers = {
      transfers: [
        {
          accountID: walletA.address,
          amount: amount * -1,
          isApproval: false,
        },
        {
          accountID: walletC.address,
          amount,
          isApproval: false,
        },
      ],
    };
    const tokenTransferList = [];

    const walletABefore = await walletA.provider.getBalance(walletA.address);
    const walletCBefore = await walletC.provider.getBalance(walletC.address);

    const cryptoTransferTx = await cryptoAllowanceContract.cryptoTransferPublic(
      cryptoTransfers,
      tokenTransferList,
      Constants.GAS_LIMIT_1_000_000
    );

    const cryptoTransferReceipt = await cryptoTransferTx.wait();

    const responseCode = cryptoTransferReceipt.logs.find(
      (l) => l.fragment.name === 'ResponseCode'
    ).args[0];

    const walletAAfter = await pollForNewSignerBalanceUsingProvider(
      walletA.provider,
      walletA.address,
      walletABefore
    );

    const walletCAfter = await pollForNewSignerBalanceUsingProvider(
      walletC.provider,
      walletC.address,
      walletCBefore
    );

    expect(responseCode).to.equal(22n);
    expect(walletABefore > walletAAfter).to.equal(true);
    expect(walletCBefore < walletCAfter).to.equal(true);
  });

  it('Should allow a crypto owner contract account to grant an allowance to a spender contract account to transfer allowance to a receiver on behalf of owner contract account', async () => {
    // crypto owner contract account's balance before the transfer
    const cryptoOwnerContractBalanceBefore =
      await ethers.provider.getBalance(cryptoOwnerAddress);
    // receiver's balance before the transfer
    const walletCBefore = await walletC.provider.getBalance(walletC.address);

    // initialize crypto transfer
    const tx = await cryptoOwnerContract.cryptoTransfer(
      cryptoAllowanceAddress,
      amount,
      walletC.address,
      Constants.GAS_LIMIT_1_000_000
    );

    // resolve logs
    const receipt = await tx.wait();
    const responseCode = receipt.logs.find(
      (l) => l.fragment.name === 'ResponseCode'
    ).args[0];

    // crypto owner contract account's balance after the transfer
    const cryptoOwnerContractBalanceAfter =
      await pollForNewSignerBalanceUsingProvider(
        ethers.provider,
        cryptoOwnerAddress,
        cryptoOwnerContractBalanceBefore
      );

    // receiver's balance after the transfer
    const walletCAfter = await pollForNewSignerBalanceUsingProvider(
      walletC.provider,
      walletC.address,
      walletCBefore
    );

    // assertion
    expect(responseCode).to.equal(22n);
    expect(walletCBefore < walletCAfter).to.equal(true);
    expect(
      cryptoOwnerContractBalanceBefore > cryptoOwnerContractBalanceAfter
    ).to.equal(true);
  });

  it('Should NOT allow a spender to spend hbar on behalf of owner without an allowance grant', async () => {
    const cryptoTransfers = {
      transfers: [
        {
          accountID: walletB.address,
          amount: amount * -1,
          isApproval: false,
        },
        {
          accountID: walletC.address,
          amount,
          isApproval: false,
        },
      ],
    };
    const tokenTransferList = [];

    try {
      const cryptoTransferTx = await cryptoAllowanceContract
        .connect(walletB)
        .cryptoTransferPublic(
          cryptoTransfers,
          tokenTransferList,
          Constants.GAS_LIMIT_1_000_000
        );
      await cryptoTransferTx.wait();
      expect(true).to.eq(false);
    } catch (e) {
      expect(e).to.exist;
      expect(e.code).to.eq(Constants.CALL_EXCEPTION);
    }
  });

  describe(`isAuthorizedRaw`, () => {
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
        await cryptoAllowanceContract.isAuthorizedRawPublic(
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
        await cryptoAllowanceContract.isAuthorizedRawPublic(
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
        await cryptoAllowanceContract.isAuthorizedRawPublic(
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
        await cryptoAllowanceContract.isAuthorizedRawPublic(
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
