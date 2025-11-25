// SPDX-License-Identifier: Apache-2.0

const {expect} = require('chai');
const hre = require('hardhat');
const {ethers} = hre;
const Constants = require('../../../constants');
const Utils = require("../../native/evm-compatibility-ecrecover/utils");
const axios = require("axios");

describe.only('HIP1215 Test Suite', function () {
  let internalCalleeContract;

  let HIP1215Contract;

  let signers;

  before(async () => {
    signers = await ethers.getSigners();

    const internalCalleeContractFactory = await ethers.getContractFactory(Constants.Contract.InternalCallee);
    internalCalleeContract = await internalCalleeContractFactory.deploy();
    await internalCalleeContract.waitForDeployment();

    const HIP1215ContractFactory = await ethers.getContractFactory('HIP1215Contract');
    HIP1215Contract = await HIP1215ContractFactory.deploy({value: '5000000000000000000'}); // 5 hbars
    await HIP1215Contract.waitForDeployment();
  });

  xit('should be able to scheduleCallExample', async () => {
    const beforeCount = await internalCalleeContract.calledTimes();

    const tx = await HIP1215Contract.scheduleCallExample(
        internalCalleeContract.target,
        "0x3a32b549",
        0,
        {gasLimit: 3_000_000}
    );
    await tx.wait();
    console.log({hash: tx.hash});

    await new Promise(r => setTimeout(r, 15_000));

    const afterCount = await internalCalleeContract.calledTimes();
    expect(beforeCount + BigInt(1)).to.equal(afterCount);
  });

  it('should be able to scheduleCallWithPayerExample', async () => {
    const beforeCount = await internalCalleeContract.calledTimes();

    const tx = await HIP1215Contract.scheduleCallWithPayerExample(
        internalCalleeContract.target,
        internalCalleeContract.target,
        "0x3a32b549",
        0,
        {gasLimit: 3_000_000}
    );
    await tx.wait();
    console.log({hash: tx.hash});

    await new Promise(r => setTimeout(r, 30_000));

    const afterCount = await internalCalleeContract.calledTimes();
    expect(beforeCount + BigInt(1)).to.equal(afterCount);
  });

  it('should be able to executeCallOnPayerSignatureExample', async () => {
    const beforeCount = await internalCalleeContract.calledTimes();

    const tx = await HIP1215Contract.executeCallOnPayerSignatureExample(
        signers[0].address,
        internalCalleeContract.target,
        "0x3a32b549",
        (await HIP1215Contract.getBlockTimestamp()) + BigInt(10_000),
        {gasLimit: 3_000_000}
    );
    const receipt = await tx.wait();
    const scheduleAddress = receipt.logs[0].args[0];
    console.log({hash: tx.hash, scheduleAddress});

    const IHRC755Facade = await ethers.getContractAt(
        'IHRC755ScheduleFacade',
        scheduleAddress,
        signers[0]
    );
    const signScheduleTx = await IHRC755Facade.signSchedule({gasLimit: 3_000_000});
    await signScheduleTx.wait();

    const afterCount = await internalCalleeContract.calledTimes();
    expect(beforeCount + BigInt(1)).to.equal(afterCount);
  });

  it('should be able to execute hasScheduleCapacityProxyExample', async () => {
    const res = await HIP1215Contract.hasScheduleCapacityProxyExample(
        (await HIP1215Contract.getBlockTimestamp()) + BigInt(20),
        200_000
    );

    expect(res).to.be.true;
  });

  it('should be able to execute deleteScheduleExample', async () => {
    const tx = await HIP1215Contract.scheduleCallExample(
        internalCalleeContract.target,
        "0x3a32b549",
        (await HIP1215Contract.getBlockTimestamp()) + BigInt(1000),
        {gasLimit: 3_000_000}
    );
    const receipt = await tx.wait();
    const scheduleAddress = receipt.logs[0].args[0];
    const mnInfoQueryLink = Utils.getMirrorNodeUrl(hre.network.name) + `/schedules/0.0.${Number(scheduleAddress)}`;

    expect(scheduleAddress).to.not.be.null;

    const resBefore = await axios.get(mnInfoQueryLink);
    expect(resBefore.data.deleted).to.be.false;

    const txDelete = await HIP1215Contract.deleteScheduleExample(scheduleAddress);
    await txDelete.wait();

    const resAfter = await axios.get(mnInfoQueryLink);
    expect(resAfter.data.deleted).to.be.true;
  });

  it('should be able to execute deleteScheduleProxyExample', async () => {
    const tx = await HIP1215Contract.scheduleCallExample(
        internalCalleeContract.target,
        "0x3a32b549",
        (await HIP1215Contract.getBlockTimestamp()) + BigInt(1000),
        {gasLimit: 3_000_000}
    );
    const receipt = await tx.wait();
    const scheduleAddress = receipt.logs[0].args[0];
    const mnInfoQueryLink = Utils.getMirrorNodeUrl(hre.network.name) + `/schedules/0.0.${Number(scheduleAddress)}`;

    expect(scheduleAddress).to.not.be.null;

    const resBefore = await axios.get(mnInfoQueryLink);
    expect(resBefore.data.deleted).to.be.false;

    const txDelete = await HIP1215Contract.deleteScheduleProxyExample(scheduleAddress);
    await txDelete.wait();

    const resAfter = await axios.get(mnInfoQueryLink);
    expect(resAfter.data.deleted).to.be.true;
  });
});
