/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
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

const {expect} = require('chai');
const {ethers} = require('hardhat');
const Utils = require('../system-contracts/hedera-token-service/utils');
const Constants = require('../constants');
const HashgraphProto = require('@hashgraph/proto');

const {
  ScheduleCreateTransaction,
  TransferTransaction,
  Hbar,
  HbarUnit,
  PrivateKey
} = require('@hashgraph/sdk');

const convertScheduleIdToUint8Array = (scheduleId) => {
  const [shard, realm, num] = scheduleId.split('.');

  // size of the buffer is aligned with the services scheduleId to bytes conversion
  // https://github.com/hiero-ledger/hiero-consensus-node/blob/main/hedera-node/hedera-smart-contract-service-impl/src/main/java/com/hedera/node/app/service/contract/impl/utils/SystemContractUtils.java#L153
  const buffer = new ArrayBuffer(24);
  const dataView = new DataView(buffer);

  dataView.setBigUint64(0, BigInt(shard));
  dataView.setBigUint64(8, BigInt(realm));
  dataView.setBigUint64(16, BigInt(num));

  return new Uint8Array(buffer);
};

const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

describe('HIP755 Test Suite', function () {
  let genesisSdkClient, signers, signerSender, signerReceiver;

  before(async () => {
    genesisSdkClient = await Utils.createSDKClient();
    signers = await ethers.getSigners();
    signerSender = signers[0];
    signerReceiver = signers[1];
  });

  it('should be able to signSchedule via IHRC755ScheduleFacade', async () => {
    const senderInfo = await Utils.getAccountInfo(signerSender.address, genesisSdkClient);
    const receiverInfo = await Utils.getAccountInfo(signerReceiver.address, genesisSdkClient);

    const amount = getRandomInt(1, 100_000_000);
    const amountAsWeibar = BigInt(amount) * BigInt(Utils.tinybarToWeibarCoef);
    let transferTx = await new TransferTransaction()
        .addHbarTransfer(senderInfo.accountId, new Hbar(-amount, HbarUnit.Tinybar))
        .addHbarTransfer(receiverInfo.accountId, new Hbar(amount, HbarUnit.Tinybar));

    const {scheduleId} = await (await new ScheduleCreateTransaction()
        .setScheduledTransaction(transferTx)
        .execute(genesisSdkClient)).getReceipt(genesisSdkClient);

    const senderBalanceBefore = await signers[0].provider.getBalance(signerSender);
    const receiverBalanceBefore = await signers[0].provider.getBalance(signerReceiver);

    const contract = await ethers.getContractAt(
        'IHRC755ScheduleFacade',
        Utils.convertAccountIdToLongZeroAddress(scheduleId.toString(), true),
        signerSender
    );
    const signScheduleTx = await contract.signSchedule(Constants.GAS_LIMIT_2_000_000);
    await signScheduleTx.wait();

    const senderBalanceAfter = await signers[0].provider.getBalance(signerSender);
    const receiverBalanceAfter = await signers[0].provider.getBalance(signerReceiver);

    expect(receiverBalanceBefore).to.not.equal(receiverBalanceAfter);
    expect(senderBalanceBefore).to.not.equal(senderBalanceAfter);
    expect(senderBalanceAfter + amountAsWeibar).to.be.lessThanOrEqual(senderBalanceBefore);
    expect(receiverBalanceBefore + amountAsWeibar).to.equal(receiverBalanceAfter);
  });

  it('should be able to signSchedule via HRC755 contract', async () => {
    const senderInfo = await Utils.getAccountInfo(signerSender.address, genesisSdkClient);
    const receiverInfo = await Utils.getAccountInfo(signerReceiver.address, genesisSdkClient);

    const contractHRC755Factory = await ethers.getContractFactory('HRC755Contract');
    const contractHRC755 = await contractHRC755Factory.deploy();
    await contractHRC755.waitForDeployment();

    const amount = getRandomInt(1, 100_000_000);
    const amountAsWeibar = BigInt(amount) * BigInt(Utils.tinybarToWeibarCoef);
    let transferTx = await new TransferTransaction()
        .addHbarTransfer(senderInfo.accountId, new Hbar(-amount, HbarUnit.Tinybar))
        .addHbarTransfer(receiverInfo.accountId, new Hbar(amount, HbarUnit.Tinybar));

    const {scheduleId} = await (await new ScheduleCreateTransaction()
        .setScheduledTransaction(transferTx)
        .execute(genesisSdkClient)).getReceipt(genesisSdkClient);

    const privateKey = PrivateKey.fromStringECDSA(Utils.getHardhatSignerPrivateKeyByIndex(0));
    const scheduleIdAsBytes = convertScheduleIdToUint8Array(scheduleId.toString());
    const sigMapProtoEncoded = await HashgraphProto.proto.SignatureMap.encode({
      sigPair: [{
        pubKeyPrefix: privateKey.publicKey.toBytesRaw(),
        ECDSASecp256k1: privateKey.sign(scheduleIdAsBytes)
      }]
    }).finish();

    const senderBalanceBefore = await signers[0].provider.getBalance(signerSender);
    const receiverBalanceBefore = await signers[0].provider.getBalance(signerReceiver);

    const signScheduleCallTx = await contractHRC755.signScheduleCall(
        Utils.convertAccountIdToLongZeroAddress(scheduleId.toString(), true),
        sigMapProtoEncoded,
        Constants.GAS_LIMIT_2_000_000
    );
    await signScheduleCallTx.wait();

    const senderBalanceAfter = await signers[0].provider.getBalance(signerSender);
    const receiverBalanceAfter = await signers[0].provider.getBalance(signerReceiver);

    expect(receiverBalanceBefore).to.not.equal(receiverBalanceAfter);
    expect(senderBalanceBefore).to.not.equal(senderBalanceAfter);
    expect(senderBalanceAfter + amountAsWeibar).to.be.lessThanOrEqual(senderBalanceBefore);
    expect(receiverBalanceBefore + amountAsWeibar).to.equal(receiverBalanceAfter);
  });
});
