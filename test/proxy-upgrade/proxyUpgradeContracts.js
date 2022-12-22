const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const utils = require("../hts-precompile/utils");

describe("Proxy Upgrade Contracts Test Suite", function () {
  let signers;

  before(async function () {
    signers = await ethers.getSigners();
  });

  describe("DEX Upgradable Contract Test Suite", function () {
    let tokenCreateContract;
    let erc20Contract;
    let tokenAddress;
    let proxyContract;
    let proxyAddress;
    let exchangeTokenBalance;

    before(async function () {
      tokenCreateContract = await utils.deployTokenCreateContract();
      tokenAddress = await utils.createFungibleTokenWithSECP256K1AdminKey(
        tokenCreateContract,
        signers[0].address,
        utils.getSignerCompressedPublicKey()
      );

      erc20Contract = await utils.deployERC20Contract();
      proxyContract = await deployDEXProxyContract(tokenAddress);
      proxyAddress = proxyContract.address;

      await proxyContract.associateToken({
        gasLimit: 1_000_000,
      });

      await tokenCreateContract.grantTokenKycPublic(
        tokenAddress,
        proxyAddress,
        {
          gasLimit: 1_000_000,
        }
      );

      exchangeTokenBalance = 500;
      await proxyContract.depositTokens(`${exchangeTokenBalance}`);
    });

    async function deployDEXProxyContract(token) {
      const contract = await ethers.getContractFactory("Exchange");

      const proxy = await upgrades.deployProxy(contract, [token], {
        kind: "uups",
        initializer: "initialize",
      });

      await proxy.deployed();

      return proxy;
    }

    async function updateDEXProxyContract() {
      const contract = await ethers.getContractFactory("ExchangeV2");

      const proxy = await upgrades.upgradeProxy(proxyAddress, contract, {
        kind: "uups",
      });
      await proxy.deployed();

      return proxy;
    }

    it("should deposit, buy and sell tokens from ExchangeV1", async function () {
      //deposit funds
      {
        const balanceBefore = await proxyContract.getNativeBalance();
        await proxyContract.deposit({
          value: ethers.utils.parseEther("0.5"),
        });
        const balanceAfter = await proxyContract.getNativeBalance();

        expect(
          balanceAfter,
          "Asserting new balance is greater"
        ).to.be.greaterThan(balanceBefore);
      }

      //buy token
      {
        const tokenBalanceBefore = await proxyContract.getTokenBalance();
        const nativeBalanceBefore = await proxyContract.getNativeBalance();

        await proxyContract.buy({
          value: ethers.utils.parseEther("0.000001"),
        });

        const tokenBalanceAfter = await proxyContract.getTokenBalance();
        const nativeBalanceAfter = await proxyContract.getNativeBalance();

        expect(
          tokenBalanceAfter,
          "Asserting new token balance is lesser"
        ).to.be.lessThan(tokenBalanceBefore);

        expect(
          nativeBalanceAfter,
          "Asserting new balance is greater"
        ).to.be.greaterThan(nativeBalanceBefore);
      }

      //sell token
      {
      }
    });

    it("should upgrade contract to V2", async function () {
      const addressV1 = await proxyContract.getImplementationAddress();

      proxyContract = await updateDEXProxyContract();

      const addressV2 = await proxyContract.getImplementationAddress();

      expect(
        addressV1,
        "Asserting implementation address is different"
      ).to.not.eq(addressV2);
    });

    it("should deposit, buy and withdraw tokens from ExchangeV2", async function () {
      //checkVersion
      {
        const version = await proxyContract.version();
        expect(version, "Asserting contract version is V2").to.eq("V2");
      }

      //deposit funds
      {
        const balanceBefore = await proxyContract.getNativeBalance();
        await proxyContract.deposit({
          value: ethers.utils.parseEther("0.5"),
        });
        const balanceAfter = await proxyContract.getNativeBalance();

        expect(
          balanceAfter,
          "Asserting new balance is greater"
        ).to.be.greaterThan(balanceBefore);
      }

      //buy token
      {
        const tokenBalanceBefore = await proxyContract.getTokenBalance();
        const nativeBalanceBefore = await proxyContract.getNativeBalance();

        await proxyContract.buy({
          value: ethers.utils.parseEther("0.000001"),
        });

        const tokenBalanceAfter = await proxyContract.getTokenBalance();
        const nativeBalanceAfter = await proxyContract.getNativeBalance();

        expect(
          tokenBalanceAfter,
          "Asserting new token balance is lesser"
        ).to.be.lessThan(tokenBalanceBefore);

        expect(
          nativeBalanceAfter,
          "Asserting new balance is greater"
        ).to.be.greaterThan(nativeBalanceBefore);
      }

      //sell token
      {
      }
    });
  });

  describe("Counter Upgradable Contract Test Suite", function () {
    const nameV1 = "Counter";
    const nameV2 = "CounterV2";
    let proxyContract;
    let proxyAddress;

    before(async function () {
      proxyContract = await deployCounterProxyContract();
      proxyAddress = proxyContract.address;
    });

    async function deployCounterProxyContract() {
      const contract = await ethers.getContractFactory("Counter");

      const proxy = await upgrades.deployProxy(contract, [nameV1], {
        kind: "uups",
        initializer: "initialize",
      });

      await proxy.deployed();

      return proxy;
    }

    async function updateCounterProxyContract() {
      const contract = await ethers.getContractFactory("CounterV2");

      const proxy = await upgrades.upgradeProxy(proxyAddress, contract, {
        kind: "uups",
      });
      await proxy.deployed();

      return proxy;
    }

    it("should be able to increase and decrease counter on V1", async function () {
      //increment counter
      {
        const counterBefore = await proxyContract.count();
        await proxyContract.increment();
        const counterAfter = await proxyContract.count();
        expect(counterAfter, "Asserting counter increment").to.be.greaterThan(
          counterBefore
        );
      }

      //decrement counter
      {
        const counterBefore = await proxyContract.count();
        await proxyContract.decrement();
        const counterAfter = await proxyContract.count();
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

      proxyContract = await updateCounterProxyContract();

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
        const counterBefore = await proxyContract.count();
        await proxyContract.increment();
        const counterAfter = await proxyContract.count();
        expect(counterAfter, "Asserting counter increment").to.be.greaterThan(
          counterBefore
        );
      }

      //decrement counter
      {
        const counterBefore = await proxyContract.count();
        await proxyContract.decrement();
        const counterAfter = await proxyContract.count();
        expect(
          counterAfter,
          "Asserting counter decrement"
        ).to.be.lessThanOrEqual(counterBefore);
      }

      //change name
      {
        await proxyContract.changeName(nameV2);
        const name = await proxyContract.name();
        expect(name, "Asserting counter name is different").to.eq(nameV2);
      }
    });
  });
});
