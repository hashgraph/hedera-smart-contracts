// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('hedera-examples-test-helpers/constants');
const utils = require('hedera-examples-test-helpers/hedera-token-service');
const {
  pollForNewBalance,
  pollForNewHBarBalance,
} = require('hedera-examples-test-helpers/helpers');
const {
  KeyList,
  PrivateKey,
  TokenCreateTransaction,
  TokenSupplyType,
  TokenType,
} = require('@hashgraph/sdk');

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
    // SafeOperations is the treasury of the fungible token and holds its supply.
    fungibleTokenAddress = await createFungibleToken();
    nonFungibleTokenAddress = await createNonFungibleToken();
  });

  // Signer 0's account id and an SDK client operated by signer 0.
  async function signer0Client() {
    const key = PrivateKey.fromStringECDSA(
      utils.getHardhatSignerPrivateKeyByIndex(0).replace('0x', '')
    );
    const accountId = await utils.getAccountId(
      signers[0].address,
      await utils.createSDKClient()
    );
    return {
      accountId,
      key,
      client: await utils.createSDKClient(accountId, key),
    };
  }

  async function deploySafeOperationsContract() {
    const safeOperationsFactory = await ethers.getContractFactory(
      Constants.Contract.SafeOperations
    );
    const safeOperations = await safeOperationsFactory
      .connect(signers[1])
      .deploy(Constants.GAS_LIMIT_10_000_000);

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

  // NFT with signer 0 as treasury. The treasury has to sign the creation, and a contract call
  // (safeCreateNonFungibleTokenPublic, treasury = msg.sender) cannot provide an EOA's signature,
  // so signer 0 creates it with a HAPI transaction. SafeOperations gets the supply and KYC keys
  // to mint and grant KYC from the tests.
  async function createNonFungibleToken() {
    const { accountId, key, client } = await signer0Client();
    const contractKey = new KeyList(
      [await utils.getContractId(await safeOperationsContract.getAddress())],
      1
    );
    const receipt = await (
      await new TokenCreateTransaction()
        .setTokenName(Constants.TOKEN_NAME)
        .setTokenSymbol(Constants.TOKEN_SYMBOL)
        .setTokenMemo('memo')
        .setTokenType(TokenType.NonFungibleUnique)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(1000)
        .setTreasuryAccountId(accountId)
        .setAdminKey(key.publicKey)
        .setSupplyKey(contractKey)
        .setKycKey(contractKey)
        .execute(client)
    ).getReceipt(client);

    return '0x' + receipt.tokenId.toSolidityAddress();
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

    let signer0PrivateKey = utils.getHardhatSignerPrivateKeyByIndex(0);
    await utils.associateWithSigner(signer0PrivateKey, fungibleTokenAddress);
    let signer1PrivateKey = utils.getHardhatSignerPrivateKeyByIndex(1);
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

    // SafeOperations moves signer 0's HBAR, NFT and fungible tokens below, so signer 0 grants it
    // allowances (debits use isApproval: true).
    await utils.approveAllowancesViaHapi(
      signer0PrivateKey,
      await safeOperationsContract.getAddress(),
      {
        hbarTinybars: 10_000,
        tokens: [{ token: fungibleTokenAddress, amount: Number(transferredAmount) }],
        nfts: [
          {
            token: nonFungibleTokenAddress,
            serial: Number(nonFungibleTokeMintedSerialNumbers[0]),
          },
        ],
      }
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
          isApproval: true,
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
            isApproval: true,
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
            isApproval: true,
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
        (e) => e.fragment?.name === Constants.Events.ResponseCode
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
