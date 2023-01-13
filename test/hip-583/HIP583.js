const { expect } = require("chai");
const { ethers } = require("hardhat");
const utils = require("../hts-precompile/utils");

describe("HIP583 Test Suite", function () {
  let signers;
  let hollowWallet;
  before(async function () {
    signers = await ethers.getSigners();
  });

  describe("Direct Ethereum Tx", function () {
    describe("Positive", function () {
      describe("HBAR Test", function () {
        let amount;
        let hollowWalletAddress;

        before(async function () {
          hollowWallet = ethers.Wallet.createRandom().connect(ethers.provider);
          hollowWalletAddress = hollowWallet.address;
          amount = ethers.utils.parseEther("0.1");
          console.log(hollowWalletAddress);
        });

        it("should be able to create hollow account and transfer HBARs", async function () {
          const hollowWalletBalanceBefore = await ethers.provider.getBalance(
            hollowWalletAddress
          );

          await signers[0].sendTransaction({
            to: hollowWalletAddress,
            value: amount,
            gasLimit: 1_000_000,
          });

          const hollowWalletBalanceAfter = await ethers.provider.getBalance(
            hollowWalletAddress
          );

          expect(hollowWalletBalanceBefore).to.eq(0);
          expect(hollowWalletBalanceAfter).to.eq(amount);
        });

        it("should be able to make second HBARs transfer", async function () {
          const hollowWalletBalanceBefore = await ethers.provider.getBalance(
            hollowWalletAddress
          );

          await signers[0].sendTransaction({
            to: hollowWalletAddress,
            value: amount,
            gasLimit: 1_000_000,
          });

          const hollowWalletBalanceAfter = await ethers.provider.getBalance(
            hollowWalletAddress
          );

          expect(hollowWalletBalanceAfter).to.eq(
            hollowWalletBalanceBefore.add(amount)
          );
        });

        it("should be able to make HBARs transfer and sign it with hollow account", async function () {
          const hollowWalletBalanceBefore = await ethers.provider.getBalance(
            hollowWalletAddress
          );

          await hollowWallet.sendTransaction({
            to: signers[1].address,
            value: amount,
          });

          let hollowWalletBalanceAfter = await ethers.provider.getBalance(
            hollowWalletAddress
          );
          hollowWalletBalanceAfter = await ethers.provider.getBalance(
            hollowWalletAddress
          );
          console.log(await hollowWallet.getBalance());
          expect(hollowWalletBalanceAfter).to.eq(
            hollowWalletBalanceBefore.sub(amount)
          );
        });
      });

      describe("Fungible Token Test", function () {
        it("should create hollow account and transfer Fungible Tokens", async function () {});

        it("should be able to make second Fungible Tokens transfer", async function () {});

        it("should be able to make Fungible Tokens transfer and sign with hollow account", async function () {});
      });

      describe("Non-Fungible Token Test", function () {
        it("should create hollow account and transfer Non-Fungible Token", async function () {});

        it("should be able to make second Non-Fungible Token transfer", async function () {});

        it("should be able to make Non-Fungible Token transfer and sign it with hollow account", async function () {});
      });
    });

    describe("Negative", function () {
      it("shouldn't be able to get balance of hollow account with no prior transfer", async function () {});
      it("shouldn't be able to make transfer from hollow account with no prior transfer", async function () {});
    });
  });
});
