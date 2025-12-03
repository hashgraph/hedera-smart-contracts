// SPDX-License-Identifier: Apache-2.0

const {expect} = require('chai');
const {ethers} = require('hardhat');
const Utils = require('../../hedera-token-service/utils');
const Constants = require('../../../constants');
const HashgraphProto = require('@hashgraph/proto');

const {
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

describe('HIP755 Test Suite', function () {
  let genesisSdkClient, signers, signerSender, signerReceiver, senderInfo, receiverInfo, contractHRC755;

  before(async () => {
    genesisSdkClient = await Utils.createSDKClient();
    signers = await ethers.getSigners();
    signerSender = signers[0];
    signerReceiver = signers[1];

    senderInfo = await Utils.getAccountInfo(signerSender.address, genesisSdkClient);
    receiverInfo = await Utils.getAccountInfo(signerReceiver.address, genesisSdkClient);

    const contractHRC755Factory = await ethers.getContractFactory('HRC755Contract');
    contractHRC755 = await contractHRC755Factory.deploy();
    await contractHRC755.waitForDeployment();
  });

  it('should be able to signSchedule via IHRC755ScheduleFacade', async () => {
    const {
      scheduleId,
      transferAmountAsWeibar
    } = await Utils.createScheduleTransactionForTransfer(senderInfo, receiverInfo, genesisSdkClient);

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
    expect(senderBalanceAfter + transferAmountAsWeibar).to.be.lessThanOrEqual(senderBalanceBefore);
    expect(receiverBalanceBefore + transferAmountAsWeibar).to.equal(receiverBalanceAfter);
  });

  it('should be able to signSchedule via HRC755 contract', async () => {
    const {
      scheduleId,
      transferAmountAsWeibar
    } = await Utils.createScheduleTransactionForTransfer(senderInfo, receiverInfo, genesisSdkClient);

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
    expect(senderBalanceAfter + transferAmountAsWeibar).to.be.lessThanOrEqual(senderBalanceBefore);
    expect(receiverBalanceBefore + transferAmountAsWeibar).to.equal(receiverBalanceAfter);
  });

  it('should be able to authorizeSchedule via HRC755 contract', async () => {
    const {scheduleId} = await Utils.createScheduleTransactionForTransfer(senderInfo, receiverInfo, genesisSdkClient);

    const signScheduleCallTx = await contractHRC755.authorizeScheduleCall(
        Utils.convertAccountIdToLongZeroAddress(scheduleId.toString(), true),
        Constants.GAS_LIMIT_2_000_000
    );
    await signScheduleCallTx.wait();

    const debugTraceRes = await signers[0].provider.send('debug_traceTransaction', [
          signScheduleCallTx.hash, {
            tracer: 'callTracer',
            tracerConfig: {
              onlyTopCall: true,
            }
          }
        ]
    );
    expect(parseInt(debugTraceRes.output)).to.equal(Constants.TX_SUCCESS_CODE);
  });
});
