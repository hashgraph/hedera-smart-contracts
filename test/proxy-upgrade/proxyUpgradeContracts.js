const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("Proxy Upgrade Contracts Test Suite", function () {
  describe("Counter Upgradable Contract Test Suite", function () {
    const nameV1 = "Counter";
    const nameV2 = "CounterV2";
    let signers;
    let proxyContractV1;
    let proxyContractV2;
    let proxyAddress;

    before(async function () {
      signers = await ethers.getSigners();
      proxyContractV1 = await deployProxyContract();
      proxyAddress = proxyContractV1.address;
    });

    async function deployProxyContract() {
      const contract = await ethers.getContractFactory("Counter");

      const proxyContract = await upgrades.deployProxy(contract, [nameV1], {
        kind: "uups",
        initializer: "initialize",
      });

      await proxyContract.deployed();

      return proxyContract;
    }

    async function updateProxyContract() {
      const contract = await ethers.getContractFactory("CounterV2");

      const proxyContract = await upgrades.upgradeProxy(
        proxyAddress,
        contract,
        {
          kind: "uups",
        }
      );
      await proxyContract.deployed();

      return proxyContract;
    }

    it("should be able to increase and decrease counter on V1", async function () {
      //increment counter
      {
        const counterBefore = await proxyContractV1.count();
        await proxyContractV1.increment();
        const counterAfter = await proxyContractV1.count();
        expect(counterAfter, "Asserting counter increment").to.be.greaterThan(
          counterBefore
        );
      }

      //decrement counter
      {
        const counterBefore = await proxyContractV1.count();
        await proxyContractV1.decrement();
        const counterAfter = await proxyContractV1.count();
        expect(
          counterAfter,
          "Asserting counter decrement"
        ).to.be.lessThanOrEqual(counterBefore);
      }
    });

    it("should be able to upgrade contract to V2", async function () {
      const addressV1 = await upgrades.erc1967.getImplementationAddress(
        proxyAddress
      );

      proxyContractV2 = await updateProxyContract();

      const addressV2 = await upgrades.erc1967.getImplementationAddress(
        proxyAddress
      );

      expect(
        addressV1,
        "Asserting implementation address is different"
      ).to.not.eq(addressV2);
    });

    it("should be able to increase and decrease counter on V2", async function () {
      //increment counter
      {
        const counterBefore = await proxyContractV1.count();
        await proxyContractV1.increment();
        const counterAfter = await proxyContractV1.count();
        expect(counterAfter, "Asserting counter increment").to.be.greaterThan(
          counterBefore
        );
      }

      //decrement counter
      {
        const counterBefore = await proxyContractV1.count();
        await proxyContractV1.decrement();
        const counterAfter = await proxyContractV1.count();
        expect(
          counterAfter,
          "Asserting counter decrement"
        ).to.be.lessThanOrEqual(counterBefore);
      }

      //change name
      {
        await proxyContractV2.changeName(nameV2);
        const name = await proxyContractV2.name();
        expect(name, "Asserting counter name is different").to.eq(nameV2);
      }
    });
  });
});
