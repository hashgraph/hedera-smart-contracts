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

describe("HIP1215 Test Suite", function () {
  let internalCalleeContract;
  let HIP1215Contract;
  let signers;

  const executeScheduleCallExample = async (timestampOffset = 0) => {
    return (await HIP1215Contract.scheduleCallExample(
        internalCalleeContract.target,
        "0x3a32b549",
        timestampOffset,
        0,
        0,
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
        HIP1215Contract.target,
        internalCalleeContract.target,
        "0x3a32b549",
        0,
        0,
        0,
        Constants.GAS_LIMIT_2_000_000
    )).wait();
    await sleep(10_000);

    const afterCount = await internalCalleeContract.calledTimes();
    expect(afterCount).to.equal(beforeCount + 1n);
  });

  it("should be able to execute executeCallOnPayerSignatureExample", async () => {
    const beforeCount = await internalCalleeContract.calledTimes();

    const receipt = await (await HIP1215Contract.executeCallOnPayerSignatureExample(
        signers[0].address,
        internalCalleeContract.target,
        "0x3a32b549",
        (await HIP1215Contract.getBlockTimestamp()) + FIVE_MINUTES_AS_SECONDS, // add buffer to the expiry
        0,
        0,
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
