// SPDX-License-Identifier: Apache-2.0

const {expect} = require("chai");
const hre = require("hardhat");
const {ethers} = hre;
const Constants = require("../../../constants");
const Utils = require("../../native/evm-compatibility-ecrecover/utils");
const axios = require("axios");

const sleep = ms => new Promise(r => setTimeout(r, ms));

const getScheduleInfoFromMN = async (scheduleAddress) => {
  const url = Utils.getMirrorNodeUrl(hre.network.name) + `/schedules/0.0.${Number(scheduleAddress)}`;

  return axios.get(url).then(r => r.data);
};

const FIVE_MINUTES_AS_SECONDS = 300n;
const SCHEDULE_GAS_LIMIT = 1_000_000n;

describe.only("HIP1215 Test Suite", function () {
  let internalCalleeContract;
  let HIP1215Contract;
  let signers;

  const executeScheduleCallExample = async (timestampOffset = 0) => {
    return (await HIP1215Contract.scheduleCallExample(
        internalCalleeContract.target,
        timestampOffset,
        SCHEDULE_GAS_LIMIT,
        0,
        "0x3a32b549", // selector of externalFunction() in Internal Callee
        Constants.GAS_LIMIT_2_000_000
    )).wait();
  };

  before(async () => {
    signers = await ethers.getSigners();

    internalCalleeContract = await (
        await ethers.getContractFactory(Constants.Contract.InternalCallee)
    ).deploy();
    await internalCalleeContract.waitForDeployment();

    HIP1215Contract = await (
        await ethers.getContractFactory("HIP1215Contract")
    ).deploy({value: ethers.parseEther("5")}); // fund the contract with 5 HBARs
    await HIP1215Contract.waitForDeployment();
  });

  it("should be able to execute scheduleCallExample", async () => {
    const beforeCount = await internalCalleeContract.calledTimes();

    await executeScheduleCallExample();
    await sleep(10_000);

    const afterCount = await internalCalleeContract.calledTimes();

    expect(afterCount).to.equal(beforeCount + 1n);
  });

  it("should be able to execute  scheduleCallWithPayerExample", async () => {
    const beforeCount = await internalCalleeContract.calledTimes();

    await (await HIP1215Contract.scheduleCallWithPayerExample(
        internalCalleeContract.target,
        HIP1215Contract.target,
        0,
        SCHEDULE_GAS_LIMIT,
        0,
        "0x3a32b549", // selector of externalFunction() in Internal Callee
        Constants.GAS_LIMIT_2_000_000
    )).wait();
    await sleep(10_000);

    const afterCount = await internalCalleeContract.calledTimes();
    expect(afterCount).to.equal(beforeCount + 1n);
  });

  it("should be able to execute executeCallOnPayerSignatureExample", async () => {
    const beforeCount = await internalCalleeContract.calledTimes();

    const receipt = await (await HIP1215Contract.executeCallOnPayerSignatureExample(
        internalCalleeContract.target,
        signers[0].address,
        (await HIP1215Contract.getBlockTimestamp()) + FIVE_MINUTES_AS_SECONDS, // add buffer to the expiry
        SCHEDULE_GAS_LIMIT,
        0,
        "0x3a32b549", // selector of externalFunction() in Internal Callee
        Constants.GAS_LIMIT_2_000_000
    )).wait();
    const scheduleAddress = receipt.logs[0].args[0];

    const IHRC755Facade = await ethers.getContractAt(
        "IHRC755ScheduleFacade",
        scheduleAddress,
        signers[0]
    );
    await (await IHRC755Facade.signSchedule(Constants.GAS_LIMIT_2_000_000)).wait();

    const afterCount = await internalCalleeContract.calledTimes();
    expect(afterCount).to.equal(beforeCount + 1n);
  });

  it("should be able to execute hasScheduleCapacityProxyExample", async () => {
    const timestamp = (await HIP1215Contract.getBlockTimestamp()) + 20n;

    expect(
        await HIP1215Contract.hasScheduleCapacityProxyExample(timestamp, 200_000n)
    ).to.be.true;
  });

  it("should be able to execute deleteScheduleExample", async () => {
    const timestamp = (await HIP1215Contract.getBlockTimestamp()) + FIVE_MINUTES_AS_SECONDS;
    const scheduleAddress = (await executeScheduleCallExample(timestamp)).logs[0].args[0];
    expect(scheduleAddress).to.not.be.null;

    const before = await getScheduleInfoFromMN(scheduleAddress);
    expect(before.deleted).to.be.false;

    await (await HIP1215Contract.deleteScheduleExample(scheduleAddress)).wait();

    const after = await getScheduleInfoFromMN(scheduleAddress);
    expect(after.deleted).to.be.true;
  });

  it("should be able to execute deleteScheduleProxyExample", async () => {
    const timestamp = (await HIP1215Contract.getBlockTimestamp()) + FIVE_MINUTES_AS_SECONDS;
    const scheduleAddress = (await executeScheduleCallExample(timestamp)).logs[0].args[0];
    expect(scheduleAddress).to.not.be.null;

    const before = await getScheduleInfoFromMN(scheduleAddress);
    expect(before.deleted).to.be.false;

    await (
        await HIP1215Contract.deleteScheduleProxyExample(scheduleAddress)
    ).wait();

    const after = await getScheduleInfoFromMN(scheduleAddress);
    expect(after.deleted).to.be.true;
  });
});
