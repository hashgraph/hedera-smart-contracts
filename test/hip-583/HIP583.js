const { expect } = require("chai");
const { ethers } = require("hardhat");
const utils = require("../hts-precompile/utils");

describe("HIP583 Test Suite", function () {
  let signers;
  let hollowWallet;
  let tokenCreateContract;
  let tokenTransferContract;
  let erc20Contract;
  let erc721Contract;
  let tokenAddress;
  let nftTokenAddress;
  let mintedTokenSerialNumber;
  let mintedTokenSerialNumber1;

  before(async function () {
    signers = await ethers.getSigners();
    tokenCreateContract = await utils.deployTokenCreateContract();
    tokenTransferContract = await utils.deployTokenTransferContract();
    erc20Contract = await utils.deployERC20Contract();
    erc721Contract = await utils.deployERC721Contract();
    tokenAddress =
      await utils.createFungibleTokenWithSECP256K1AdminKeyWithoutKYC(
        tokenCreateContract,
        signers[0].address,
        utils.getSignerCompressedPublicKey()
      );

    nftTokenAddress =
      await utils.createNonFungibleTokenWithSECP256K1AdminKeyWithoutKYC(
        tokenCreateContract,
        signers[0].address,
        utils.getSignerCompressedPublicKey()
      );

    await utils.associateToken(
      tokenCreateContract,
      tokenAddress,
      "TokenCreateContract"
    );

    await utils.associateToken(
      tokenCreateContract,
      nftTokenAddress,
      "TokenCreateContract"
    );
  });

  xdescribe("Direct Ethereum Tx", function () {
    describe("Positive", function () {
      describe("HBAR Test", function () {
        let amount;
        let hollowWalletAddress;

        before(async function () {
          hollowWallet = ethers.Wallet.createRandom().connect(ethers.provider);

          hollowWalletAddress = hollowWallet.address;
          amount = ethers.utils.parseEther("0.1");
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

          //allow mirror node a 2 full record stream write windows (2 sec) and a buffer to persist setup details
          await new Promise((r) => setTimeout(r, 2000));

          let hollowWalletBalanceAfter = await ethers.provider.getBalance(
            hollowWalletAddress
          );

          expect(hollowWalletBalanceAfter).to.lessThanOrEqual(
            hollowWalletBalanceBefore.sub(amount)
          );
        });
      });

      describe("Fungible Token Test", function () {
        let hollowWalletAddress;
        let amount;

        before(async function () {
          hollowWallet = ethers.Wallet.createRandom().connect(ethers.provider);

          hollowWalletAddress = hollowWallet.address;
          amount = 30;
        });

        it("should create hollow account and transfer Fungible Tokens", async function () {
          let signerBalanceBefore = parseInt(
            await erc20Contract.balanceOf(tokenAddress, signers[0].address)
          );

          await tokenTransferContract.transferTokenPublic(
            tokenAddress,
            signers[0].address,
            hollowWalletAddress,
            amount,
            { gasLimit: 1_000_000 }
          );

          let signerBalanceAfter = await erc20Contract.balanceOf(
            tokenAddress,
            signers[0].address
          );

          let hollowalletBalance = await erc20Contract.balanceOf(
            tokenAddress,
            hollowWalletAddress
          );

          expect(signerBalanceAfter).to.eq(signerBalanceBefore - amount);
          expect(hollowalletBalance).to.eq(amount);
        });

        it("should be able to make second Fungible Tokens transfer", async function () {
          let signerBalanceBefore = parseInt(
            await erc20Contract.balanceOf(tokenAddress, signers[0].address)
          );

          let hollowalletBalanceBefore = await erc20Contract.balanceOf(
            tokenAddress,
            hollowWalletAddress
          );

          await tokenTransferContract.transferTokenPublic(
            tokenAddress,
            signers[0].address,
            hollowWalletAddress,
            amount
          );

          let signerBalanceAfter = await erc20Contract.balanceOf(
            tokenAddress,
            signers[0].address
          );

          let hollowalletBalanceAfter = await erc20Contract.balanceOf(
            tokenAddress,
            hollowWalletAddress
          );

          expect(signerBalanceAfter).to.eq(signerBalanceBefore - amount);
          expect(hollowalletBalanceAfter).to.eq(
            hollowalletBalanceBefore.add(amount)
          );
        });

        it("should be able to make Fungible Tokens transfer and sign with hollow account", async function () {
          let signerBalanceBefore = parseInt(
            await erc20Contract.balanceOf(tokenAddress, signers[0].address)
          );

          let hollowalletBalanceBefore = await erc20Contract.balanceOf(
            tokenAddress,
            hollowWalletAddress
          );

          //sending some HBARs, so the hollow account have some to cover the transaction
          await signers[0].sendTransaction({
            to: hollowWalletAddress,
            value: ethers.utils.parseEther("1"),
          });

          await tokenTransferContract
            .connect(hollowWallet)
            .transferTokenPublic(
              tokenAddress,
              hollowWalletAddress,
              signers[0].address,
              amount
            );

          //allow mirror node a 2 full record stream write windows (2 sec) and a buffer to persist setup details
          await new Promise((r) => setTimeout(r, 2000));
          let signerBalanceAfter = await erc20Contract.balanceOf(
            tokenAddress,
            signers[0].address
          );

          let hollowalletBalanceAfter = await erc20Contract.balanceOf(
            tokenAddress,
            hollowWalletAddress
          );

          expect(signerBalanceAfter).to.eq(signerBalanceBefore + amount);
          expect(hollowalletBalanceAfter).to.eq(
            hollowalletBalanceBefore - amount
          );
        });
      });

      describe("Non-Fungible Token Test", function () {
        let hollowWalletAddress;

        before(async function () {
          hollowWallet = ethers.Wallet.createRandom().connect(ethers.provider);

          hollowWalletAddress = hollowWallet.address;

          mintedTokenSerialNumber = await utils.mintNFTToAddress(
            tokenCreateContract,
            nftTokenAddress
          );

          mintedTokenSerialNumber1 = await utils.mintNFTToAddress(
            tokenCreateContract,
            nftTokenAddress
          );
        });

        it("should create hollow account and transfer Non-Fungible Token", async function () {
          const signerBalanceBefore = await erc721Contract.balanceOf(
            nftTokenAddress,
            signers[0].address
          );

          await tokenTransferContract.transferNFTPublic(
            nftTokenAddress,
            signers[0].address,
            hollowWalletAddress,
            mintedTokenSerialNumber,
            { gasLimit: 1_000_000 }
          );
          const signerBalanceAfter = await erc721Contract.balanceOf(
            nftTokenAddress,
            signers[0].address
          );

          const hollowWalletBalance = await erc721Contract.balanceOf(
            nftTokenAddress,
            hollowWalletAddress
          );

          expect(signerBalanceAfter).to.lessThan(signerBalanceBefore);
          expect(hollowWalletBalance).to.greaterThan(0);
        });

        it("should be able to make second Non-Fungible Token transfer", async function () {
          const signerBalanceBefore = await erc721Contract.balanceOf(
            nftTokenAddress,
            signers[0].address
          );

          const hollowWalletBalanceBefore = await erc721Contract.balanceOf(
            nftTokenAddress,
            hollowWalletAddress
          );

          await tokenTransferContract.transferNFTPublic(
            nftTokenAddress,
            signers[0].address,
            hollowWalletAddress,
            mintedTokenSerialNumber1,
            { gasLimit: 1_000_000 }
          );
          const signerBalanceAfter = await erc721Contract.balanceOf(
            nftTokenAddress,
            signers[0].address
          );

          const hollowWalletBalanceAfter = await erc721Contract.balanceOf(
            nftTokenAddress,
            hollowWalletAddress
          );

          expect(signerBalanceAfter).to.lessThan(signerBalanceBefore);
          expect(hollowWalletBalanceAfter).to.greaterThan(
            hollowWalletBalanceBefore
          );
        });

        it("should be able to make Non-Fungible Token transfer and sign it with hollow account", async function () {
          const signerBalanceBefore = await erc721Contract.balanceOf(
            nftTokenAddress,
            signers[0].address
          );

          const hollowWalletBalanceBefore = await erc721Contract.balanceOf(
            nftTokenAddress,
            hollowWalletAddress
          );

          //sending some HBARs, so the hollow account have some to cover the transaction
          await signers[0].sendTransaction({
            to: hollowWalletAddress,
            value: ethers.utils.parseEther("2"),
          });

          await tokenTransferContract
            .connect(hollowWallet)
            .transferNFTPublic(
              nftTokenAddress,
              hollowWalletAddress,
              signers[0].address,
              mintedTokenSerialNumber1,
              { gasLimit: 1_000_000 }
            );

          const signerBalanceAfter = await erc721Contract.balanceOf(
            nftTokenAddress,
            signers[0].address
          );

          const hollowWalletBalanceAfter = await erc721Contract.balanceOf(
            nftTokenAddress,
            hollowWalletAddress
          );

          expect(signerBalanceAfter).to.greaterThan(signerBalanceBefore);
          expect(hollowWalletBalanceAfter).to.lessThan(
            hollowWalletBalanceBefore
          );
        });
      });
    });

    describe("Negative", function () {
      let hollowWalletAddress;
      let amount;

      before(async function () {
        hollowWallet = ethers.Wallet.createRandom().connect(ethers.provider);

        hollowWalletAddress = hollowWallet.address;
        amount = 30;
      });

      it("shouldn't be able to get balance of hollow account with no prior transfer", async function () {
        try {
          await erc20Contract.balanceOf(tokenAddress, hollowWalletAddress);
        } catch (e) {
          expect(e).to.exist;
          expect(e.code).to.eq("CALL_EXCEPTION");
        }
      });

      it("shouldn't be able to make transfer from hollow account with no prior transfer", async function () {
        try {
          await hollowWallet.sendTransaction({
            to: signers[0].address,
            value: amount,
          });
        } catch (e) {
          expect(e).to.exist;
        }
      });
    });
  });
});
