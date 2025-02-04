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

const { expect } = require('chai');
const { ethers } = require('hardhat');
const utils = require('../system-contracts/hedera-token-service/utils');
const Constants = require('../constants');
const {
  pollForNewBalance,
  pollForNewERC721Balance,
  pollForNewHollowWalletBalance,
  pollForNewERC721HollowWalletOwner,
  pollForNewWalletBalance,
} = require('../../utils/helpers');

describe('HIP583 Test Suite', function () {
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
    await utils.updateAccountKeysViaHapi([
      await tokenCreateContract.getAddress(),
      await tokenTransferContract.getAddress(),
    ]);
    erc20Contract = await utils.deployERC20Contract();
    erc721Contract = await utils.deployERC721Contract();
    tokenAddress =
      await utils.createFungibleTokenWithSECP256K1AdminKeyWithoutKYC(
        tokenCreateContract,
        signers[0].address,
        utils.getSignerCompressedPublicKey()
      );
    await utils.updateTokenKeysViaHapi(
      tokenAddress,
      [
        await tokenCreateContract.getAddress(),
        await tokenTransferContract.getAddress(),
      ],
      true,
      true,
      false,
      true,
      true,
      true,
      false
    );
    nftTokenAddress =
      await utils.createNonFungibleTokenWithSECP256K1AdminKeyWithoutKYC(
        tokenCreateContract,
        signers[0].address,
        utils.getSignerCompressedPublicKey()
      );

    await utils.updateTokenKeysViaHapi(
      nftTokenAddress,
      [
        await tokenCreateContract.getAddress(),
        await tokenTransferContract.getAddress(),
      ],
      true,
      true,
      false,
      true,
      true,
      true,
      false
    );
    await utils.associateToken(
      tokenCreateContract,
      tokenAddress,
      Constants.Contract.TokenCreateContract
    );
    await utils.associateToken(
      tokenCreateContract,
      nftTokenAddress,
      Constants.Contract.TokenCreateContract
    );
  });

  describe('Direct Ethereum Tx', function () {
    describe('Positive', function () {
      describe('HBAR Test', function () {
        let amount;
        let hollowWalletAddress;

        before(async function () {
          hollowWallet = ethers.Wallet.createRandom().connect(ethers.provider);

          hollowWalletAddress = hollowWallet.address;
          amount = ethers.parseEther('0.1');
        });

        it('should be able to create hollow account and transfer HBARs', async function () {
          const hollowWalletBalanceBefore =
            await ethers.provider.getBalance(hollowWalletAddress);

          await signers[0].sendTransaction({
            to: hollowWalletAddress,
            value: amount,
            gasLimit: 1_000_000,
          });

          const hollowWalletBalanceAfter =
            await ethers.provider.getBalance(hollowWalletAddress);

          expect(hollowWalletBalanceBefore).to.eq(0);
          expect(hollowWalletBalanceAfter).to.eq(amount);
        });

        it('should be able to make second HBARs transfer', async function () {
          const hollowWalletBalanceBefore =
            await ethers.provider.getBalance(hollowWalletAddress);

          await signers[0].sendTransaction({
            to: hollowWalletAddress,
            value: amount,
          });

          const hollowWalletBalanceAfter = await pollForNewHollowWalletBalance(
            ethers.provider,
            hollowWallet.address,
            hollowWalletBalanceBefore
          );

          expect(hollowWalletBalanceAfter).to.eq(
            hollowWalletBalanceBefore + amount
          );
        });

        it('should be able to make HBARs transfer and sign it with hollow account', async function () {
          const hollowWalletBalanceBefore =
            await ethers.provider.getBalance(hollowWalletAddress);

          await hollowWallet.sendTransaction({
            to: signers[1].address,
            value: amount,
          });

          const hollowWalletBalanceAfter = await pollForNewHollowWalletBalance(
            ethers.provider,
            hollowWallet.address,
            hollowWalletBalanceBefore
          );

          expect(hollowWalletBalanceAfter).to.lessThanOrEqual(
            hollowWalletBalanceBefore - amount
          );
        });
      });

      describe('Fungible Token Test', function () {
        let hollowWalletAddress;
        let amount;

        before(async function () {
          hollowWallet = ethers.Wallet.createRandom().connect(ethers.provider);

          hollowWalletAddress = hollowWallet.address;
          amount = BigInt(30);
        });

        it('should create hollow account and transfer Fungible Tokens', async function () {
          let signerBalanceBefore = BigInt(
            await erc20Contract.balanceOf(tokenAddress, signers[0].address)
          );

          await tokenTransferContract.transferTokenPublic(
            tokenAddress,
            signers[0].address,
            hollowWalletAddress,
            amount,
            Constants.GAS_LIMIT_10_000_000
          );

          const signerBalanceAfter = await pollForNewWalletBalance(
            erc20Contract,
            tokenAddress,
            signers[0].address,
            signerBalanceBefore
          );

          let hollowalletBalance = await erc20Contract.balanceOf(
            tokenAddress,
            hollowWalletAddress
          );

          expect(signerBalanceAfter).to.eq(signerBalanceBefore - amount);
          expect(hollowalletBalance).to.eq(amount);
        });

        it('should be able to make second Fungible Tokens transfer', async function () {
          let signerBalanceBefore = BigInt(
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

          const signerBalanceAfter = await pollForNewWalletBalance(
            erc20Contract,
            tokenAddress,
            signers[0].address,
            signerBalanceBefore
          );

          let hollowalletBalanceAfter = await erc20Contract.balanceOf(
            tokenAddress,
            hollowWalletAddress
          );

          expect(signerBalanceAfter).to.eq(signerBalanceBefore - amount);
          expect(hollowalletBalanceAfter).to.eq(
            hollowalletBalanceBefore + amount
          );
        });

        it('should be able to make Fungible Tokens transfer and sign with hollow account', async function () {
          let signerBalanceBefore = BigInt(
            await erc20Contract.balanceOf(tokenAddress, signers[0].address)
          );

          let hollowalletBalanceBefore = await erc20Contract.balanceOf(
            tokenAddress,
            hollowWalletAddress
          );

          //sending some HBARs, so the hollow account have some to cover the transaction
          await signers[0].sendTransaction({
            to: hollowWalletAddress,
            value: ethers.parseEther('14'),
          });

          await utils.updateAccountKeysViaHapi(
            [
              await tokenCreateContract.getAddress(),
              await tokenTransferContract.getAddress(),
            ],
            [hollowWallet.privateKey]
          );

          await tokenTransferContract
            .connect(hollowWallet)
            .transferTokenPublic(
              tokenAddress,
              hollowWalletAddress,
              signers[0].address,
              amount
            );

          const signerBalanceAfter = await pollForNewWalletBalance(
            erc20Contract,
            tokenAddress,
            signers[0].address,
            signerBalanceBefore
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

      describe('Non-Fungible Token Test', function () {
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

        it('should create hollow account and transfer Non-Fungible Token', async function () {
          const signerBalanceBefore = await erc721Contract.balanceOf(
            nftTokenAddress,
            signers[0].address
          );

          await tokenTransferContract.transferNFTPublic(
            nftTokenAddress,
            signers[0].address,
            hollowWalletAddress,
            mintedTokenSerialNumber,
            Constants.GAS_LIMIT_10_000_000
          );

          const signerBalanceAfter = await pollForNewERC721Balance(
            erc721Contract,
            nftTokenAddress,
            signers[0].address,
            signerBalanceBefore
          );

          const hollowWalletBalance = await erc721Contract.balanceOf(
            nftTokenAddress,
            hollowWalletAddress
          );

          expect(signerBalanceAfter).to.lessThan(signerBalanceBefore);
          expect(hollowWalletBalance).to.greaterThan(0);
        });

        it('should be able to make second Non-Fungible Token transfer', async function () {
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
            Constants.GAS_LIMIT_1_000_000
          );

          const signerBalanceAfter = await pollForNewERC721Balance(
            erc721Contract,
            nftTokenAddress,
            signers[0].address,
            signerBalanceBefore
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

        it('should be able to make Non-Fungible Token transfer and sign it with hollow account', async function () {
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
            value: ethers.parseEther('2'),
          });

          await utils.updateAccountKeysViaHapi(
            [
              await tokenCreateContract.getAddress(),
              await tokenTransferContract.getAddress(),
            ],
            [hollowWallet.privateKey]
          );

          await tokenTransferContract
            .connect(hollowWallet)
            .transferNFTPublic(
              nftTokenAddress,
              hollowWalletAddress,
              signers[0].address,
              mintedTokenSerialNumber1,
              Constants.GAS_LIMIT_1_000_000
            );

          const signerBalanceAfter = await pollForNewERC721Balance(
            erc721Contract,
            nftTokenAddress,
            signers[0].address,
            signerBalanceBefore
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

    describe('Negative', function () {
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
          expect(e.code).to.eq(Constants.CALL_EXCEPTION);
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

describe('HIP583 Test Suite - Contract Transfer TX', function () {
  let signers;
  let contractTransferTx;
  const totalAmount = ethers.parseEther('100');
  const amount = ethers.parseEther('1');
  const tokenAmount = 30n;

  before(async function () {
    signers = await ethers.getSigners();
    const contractTransferTxFactory = await ethers.getContractFactory(
      Constants.Contract.ContractTransferTx
    );
    contractTransferTx = await contractTransferTxFactory.deploy();

    await (
      await signers[0].sendTransaction({
        to: await contractTransferTx.getAddress(),
        value: totalAmount,
        gasLimit: 1_000_000,
      })
    ).wait();
  });

  describe('HBAR Test', function () {
    let hollowWallet;

    before(async function () {
      hollowWallet = ethers.Wallet.createRandom().connect(ethers.provider);
    });

    it('should test that hollow account is created and the amount of HBARs is correctly transferred via contract', async function () {
      const hollowWalletBalanceBefore = await ethers.provider.getBalance(
        hollowWallet.address
      );
      const tx = await contractTransferTx.transferTo(
        hollowWallet.address,
        amount / BigInt(utils.tinybarToWeibarCoef),
        Constants.GAS_LIMIT_1_000_000
      );
      await tx.wait();
      const hollowWalletBalanceAfter = await ethers.provider.getBalance(
        hollowWallet.address
      );

      expect(hollowWalletBalanceBefore).to.eq(0);
      expect(hollowWalletBalanceAfter).to.eq(amount);
    });

    it('should test that second transfer HBARs via contract to the hollow account is successful', async function () {
      const hollowWalletBalanceBefore = await ethers.provider.getBalance(
        hollowWallet.address
      );
      const tx = await contractTransferTx.transferTo(
        hollowWallet.address,
        amount / BigInt(utils.tinybarToWeibarCoef),
        Constants.GAS_LIMIT_1_000_000
      );
      await tx.wait();
      const hollowWalletBalanceAfter = await pollForNewHollowWalletBalance(
        ethers.provider,
        hollowWallet.address,
        hollowWalletBalanceBefore
      );

      expect(hollowWalletBalanceAfter).to.eq(
        hollowWalletBalanceBefore + amount
      );
    });

    it('should test that can make HBAR transfer via contract from hollow account to another', async function () {
      const secondHollowWallet = ethers.Wallet.createRandom().connect(
        ethers.provider
      );
      const contractTransferTxWithHollowAccount =
        await contractTransferTx.connect(hollowWallet);
      const secondHollowWalletBefore = await ethers.provider.getBalance(
        secondHollowWallet.address
      );
      const tx = await contractTransferTxWithHollowAccount.transferTo(
        secondHollowWallet.address,
        amount / BigInt(utils.tinybarToWeibarCoef),
        Constants.GAS_LIMIT_1_000_000
      );
      await tx.wait();
      const secondHollowWalletAfter = await ethers.provider.getBalance(
        secondHollowWallet.address
      );

      expect(secondHollowWalletBefore).to.eq(0);
      expect(secondHollowWalletAfter).to.eq(amount);
    });
  });

  describe('Fungible Token Test', function () {
    let hollowWallet;
    let erc20Mock;
    const initialHollowWalletAmount = ethers.parseEther('14');

    before(async function () {
      hollowWallet = ethers.Wallet.createRandom().connect(ethers.provider);

      await (
        await contractTransferTx.transferTo(
          hollowWallet.address,
          initialHollowWalletAmount / BigInt(utils.tinybarToWeibarCoef),
          Constants.GAS_LIMIT_1_000_000
        )
      ).wait();

      erc20Mock = await utils.deployERC20Mock();
      await erc20Mock.mint(await contractTransferTx.getAddress(), 1000);
    });

    it('should create hollow account and transfer Fungible Tokens', async function () {
      const balanceBefore = await erc20Mock.balanceOf(hollowWallet.address);
      const tx = await contractTransferTx.transferFungibleTokenTo(
        await erc20Mock.getAddress(),
        hollowWallet.address,
        tokenAmount
      );
      await tx.wait();
      const balanceAfter = await erc20Mock.balanceOf(hollowWallet.address);

      expect(balanceBefore).to.eq(0);
      expect(balanceAfter).to.eq(tokenAmount);
    });

    it('should test that second transfer fungible tokens via contract to the hollow account is successful', async function () {
      const balanceBefore = await erc20Mock.balanceOf(hollowWallet.address);
      const tx = await contractTransferTx.transferFungibleTokenTo(
        await erc20Mock.getAddress(),
        hollowWallet.address,
        tokenAmount
      );
      await tx.wait();

      const balanceAfter = await pollForNewBalance(
        erc20Mock,
        hollowWallet.address,
        balanceBefore
      );
      expect(balanceAfter).to.eq(balanceBefore + tokenAmount);
    });

    it('should test that can make fungible token transfer via contract from hollow account to another', async function () {
      const secondHollowWallet = ethers.Wallet.createRandom().connect(
        ethers.provider
      );
      const secondHollowWalletBefore = await erc20Mock.balanceOf(
        secondHollowWallet.address
      );
      const contractTransferTxWithHollowAccount =
        await contractTransferTx.connect(hollowWallet);
      const tx =
        await contractTransferTxWithHollowAccount.transferFungibleTokenTo(
          await erc20Mock.getAddress(),
          secondHollowWallet.address,
          tokenAmount
        );
      await tx.wait();

      const secondHollowWalletAfter = await erc20Mock.balanceOf(
        secondHollowWallet.address
      );

      expect(secondHollowWalletBefore).to.eq(0);
      expect(secondHollowWalletAfter).to.eq(tokenAmount);
    });
  });

  describe('Non-fungible Token Test', function () {
    const tokenId = 27;
    let hollowWallet;
    let erc721Mock;
    const initialHollowWalletAmount = ethers.parseEther('20');

    before(async function () {
      hollowWallet = ethers.Wallet.createRandom().connect(ethers.provider);
      await (
        await contractTransferTx.transferTo(
          hollowWallet.address,
          initialHollowWalletAmount / BigInt(utils.tinybarToWeibarCoef),
          Constants.GAS_LIMIT_1_000_000
        )
      ).wait();

      erc721Mock = await utils.deployERC721Mock();
      await erc721Mock.mint(await contractTransferTx.getAddress(), tokenId);
    });

    it('should create hollow account and transfer NFT', async function () {
      const ownerBefore = await erc721Mock.ownerOf(tokenId);
      const tx = await contractTransferTx.transferFromNonFungibleTokenTo(
        await erc721Mock.getAddress(),
        await contractTransferTx.getAddress(),
        hollowWallet.address,
        tokenId
      );
      await tx.wait();

      const ownerAfter = await pollForNewERC721HollowWalletOwner(
        erc721Mock,
        tokenId,
        ownerBefore
      );

      expect(ownerBefore).to.not.eq(ownerAfter);
      expect(ownerAfter).to.eq(hollowWallet.address);
    });

    it('should test that second transfer of NFT via contract to the hollow account is successful', async function () {
      const secondTokenId = 31;
      const mintTx = await erc721Mock.mint(
        await contractTransferTx.getAddress(),
        secondTokenId
      );
      await mintTx.wait();

      const tx = await contractTransferTx.transferFromNonFungibleTokenTo(
        await erc721Mock.getAddress(),
        await contractTransferTx.getAddress(),
        hollowWallet.address,
        secondTokenId
      );
      await tx.wait();

      const owner = await erc721Mock.ownerOf(secondTokenId);

      expect(owner).to.eq(hollowWallet.address);
    });

    it('should test that can make NFT transfer via contract from hollow account to another', async function () {
      const secondHollowWallet = ethers.Wallet.createRandom().connect(
        ethers.provider
      );
      const erc721MockHollow = erc721Mock.connect(hollowWallet);
      await (
        await erc721MockHollow.approve(
          await contractTransferTx.getAddress(),
          tokenId
        )
      ).wait();

      const ownerBefore = await erc721Mock.ownerOf(tokenId);
      expect(ownerBefore).to.eq(hollowWallet.address);

      const contractTransferTxWithHollowAccount =
        await contractTransferTx.connect(hollowWallet);

      await (
        await contractTransferTxWithHollowAccount.transferFromNonFungibleTokenTo(
          await erc721Mock.getAddress(),
          hollowWallet.address,
          secondHollowWallet.address,
          tokenId
        )
      ).wait();

      const ownerAfter = await pollForNewERC721HollowWalletOwner(
        erc721Mock,
        tokenId,
        ownerBefore
      );
      expect(ownerAfter).to.eq(secondHollowWallet.address);
    });
  });
});

describe('HIP583 Test Suite - Ethereum Transfer TX via system-contracts', function () {
  let signers;
  let tokenCreateContract;
  let tokenTransferContract;
  let tokenQueryContract;
  let erc20Contract;
  let erc721Contract;

  before(async function () {
    signers = await ethers.getSigners();
    tokenCreateContract = await utils.deployTokenCreateContract();
    tokenQueryContract = await utils.deployTokenQueryContract();
    tokenTransferContract = await utils.deployTokenTransferContract();
    await utils.updateAccountKeysViaHapi([
      await tokenCreateContract.getAddress(),
      await tokenQueryContract.getAddress(),
      await tokenTransferContract.getAddress(),
    ]);
    erc20Contract = await utils.deployERC20Contract();
    erc721Contract = await utils.deployERC721Contract();
  });

  const bootstrapHollowAccount = async function (
    signer,
    hollowWallet,
    tokenCreateContract,
    tokenAddress
  ) {
    await signer.sendTransaction({
      to: hollowWallet.address,
      value: ethers.parseEther('100'),
      gasLimit: 1_000_000,
    });
    await utils.updateAccountKeysViaHapi(
      [await tokenCreateContract.getAddress()],
      [hollowWallet.privateKey]
    );
    const hollowWalletTokenCreateContract =
      await tokenCreateContract.connect(hollowWallet);
    await (
      await hollowWalletTokenCreateContract.associateTokenPublic(
        hollowWallet.address,
        tokenAddress,
        Constants.GAS_LIMIT_1_000_000
      )
    ).wait();
    await (
      await tokenCreateContract.grantTokenKycPublic(
        tokenAddress,
        hollowWallet.address
      )
    ).wait();
  };

  describe('Fungible Token Test', function () {
    const amount = BigInt(27);
    let tokenAddress;
    let hollowWallet;

    before(async function () {
      tokenAddress = await utils.createFungibleTokenWithSECP256K1AdminKey(
        tokenCreateContract,
        signers[0].address,
        utils.getSignerCompressedPublicKey()
      );
      await utils.updateTokenKeysViaHapi(tokenAddress, [
        await tokenCreateContract.getAddress(),
        await tokenTransferContract.getAddress(),
      ]);
      await utils.associateToken(
        tokenCreateContract,
        tokenAddress,
        Constants.Contract.TokenCreateContract
      );
      await utils.grantTokenKyc(tokenCreateContract, tokenAddress);

      hollowWallet = ethers.Wallet.createRandom().connect(ethers.provider);
      await bootstrapHollowAccount(
        signers[0],
        hollowWallet,
        tokenCreateContract,
        tokenAddress
      );
    });

    it('should test that hollow account is created and the amount of fungible tokens is correctly transferred via system-contracts', async function () {
      const hollowBalanceBefore = await erc20Contract.balanceOf(
        tokenAddress,
        hollowWallet.address
      );
      await tokenTransferContract.transferTokensPublic(
        tokenAddress,
        [signers[0].address, hollowWallet.address],
        [-amount, amount],
        Constants.GAS_LIMIT_1_000_000
      );

      const hollowBalanceAfter = await pollForNewWalletBalance(
        erc20Contract,
        tokenAddress,
        hollowWallet.address,
        hollowBalanceBefore
      );

      expect(hollowBalanceBefore).to.eq(0);
      expect(hollowBalanceAfter).to.eq(amount);
    });

    it('should test that second transfer fungible tokens via system-contracts to the hollow account is successful', async function () {
      const hollowBalanceBefore = await erc20Contract.balanceOf(
        tokenAddress,
        hollowWallet.address
      );
      await tokenTransferContract.transferTokensPublic(
        tokenAddress,
        [signers[0].address, hollowWallet.address],
        [-amount, amount],
        Constants.GAS_LIMIT_1_000_000
      );

      const hollowBalanceAfter = await pollForNewWalletBalance(
        erc20Contract,
        tokenAddress,
        hollowWallet.address,
        hollowBalanceBefore
      );
      expect(hollowBalanceAfter).to.eq(hollowBalanceBefore + amount);
    });

    it('should test that can make fungible token transfer via system-contracts from hollow account to another', async function () {
      const secondHollowWallet = ethers.Wallet.createRandom().connect(
        ethers.provider
      );
      await bootstrapHollowAccount(
        signers[0],
        secondHollowWallet,
        tokenCreateContract,
        tokenAddress
      );

      await utils.updateAccountKeysViaHapi(
        [await tokenTransferContract.getAddress()],
        [hollowWallet.privateKey]
      );

      const secondHollowBalanceBefore = await erc20Contract.balanceOf(
        tokenAddress,
        secondHollowWallet.address
      );

      const hollowTokenTransferContract =
        await tokenTransferContract.connect(hollowWallet);

      await hollowTokenTransferContract.transferTokensPublic(
        tokenAddress,
        [hollowWallet.address, secondHollowWallet.address],
        [-amount, amount],
        Constants.GAS_LIMIT_1_000_000
      );

      const secondHollowBalanceAfter = await pollForNewWalletBalance(
        erc20Contract,
        tokenAddress,
        secondHollowWallet.address,
        secondHollowBalanceBefore
      );

      expect(secondHollowBalanceBefore).to.eq(0);
      expect(secondHollowBalanceAfter).to.eq(amount);
    });
  });

  describe('Non-Fungible Token Test', function () {
    let nftTokenAddress;
    let hollowWallet;
    let mintedTokenSerialNumber;

    before(async function () {
      nftTokenAddress = await utils.createNonFungibleTokenWithSECP256K1AdminKey(
        tokenCreateContract,
        signers[0].address,
        utils.getSignerCompressedPublicKey()
      );

      await utils.updateTokenKeysViaHapi(nftTokenAddress, [
        await tokenCreateContract.getAddress(),
        await tokenTransferContract.getAddress(),
      ]);

      await utils.associateToken(
        tokenCreateContract,
        nftTokenAddress,
        Constants.Contract.TokenCreateContract
      );

      await utils.grantTokenKyc(tokenCreateContract, nftTokenAddress);

      hollowWallet = ethers.Wallet.createRandom().connect(ethers.provider);
      await bootstrapHollowAccount(
        signers[0],
        hollowWallet,
        tokenCreateContract,
        nftTokenAddress
      );

      mintedTokenSerialNumber = await utils.mintNFTToAddress(
        tokenCreateContract,
        nftTokenAddress
      );
    });

    it('should test that hollow account is created and the amount of non-fungible tokens is correctly transferred via system-contracts', async function () {
      const ownerBefore = await erc721Contract.ownerOf(
        nftTokenAddress,
        mintedTokenSerialNumber
      );

      await tokenTransferContract.transferNFTPublic(
        nftTokenAddress,
        signers[0].address,
        hollowWallet.address,
        mintedTokenSerialNumber,
        Constants.GAS_LIMIT_1_000_000
      );

      const ownerAfter = await erc721Contract.ownerOf(
        nftTokenAddress,
        mintedTokenSerialNumber
      );

      expect(ownerBefore).to.eq(signers[0].address);
      expect(ownerAfter).to.eq(hollowWallet.address);
    });

    it('should test that second transfer non-fungible tokens via system-contracts to the hollow account is successful', async function () {
      const newMintedTokenSerialNumber = await utils.mintNFTToAddress(
        tokenCreateContract,
        nftTokenAddress
      );

      const ownerBefore = await erc721Contract.ownerOf(
        nftTokenAddress,
        newMintedTokenSerialNumber
      );

      await tokenTransferContract.transferNFTPublic(
        nftTokenAddress,
        signers[0].address,
        hollowWallet.address,
        newMintedTokenSerialNumber,
        Constants.GAS_LIMIT_1_000_000
      );

      const ownerAfter = await erc721Contract.ownerOf(
        nftTokenAddress,
        newMintedTokenSerialNumber
      );

      expect(ownerBefore).to.eq(signers[0].address);
      expect(ownerAfter).to.eq(hollowWallet.address);
    });

    it('should test that can make non-fungible token transfer via system-contracts from hollow account to another', async function () {
      const secondHollowWallet = ethers.Wallet.createRandom().connect(
        ethers.provider
      );
      await bootstrapHollowAccount(
        signers[0],
        secondHollowWallet,
        tokenCreateContract,
        nftTokenAddress
      );

      const newMintedTokenSerialNumber = await utils.mintNFTToAddress(
        tokenCreateContract,
        nftTokenAddress
      );

      await tokenTransferContract.transferNFTPublic(
        nftTokenAddress,
        signers[0].address,
        hollowWallet.address,
        newMintedTokenSerialNumber,
        Constants.GAS_LIMIT_1_000_000
      );

      const ownerBefore = await erc721Contract.ownerOf(
        nftTokenAddress,
        newMintedTokenSerialNumber
      );
      await utils.updateAccountKeysViaHapi(
        [await tokenTransferContract.getAddress()],
        [hollowWallet.privateKey]
      );

      const hollowTokenTransferContract =
        await tokenTransferContract.connect(hollowWallet);
      await (
        await hollowTokenTransferContract.transferNFTPublic(
          nftTokenAddress,
          hollowWallet.address,
          secondHollowWallet.address,
          newMintedTokenSerialNumber,
          Constants.GAS_LIMIT_1_000_000
        )
      ).wait();

      const ownerAfter = await erc721Contract.ownerOf(
        nftTokenAddress,
        newMintedTokenSerialNumber
      );

      expect(ownerBefore).to.eq(hollowWallet.address);
      expect(ownerAfter).to.eq(secondHollowWallet.address);
    });
  });
});
