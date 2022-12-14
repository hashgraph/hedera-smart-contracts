const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Counter Upgradable Contract Test Suite", function () {
  let signers;
  let proxyAddress;

  before(async function () {
    signers = await ethers.getSigners();
    const counter = await ethers.getContractFactory("Counter");

    const proxyContract = await upgrades.deployProxy(counter, ["Counter"], {
      kind: "uups",
      initializer: "initialize",
    });

    await proxyContract.deployed();
    proxyAddress = proxyContract.address;

    console.log(`OpenZeppelin Proxy deployed to ${proxyAddress}\n\n`);
  });

  //   it("should be able to get token name", async function () {});
});
