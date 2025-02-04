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
const Constants = require('../constants');
const utils = require('../system-contracts/hedera-token-service/utils');
const {
  pollForNewBalance,
  pollForNewHBarBalance,
} = require('../../utils/helpers');

describe('SafeHTS library Test Suite', function () {
  let safeOperationsContract;
  let fungibleTokenAddress;
  let nonFungibleTokenAddress;
  let safeViewOperationsContract;
  let signers;
  const nftSerial = '0x01';

  before(async function () {
    signers = await ethers.getSigners();
    safeOperationsContract = await deploySafeOperationsContract();
    safeViewOperationsContract = await deploySafeViewOperationsContract();
    await utils.updateAccountKeysViaHapi([
      await safeOperationsContract.getAddress(),
      await safeViewOperationsContract.getAddress(),
    ]);
    fungibleTokenAddress = await createFungibleToken();
    await utils.updateTokenKeysViaHapi(fungibleTokenAddress, [
      await safeOperationsContract.getAddress(),
      await safeViewOperationsContract.getAddress(),
    ]);
    nonFungibleTokenAddress = await createNonFungibleToken();
    await utils.updateTokenKeysViaHapi(nonFungibleTokenAddress, [
      await safeOperationsContract.getAddress(),
      await safeViewOperationsContract.getAddress(),
    ]);
  });

  async function deploySafeOperationsContract() {
    const safeOperationsFactory = await ethers.getContractFactory(
      Constants.Contract.SafeOperations
    );
    const safeOperations = await safeOperationsFactory
      .connect(signers[1])
      .deploy(Constants.GAS_LIMIT_1_000_000);

    return await ethers.getContractAt(
      Constants.Contract.SafeOperations,
      await safeOperations.getAddress()
    );
  }

  async function deploySafeViewOperationsContract() {
    const safeOperationsFactory = await ethers.getContractFactory(
      Constants.Contract.SafeViewOperations
    );
    const safeOperations = await safeOperationsFactory.deploy(
      Constants.GAS_LIMIT_10_000_000
    );

    return await ethers.getContractAt(
      Constants.Contract.SafeViewOperations,
      await safeOperations.getAddress()
    );
  }

  async function createFungibleToken() {
    const tokenAddressTx =
      await safeOperationsContract.safeCreateFungibleTokenPublic({
        value: BigInt('20000000000000000000'),
        gasLimit: 1_000_000,
      });

    const tokenAddressReceipt = await tokenAddressTx.wait();
    // token address
    return tokenAddressReceipt.logs.filter(
      (e) => e.fragment.name === Constants.Events.TokenCreated
    )[0].args[0];
  }

  async function createNonFungibleToken() {
    const tokenAddressTx =
      await safeOperationsContract.safeCreateNonFungibleTokenPublic({
        value: BigInt('50000000000000000000'),
        gasLimit: 10_000_000,
      });

    const tokenAddressReceipt = await tokenAddressTx.wait();
    // token address
    return tokenAddressReceipt.logs.filter(
      (e) => e.fragment.name === Constants.Events.TokenCreated
    )[0].args[0];
  }

  it('should be able to get token info', async function () {
    const tokenInfoTx =
      await safeViewOperationsContract.safeGetTokenInfoPublic(
        fungibleTokenAddress
      );
    const tokenInfoReceipt = await tokenInfoTx.wait();
    const tokenInfo = tokenInfoReceipt.logs.filter(
      (e) => e.fragment.name === Constants.Events.GetTokenInfo
    )[0].args[0];

    expect(tokenInfo.token.name).to.equal(Constants.TOKEN_NAME);
    expect(tokenInfo.token.symbol).to.equal(Constants.TOKEN_SYMBOL);
    expect(tokenInfo.totalSupply).to.equal(200);
  });

  it('should be able to get fungible token info', async function () {
    const fungibleTokenInfoTx =
      await safeViewOperationsContract.safeGetFungibleTokenInfoPublic(
        fungibleTokenAddress
      );
    const fungibleTokenInfoReceipt = await fungibleTokenInfoTx.wait();
    const fungibleTokenInfo = fungibleTokenInfoReceipt.logs.filter(
      (e) => e.fragment.name === Constants.Events.GetFungibleTokenInfo
    )[0].args[0];

    expect(fungibleTokenInfo.tokenInfo.token.name).to.equal(
      Constants.TOKEN_NAME
    );
    expect(fungibleTokenInfo.tokenInfo.token.symbol).to.equal(
      Constants.TOKEN_SYMBOL
    );
    expect(fungibleTokenInfo.tokenInfo.totalSupply).to.equal(200);
    expect(fungibleTokenInfo.decimals).to.equal(8);
  });

  it('should be able to get Non fungible token info', async function () {
    const amount = 0;

    const mintedTokenInfo = await safeOperationsContract.safeMintTokenPublic(
      nonFungibleTokenAddress,
      amount,
      [nftSerial],
      Constants.GAS_LIMIT_1_000_000
    );
    const nonFungibleTokenMintedReceipt = await mintedTokenInfo.wait();
    const nonFungibleTokeMintedInfo = nonFungibleTokenMintedReceipt.logs.filter(
      (e) => e.fragment.name === Constants.Events.MintedNft
    )[0].args[0];
    expect(nonFungibleTokeMintedInfo[0]).to.equal(nftSerial);

    const nonFungibleTokenInfoTx =
      await safeViewOperationsContract.safeGetNonFungibleTokenInfoPublic(
        nonFungibleTokenAddress,
        nftSerial
      );
    const nonFungibleTokenInfoReceipt = await nonFungibleTokenInfoTx.wait();
    const nonFungibleTokenInfo = nonFungibleTokenInfoReceipt.logs.filter(
      (e) => e.fragment.name === Constants.Events.GetNonFungibleTokenInfo
    )[0].args;

    expect(nonFungibleTokenInfo[0][1]).to.equal(nftSerial);

    expect(nonFungibleTokenInfo[0][2]).to.equal(signers[0].address);
  });

  it('should be able to transfer tokens and hbars atomically', async function () {
    const signer0AccountID = signers[0].address;
    const signer1AccountID = signers[1].address;

    const amount = 0;
    const signer1initialAmount = 100;
    const transferredAmount = 10n;
    const mintedTokenInfo = await safeOperationsContract.safeMintTokenPublic(
      nonFungibleTokenAddress,
      amount,
      [nftSerial],
      Constants.GAS_LIMIT_1_000_000
    );

    const nonFungibleTokenMintedReceipt = await mintedTokenInfo.wait();

    const nonFungibleTokeMintedSerialNumbers =
      nonFungibleTokenMintedReceipt.logs.filter(
        (e) => e.fragment.name === Constants.Events.MintedNft
      )[0].args[0];

    let signer0PrivateKey =
      config.networks[utils.getCurrentNetwork()].accounts[0];
    await utils.associateWithSigner(signer0PrivateKey, fungibleTokenAddress);
    let signer1PrivateKey =
      config.networks[utils.getCurrentNetwork()].accounts[1];
    await utils.associateWithSigner(signer1PrivateKey, fungibleTokenAddress);
    await utils.associateWithSigner(signer1PrivateKey, nonFungibleTokenAddress);

    await safeOperationsContract.safeGrantTokenKycPublic(
      nonFungibleTokenAddress,
      signer0AccountID
    );

    await safeOperationsContract.safeGrantTokenKycPublic(
      nonFungibleTokenAddress,
      signer1AccountID
    );

    await safeOperationsContract.safeTransferTokenPublic(
      fungibleTokenAddress,
      await safeOperationsContract.getAddress(),
      signer0AccountID,
      signer1initialAmount,
      Constants.GAS_LIMIT_1_000_000
    );

    const signers0BeforeHbarBalance =
      await signers[0].provider.getBalance(signer0AccountID);
    const signers1BeforeHbarBalance =
      await signers[0].provider.getBalance(signer1AccountID);

    const erc20Mock = await ethers.getContractAt(
      Constants.Contract.OZERC20Mock,
      fungibleTokenAddress
    );
    const signers0BeforeTokenBalance =
      await erc20Mock.balanceOf(signer0AccountID);
    const signers1BeforeTokenBalance =
      await erc20Mock.balanceOf(signer1AccountID);
    const erc721Mock = await ethers.getContractAt(
      Constants.Contract.OZERC721Mock,
      nonFungibleTokenAddress
    );
    const nftOwnerBefore = await erc721Mock.ownerOf(
      parseInt(nonFungibleTokeMintedSerialNumbers)
    );

    const transferList = {
      transfers: [
        {
          accountID: signer0AccountID, //sender
          amount: -10_000,
          isApproval: false,
        },
        {
          accountID: signer1AccountID, //receiver
          amount: 10_000,
          isApproval: false,
        },
      ],
    };

    //nft and token transfer
    const tokenTransferList = [
      {
        token: nonFungibleTokenAddress,
        transfers: [],
        nftTransfers: [
          {
            senderAccountID: signer0AccountID, //sender
            receiverAccountID: signer1AccountID, //receiver
            serialNumber: nonFungibleTokeMintedSerialNumbers[0],
            isApproval: false,
          },
        ],
      },
      {
        token: fungibleTokenAddress,
        transfers: [
          {
            accountID: signer1AccountID, //receiver
            amount: transferredAmount,
            isApproval: false,
          },
          {
            accountID: signer0AccountID, //sender
            amount: -transferredAmount,
            isApproval: false,
          },
        ],
        nftTransfers: [],
      },
    ];

    const cryptoTransferTx =
      await safeOperationsContract.safeCryptoTransferPublic(
        transferList,
        tokenTransferList,
        Constants.GAS_LIMIT_1_000_000
      );

    const cryptoTransferReceipt = await cryptoTransferTx.wait();

    expect(
      cryptoTransferReceipt.logs.filter(
        (e) => e.fragment.name === Constants.Events.ResponseCode
      )[0].args[0]
    ).to.equal(22);

    const signers0AfterHbarBalance = await pollForNewHBarBalance(
      signers[0].provider,
      signers0BeforeHbarBalance,
      signer0AccountID
    );
    const signers1AfterHbarBalance =
      await signers[0].provider.getBalance(signer1AccountID);

    const signers0AfterTokenBalance = await pollForNewBalance(
      erc20Mock,
      signer0AccountID,
      signers0BeforeTokenBalance
    );

    const signers1AfterTokenBalance = await pollForNewBalance(
      erc20Mock,
      signer1AccountID,
      signers1BeforeTokenBalance
    );

    const hbarTransferableAmount = BigInt(10_000 * 10_000_000_000);
    expect(signers0AfterHbarBalance).to.be.lessThan(
      signers0BeforeHbarBalance - hbarTransferableAmount
    );
    expect(signers1AfterHbarBalance).to.equal(
      signers1BeforeHbarBalance + hbarTransferableAmount
    );

    const nftOwnerAfter = await erc721Mock.ownerOf(
      parseInt(nonFungibleTokeMintedSerialNumbers)
    );
    expect(nftOwnerBefore).not.to.equal(nftOwnerAfter);

    expect(signers0AfterTokenBalance).to.equal(
      signers0BeforeTokenBalance - transferredAmount
    );

    expect(signers1AfterTokenBalance).to.equal(
      signers1BeforeTokenBalance + transferredAmount
    );
  });
});
