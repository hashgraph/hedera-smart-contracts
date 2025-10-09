// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const { ethers } = require('hardhat');
const utils = require('../utils');
const Constants = require('../../constants');
const { pollForNewERC20Balance } = require('../../helpers');

describe('TokenManagmentContract Test Suite', function () {
  const TX_SUCCESS_CODE = 22;
  const CUSTOM_SCHEDULE_ALREADY_HAS_NO_FEES = '244';
  const TOKEN_HAS_NO_FEE_SCHEDULE_KEY = '240';
  const CUSTOM_FEE_MUST_BE_POSITIVE = '239';
  const FRACTION_DIVIDES_BY_ZERO = '230';
  const CUSTOM_FEES_LIST_TOO_LONG = '232';
  const INVALID_CUSTOM_FEE_COLLECTOR = '233';
  const INVALID_TOKEN_ID_IN_CUSTOM_FEES = '234';
  const TOKEN_NOT_ASSOCIATED_TO_FEE_COLLECTOR = '235';

  let tokenCreateContract;
  let tokenQueryContract;
  let tokenManagmentContract;
  let tokenTransferContract;
  let tokenCreateCustomContract;
  let erc20Contract;
  let tokenAddress;
  let nftTokenAddress;
  let mintedTokenSerialNumber;
  let signers;
  let tokenInfoBefore;
  let keys;
  let tokenCreateCustomContractAddress;
  let tokenCreateContractAddress;
  let tokenTransferContractAddress;
  let tokenQueryContractAddress;
  let tokenManagementContractAddress;

  before(async function () {
    signers = await ethers.getSigners();
    tokenCreateContract = await utils.deployTokenCreateContract();
    tokenQueryContract = await utils.deployTokenQueryContract();
    tokenManagmentContract = await utils.deployTokenManagementContract();
    tokenTransferContract = await utils.deployTokenTransferContract();
    tokenCreateCustomContract = await utils.deployTokenCreateCustomContract();

    tokenCreateContractAddress = await tokenCreateContract.getAddress();
    tokenTransferContractAddress = await tokenTransferContract.getAddress();
    tokenQueryContractAddress = await tokenQueryContract.getAddress();
    tokenManagementContractAddress = await tokenManagmentContract.getAddress();
    tokenCreateCustomContractAddress =
      await tokenCreateCustomContract.getAddress();
    await utils.updateAccountKeysViaHapi([
      tokenCreateContractAddress,
      tokenTransferContractAddress,
      tokenManagementContractAddress,
      tokenQueryContractAddress,
      tokenCreateCustomContractAddress,
    ]);
    erc20Contract = await utils.deployERC20Contract();
    tokenAddress = await utils.createFungibleTokenWithSECP256K1AdminKey(
      tokenCreateContract,
      signers[0].address,
      utils.getSignerCompressedPublicKey()
    );
    await utils.updateTokenKeysViaHapi(tokenAddress, [
      await tokenCreateContract.getAddress(),
      await tokenTransferContract.getAddress(),
      await tokenManagmentContract.getAddress(),
      await tokenQueryContract.getAddress(),
    ]);
    nftTokenAddress = await utils.createNonFungibleTokenWithSECP256K1AdminKey(
      tokenCreateContract,
      signers[0].address,
      utils.getSignerCompressedPublicKey()
    );
    await utils.updateTokenKeysViaHapi(nftTokenAddress, [
      await tokenCreateContract.getAddress(),
      await tokenTransferContract.getAddress(),
      await tokenManagmentContract.getAddress(),
      await tokenQueryContract.getAddress(),
    ]);
    await utils.associateToken(
      tokenCreateContract,
      tokenAddress,
      Constants.Contract.TokenCreateContract
    );
    await utils.grantTokenKyc(tokenCreateContract, tokenAddress);
    await utils.associateToken(
      tokenCreateContract,
      nftTokenAddress,
      Constants.Contract.TokenCreateContract
    );
    await utils.grantTokenKyc(tokenCreateContract, nftTokenAddress);
    mintedTokenSerialNumber = await utils.mintNFT(
      tokenCreateContract,
      nftTokenAddress
    );
  });

  it('should be able to delete token', async function () {
    const newTokenAddress =
      await utils.createFungibleTokenWithSECP256K1AdminKey(
        tokenCreateContract,
        signers[0].address,
        utils.getSignerCompressedPublicKey()
      );
    await utils.updateTokenKeysViaHapi(newTokenAddress, [
      await tokenCreateContract.getAddress(),
      await tokenManagmentContract.getAddress(),
      await tokenQueryContract.getAddress(),
    ]);
    const txBefore =
      await tokenQueryContract.getTokenInfoPublic(newTokenAddress);
    const tokenInfoBefore = (await txBefore.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.TokenInfo
    )[0].args.tokenInfo;

    const tx = await tokenManagmentContract.deleteTokenPublic(newTokenAddress);
    await tx.wait();

    const txAfter = await tokenQueryContract.getTokenInfoPublic(
      newTokenAddress,
      Constants.GAS_LIMIT_1_000_000
    );
    const tokenInfoAfter = (await txAfter.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.TokenInfo
    )[0].args.tokenInfo;

    expect(tokenInfoBefore.deleted).to.equal(false);
    expect(tokenInfoAfter.deleted).to.equal(true);
  });

  it('should be able to freeze and unfreeze token', async function () {
    const freezeTx = await tokenManagmentContract.freezeTokenPublic(
      tokenAddress,
      await tokenCreateContract.getAddress()
    );
    const isFrozenTx = await tokenQueryContract.isFrozenPublic(
      tokenAddress,
      await tokenCreateContract.getAddress(),
      Constants.GAS_LIMIT_1_000_000
    );
    const responseCodeFreeze = (await freezeTx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args.responseCode;
    const responseCodeisFrozen = (await isFrozenTx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args.responseCode;
    const isFrozen = (await isFrozenTx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.Frozen
    )[0].args.frozen;

    expect(responseCodeFreeze).to.equal(TX_SUCCESS_CODE);
    expect(responseCodeisFrozen).to.equal(TX_SUCCESS_CODE);
    expect(isFrozen).to.equal(true);

    const unfreezeTx = await tokenManagmentContract.unfreezeTokenPublic(
      tokenAddress,
      await tokenCreateContract.getAddress()
    );
    const isStillFrozenTx = await tokenQueryContract.isFrozenPublic(
      tokenAddress,
      await tokenCreateContract.getAddress(),
      Constants.GAS_LIMIT_1_000_000
    );
    const responseCodeUnfreeze = (await unfreezeTx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args.responseCode;
    const responseCodeisStillFrozen = (
      await isStillFrozenTx.wait()
    ).logs.filter((e) => e.fragment.name === Constants.Events.ResponseCode)[0]
      .args.responseCode;
    const isStillFrozen = (await isStillFrozenTx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.Frozen
    )[0].args.frozen;

    expect(responseCodeUnfreeze).to.equal(TX_SUCCESS_CODE);
    expect(responseCodeisStillFrozen).to.equal(TX_SUCCESS_CODE);
    expect(isStillFrozen).to.equal(false);
  });

  it('should be able to wipe token', async function () {
    const wipeAmount = 3;

    await tokenTransferContract.transferTokensPublic(
      tokenAddress,
      [signers[0].address, signers[1].address],
      [-wipeAmount, wipeAmount]
    );

    const balanceBefore = await pollForNewERC20Balance(
      erc20Contract,
      tokenAddress,
      signers[1].address,
      0n
    );

    const tx = await tokenManagmentContract.wipeTokenAccountPublic(
      tokenAddress,
      signers[1].address,
      wipeAmount
    );

    const responseCode = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args.responseCode;

    const balanceAfter = await pollForNewERC20Balance(
      erc20Contract,
      tokenAddress,
      signers[1].address,
      balanceBefore
    );

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(Number(balanceAfter.toString())).to.equal(
      Number(balanceBefore.toString()) - wipeAmount
    );
  });

  it('should be able to remove token kyc', async function () {
    const revokeKycTx = await tokenManagmentContract.revokeTokenKycPublic(
      tokenAddress,
      await tokenCreateContract.getAddress()
    );
    const isKycTx = await tokenQueryContract.isKycPublic(
      tokenAddress,
      await tokenCreateContract.getAddress(),
      Constants.GAS_LIMIT_1_000_000
    );
    const revokeKycResponseCode = (await revokeKycTx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args.responseCode;
    const isKycResponseCode = (await isKycTx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args.responseCode;
    const isKyc = (await isKycTx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.KycGranted
    )[0].args.kycGranted;

    expect(revokeKycResponseCode).to.equal(TX_SUCCESS_CODE);
    expect(isKycResponseCode).to.equal(TX_SUCCESS_CODE);
    expect(isKyc).to.equal(false);

    await utils.grantTokenKyc(tokenCreateContract, tokenAddress);
  });

  it('should be able to pause and unpause token', async function () {
    const pauseTokenTx =
      await tokenManagmentContract.pauseTokenPublic(tokenAddress);
    const pauseTokenResponseCode = (await pauseTokenTx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args.responseCode;

    expect(pauseTokenResponseCode).to.equal(TX_SUCCESS_CODE);

    const unpauseTokenTx =
      await tokenManagmentContract.unpauseTokenPublic(tokenAddress);
    const uppauseTokenResponseCode = (await unpauseTokenTx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args.responseCode;

    expect(uppauseTokenResponseCode).to.equal(TX_SUCCESS_CODE);
  });

  it('should be able to wipe token account NFT', async function () {
    await tokenTransferContract.transferNFTPublic(
      nftTokenAddress,
      signers[0].address,
      signers[1].address,
      mintedTokenSerialNumber
    );
    const tx = await tokenManagmentContract.wipeTokenAccountNFTPublic(
      nftTokenAddress,
      signers[1].address,
      [mintedTokenSerialNumber]
    );
    const responseCode = (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args.responseCode;

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
  });

  it('should be able to update token info', async function () {
    const TOKEN_UPDATE_NAME = 'tokenUpdateName';
    const TOKEN_UPDATE_SYMBOL = 'tokenUpdateSymbol';
    const TOKEN_UPDATE_MEMO = 'tokenUpdateMemo';

    const txBeforeInfo =
      await tokenQueryContract.getTokenInfoPublic(tokenAddress);
    const tokenInfoBefore = (await txBeforeInfo.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.TokenInfo
    )[0].args.tokenInfo[0];
    const responseCodeTokenInfoBefore = (await txBeforeInfo.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args.responseCode;

    const token = {
      name: TOKEN_UPDATE_NAME,
      symbol: TOKEN_UPDATE_SYMBOL,
      memo: TOKEN_UPDATE_MEMO,
      treasury: signers[0].address, // treasury has to be the signing account,
      tokenSupplyType: tokenInfoBefore.tokenSupplyType,
      maxSupply: tokenInfoBefore.maxSupply,
      freezeDefault: tokenInfoBefore.freezeDefault,
      tokenKeys: [],
      expiry: {
        second: 0,
        autoRenewAccount: tokenInfoBefore.expiry[1],
        autoRenewPeriod: 0,
      },
    };

    const txUpdate = await tokenManagmentContract.updateTokenInfoPublic(
      tokenAddress,
      token,
      Constants.GAS_LIMIT_1_000_000
    );

    expect(
      (await txUpdate.wait()).logs.filter(
        (e) => e.fragment.name === Constants.Events.ResponseCode
      )[0].args.responseCode
    ).to.be.equal(TX_SUCCESS_CODE);

    const txAfterInfo =
      await tokenQueryContract.getTokenInfoPublic(tokenAddress);

    const tokenInfoAfter = (await txAfterInfo.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.TokenInfo
    )[0].args.tokenInfo[0];
    const responseCodeTokenInfoAfter = (await txAfterInfo.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args.responseCode;

    expect(responseCodeTokenInfoBefore).to.equal(TX_SUCCESS_CODE);
    expect(responseCodeTokenInfoAfter).to.equal(TX_SUCCESS_CODE);
    expect(tokenInfoAfter.name).to.equal(TOKEN_UPDATE_NAME);
    expect(tokenInfoAfter.symbol).to.equal(TOKEN_UPDATE_SYMBOL);
    expect(tokenInfoAfter.memo).to.equal(TOKEN_UPDATE_MEMO);
  });

  it('should be able to update token expiry info', async function () {
    const AUTO_RENEW_PERIOD = 8000000;
    const NEW_AUTO_RENEW_PERIOD = 7999900;
    const AUTO_RENEW_SECOND = 0;
    const epoch = parseInt(
      (Date.now() / 1000 + NEW_AUTO_RENEW_PERIOD).toFixed(0)
    );

    const getTokenExpiryInfoTxBefore =
      await tokenQueryContract.getTokenExpiryInfoPublic(
        tokenAddress,
        Constants.GAS_LIMIT_1_000_000
      );
    const responseCode = (await getTokenExpiryInfoTxBefore.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args.responseCode;
    const tokenExpiryInfoBefore = (
      await getTokenExpiryInfoTxBefore.wait()
    ).logs.filter(
      (e) => e.fragment.name === Constants.Events.TokenExpiryInfo
    )[0].args.expiryInfo;

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(tokenExpiryInfoBefore.autoRenewPeriod).to.equal(AUTO_RENEW_PERIOD);

    const expiryInfo = {
      second: AUTO_RENEW_SECOND,
      autoRenewAccount: `${signers[0].address}`,
      autoRenewPeriod: NEW_AUTO_RENEW_PERIOD,
    };

    const updateTokenExpiryInfoTx =
      await tokenManagmentContract.updateTokenExpiryInfoPublic(
        tokenAddress,
        expiryInfo,
        Constants.GAS_LIMIT_1_000_000
      );
    const updateExpiryInfoResponseCode = (
      await updateTokenExpiryInfoTx.wait()
    ).logs.filter((e) => e.fragment.name === Constants.Events.ResponseCode)[0]
      .args.responseCode;

    // get updated expiryInfo
    const getTokenExpiryInfoTxAfter =
      await tokenQueryContract.getTokenExpiryInfoPublic(
        tokenAddress,
        Constants.GAS_LIMIT_1_000_000
      );
    const getExpiryInfoResponseCode = (
      await getTokenExpiryInfoTxAfter.wait()
    ).logs.filter((e) => e.fragment.name === Constants.Events.ResponseCode)[0]
      .args.responseCode;
    const tokenExpiryInfoAfter = (
      await getTokenExpiryInfoTxAfter.wait()
    ).logs.filter(
      (e) => e.fragment.name === Constants.Events.TokenExpiryInfo
    )[0].args.expiryInfo;

    expect(updateExpiryInfoResponseCode).to.equal(TX_SUCCESS_CODE);
    expect(getExpiryInfoResponseCode).to.equal(TX_SUCCESS_CODE);
    expect(tokenExpiryInfoAfter.autoRenewPeriod).to.equal(
      expiryInfo.autoRenewPeriod
    );
    expect(tokenExpiryInfoAfter.second).to.be.closeTo(epoch, 300);
  });

  it('should be able to update token keys', async function () {
    const getKeyTx = await tokenQueryContract.getTokenKeyPublic(
      tokenAddress,
      2,
      Constants.GAS_LIMIT_1_000_000
    );
    const originalKey = (await getKeyTx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.TokenKey
    )[0].args.key;
    const updateKey = [
      false,
      '0x0000000000000000000000000000000000000000',
      '0x',
      '0x03dfcc94dfd843649cc594ada5ac6627031454602aa190223f996de25a05828f36',
      '0x0000000000000000000000000000000000000000',
    ];

    const updateTx = await tokenManagmentContract.updateTokenKeysPublic(
      tokenAddress,
      [[2, updateKey]]
    );
    const updateResponseCode = (await updateTx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args.responseCode;

    // Assert updated key
    const tx = await tokenQueryContract.getTokenKeyPublic(
      tokenAddress,
      2,
      Constants.GAS_LIMIT_1_000_000
    );
    const result = await tx.wait();
    const { responseCode } = result.logs.filter(
      (e) => e.fragment.name === Constants.Events.ResponseCode
    )[0].args;
    const updatedKey = result.logs.filter(
      (e) => e.fragment.name === Constants.Events.TokenKey
    )[0].args.key;

    expect(responseCode).to.equal(TX_SUCCESS_CODE);
    expect(updateResponseCode).to.equal(TX_SUCCESS_CODE);

    expect(updatedKey).to.exist;
    expect(updatedKey.inheritAccountKey).to.eq(updateKey[0]);
    expect(updatedKey.contractId).to.eq(updateKey[1]);
    expect(updatedKey.ed25519).to.eq(updateKey[2]);
    expect(updatedKey.ECDSA_secp256k1).to.eq(updateKey[3]);
    expect(updatedKey.delegatableContractId).to.eq(updateKey[4]);
    expect(updatedKey.ECDSA_secp256k1).to.not.eq(originalKey.ECDSA_secp256k1);
  });

  it('should be able to burn token', async function () {
    const amount = BigInt(111);
    const totalSupplyBefore = await erc20Contract.totalSupply(tokenAddress);
    const balanceBefore = await erc20Contract.balanceOf(
      tokenAddress,
      signers[0].address
    );
    await tokenManagmentContract.burnTokenPublic(tokenAddress, amount, []);

    const balanceAfter = await pollForNewERC20Balance(
      erc20Contract,
      tokenAddress,
      signers[0].address,
      balanceBefore
    );
    const totalSupplyAfter = await erc20Contract.totalSupply(tokenAddress);

    expect(totalSupplyAfter).to.equal(totalSupplyBefore - amount);
    expect(balanceAfter).to.equal(balanceBefore - amount);
  });

  it('should be able to dissociate tokens', async function () {
    const signers = await ethers.getSigners();
    const tokenCreateContractWallet2 = tokenCreateContract.connect(signers[1]);
    const tokenManagmentContractWallet2 = tokenManagmentContract.connect(
      signers[1]
    );

    const txDisassociate =
      await tokenManagmentContractWallet2.dissociateTokensPublic(
        signers[1].address,
        [tokenAddress],
        Constants.GAS_LIMIT_1_000_000
      );
    const receiptDisassociate = await txDisassociate.wait();
    expect(
      receiptDisassociate.logs.filter(
        (e) => e.fragment.name === Constants.Events.ResponseCode
      )[0].args.responseCode
    ).to.equal(22);

    const txAssociate = await tokenCreateContractWallet2.associateTokensPublic(
      signers[1].address,
      [tokenAddress],
      Constants.GAS_LIMIT_1_000_000
    );
    const receiptAssociate = await txAssociate.wait();
    expect(
      receiptAssociate.logs.filter(
        (e) => e.fragment.name === Constants.Events.ResponseCode
      )[0].args.responseCode
    ).to.equal(22);
  });

  it('should be able to dissociate token', async function () {
    const signers = await ethers.getSigners();
    const tokenCreateContractWallet2 = tokenCreateContract.connect(signers[1]);
    const tokenManagmentContractWallet2 = tokenManagmentContract.connect(
      signers[1]
    );

    const txDisassociate =
      await tokenManagmentContractWallet2.dissociateTokenPublic(
        signers[1].address,
        tokenAddress,
        Constants.GAS_LIMIT_1_000_000
      );
    const receiptDisassociate = await txDisassociate.wait();
    expect(
      receiptDisassociate.logs.filter(
        (e) => e.fragment.name === Constants.Events.ResponseCode
      )[0].args.responseCode
    ).to.equal(22);

    const txAssociate = await tokenCreateContractWallet2.associateTokenPublic(
      signers[1].address,
      tokenAddress,
      Constants.GAS_LIMIT_1_000_000
    );
    const receiptAssociate = await txAssociate.wait();
    expect(
      receiptAssociate.logs.filter(
        (e) => e.fragment.name === Constants.Events.ResponseCode
      )[0].args.responseCode
    ).to.equal(22);
  });

  describe('Extended update token info and keys test suite', function () {
    async function getTokenInfo(contract, token) {
      const txBeforeInfo = await contract.getTokenInfoPublic(token);
      const tokenInfo = (await txBeforeInfo.wait()).logs.filter(
        (e) => e.fragment.name === Constants.Events.TokenInfo
      )[0].args.tokenInfo[0];
      expect(
        (await txBeforeInfo.wait()).logs.filter(
          (e) => e.fragment.name === Constants.Events.ResponseCode
        )[0].args.responseCode
      ).to.eq(TX_SUCCESS_CODE);
      return tokenInfo;
    }

    async function updateTokenInfo(contract, token, updateInfo) {
      const txUpdate = await contract.updateTokenInfoPublic(
        token,
        updateInfo,
        Constants.GAS_LIMIT_1_000_000
      );
      expect(
        (await txUpdate.wait()).logs.filter(
          (e) => e.fragment.name === Constants.Events.ResponseCode
        )[0].args.responseCode
      ).to.be.equal(TX_SUCCESS_CODE);
    }

    function updateTokenInfoValues(keyValueType, key) {
      const updatedKey = [
        false,
        '0x0000000000000000000000000000000000000000',
        '0x',
        '0x',
        '0x0000000000000000000000000000000000000000',
      ];

      switch (keyValueType) {
        case utils.KeyValueType.CONTRACT_ID:
          updatedKey[1] = key;
          break;
        case utils.KeyValueType.SECP256K1:
          updatedKey[3] = key;
          break;
        case utils.KeyValueType.DELEGETABLE_CONTRACT_ID:
          updatedKey[4] = key;
          break;
        default:
          break;
      }

      return updatedKey;
    }

    describe('Admin key set to ECDSA_secp256k', function () {
      before(async function () {
        tokenAddress = await utils.createFungibleTokenWithSECP256K1AdminKey(
          tokenCreateContract,
          signers[0].address,
          utils.getSignerCompressedPublicKey()
        );
        await utils.updateTokenKeysViaHapi(tokenAddress, [
          await tokenCreateContract.getAddress(),
          await tokenTransferContract.getAddress(),
          await tokenManagmentContract.getAddress(),
          await tokenQueryContract.getAddress(),
        ]);
        tokenInfoBefore = await getTokenInfo(tokenQueryContract, tokenAddress);

        await utils.associateToken(
          tokenCreateContract,
          tokenAddress,
          Constants.Contract.TokenCreateContract
        );
        await utils.grantTokenKyc(tokenCreateContract, tokenAddress);
      });

      it('should be able to change PAUSE key to contractId and pause the token with same contract', async function () {
        //Update token info
        {
          const contractId = await tokenManagmentContract.getAddress();
          const updatedKey = updateTokenInfoValues(
            utils.KeyValueType.CONTRACT_ID,
            contractId
          );

          const token = {
            name: tokenInfoBefore.name,
            symbol: tokenInfoBefore.symbol,
            memo: tokenInfoBefore.memo,
            treasury: signers[0].address, // treasury has to be the signing account,
            tokenSupplyType: tokenInfoBefore.tokenSupplyType,
            maxSupply: tokenInfoBefore.maxSupply,
            freezeDefault: tokenInfoBefore.freezeDefault,
            tokenKeys: [[utils.KeyType.PAUSE, updatedKey]],
            expiry: {
              second: 0,
              autoRenewAccount: tokenInfoBefore.expiry[1],
              autoRenewPeriod: 0,
            },
          };

          await updateTokenInfo(tokenManagmentContract, tokenAddress, token);
        }

        //Pause and unpause token
        {
          const pauseTokenTx = await tokenManagmentContract
            .connect(signers[1])
            .pauseTokenPublic(tokenAddress);

          await pauseTokenTx.wait();

          const unpauseTokenTx = await tokenManagmentContract
            .connect(signers[1])
            .unpauseTokenPublic(tokenAddress);

          await unpauseTokenTx.wait();

          expect(
            (await pauseTokenTx.wait()).logs.filter(
              (e) => e.fragment.name === Constants.Events.PausedToken
            )[0].args.paused
          ).to.eq(true);
          expect(
            (await unpauseTokenTx.wait()).logs.filter(
              (e) => e.fragment.name === Constants.Events.UnpausedToken
            )[0].args.unpaused
          ).to.eq(true);
          expect(
            (await pauseTokenTx.wait()).logs.filter(
              (e) => e.fragment.name === Constants.Events.ResponseCode
            )[0].args.responseCode
          ).to.eq(TX_SUCCESS_CODE);
          expect(
            (await unpauseTokenTx.wait()).logs.filter(
              (e) => e.fragment.name === Constants.Events.ResponseCode
            )[0].args.responseCode
          ).to.eq(TX_SUCCESS_CODE);
        }

        //Revert previous update token info
        {
          const updatedKeyAfter = updateTokenInfoValues(
            utils.KeyValueType.SECP256K1,
            utils.getSignerCompressedPublicKey()
          );

          const tokenAfter = {
            name: tokenInfoBefore.name,
            symbol: tokenInfoBefore.symbol,
            memo: tokenInfoBefore.memo,
            treasury: signers[0].address, // treasury has to be the signing account,
            tokenSupplyType: tokenInfoBefore.tokenSupplyType,
            maxSupply: tokenInfoBefore.maxSupply,
            freezeDefault: tokenInfoBefore.freezeDefault,
            tokenKeys: [[utils.KeyType.PAUSE, updatedKeyAfter]],
            expiry: {
              second: 0,
              autoRenewAccount: tokenInfoBefore.expiry[1],
              autoRenewPeriod: 0,
            },
          };

          tokenAfter.treasury = signers[0].address;
          await updateTokenInfo(
            tokenManagmentContract,
            tokenAddress,
            tokenAfter
          );
        }
      });

      it('should not be able to pause the token with different PAUSE key', async function () {
        const pauseTokenTx = await tokenManagmentContract
          .connect(signers[1])
          .pauseTokenPublic(tokenAddress);
        const unpauseTokenTx = await tokenManagmentContract
          .connect(signers[1])
          .unpauseTokenPublic(tokenAddress);

        await utils.expectToFail(pauseTokenTx, Constants.CALL_EXCEPTION);
        await utils.expectToFail(unpauseTokenTx, Constants.CALL_EXCEPTION);
      });

      it('should be able to change WIPE key to contractId and wipe the token with same contract', async function () {
        //Update token info
        {
          const contractId = await tokenManagmentContract.getAddress();
          const updatedKey = updateTokenInfoValues(
            utils.KeyValueType.CONTRACT_ID,
            contractId
          );

          const token = {
            name: tokenInfoBefore.name,
            symbol: tokenInfoBefore.symbol,
            memo: tokenInfoBefore.memo,
            treasury: signers[0].address, // treasury has to be the signing account,
            tokenSupplyType: tokenInfoBefore.tokenSupplyType,
            maxSupply: tokenInfoBefore.maxSupply,
            freezeDefault: tokenInfoBefore.freezeDefault,
            tokenKeys: [[utils.KeyType.WIPE, updatedKey]],
            expiry: {
              second: 0,
              autoRenewAccount: tokenInfoBefore.expiry[1],
              autoRenewPeriod: 0,
            },
          };

          await updateTokenInfo(tokenManagmentContract, tokenAddress, token);
        }

        //Wipe token
        {
          const wipeAmount = BigInt(3);
          await tokenTransferContract.transferTokensPublic(
            tokenAddress,
            [signers[0].address, signers[1].address],
            [-wipeAmount, wipeAmount]
          );

          const balanceBefore = await pollForNewERC20Balance(
            erc20Contract,
            tokenAddress,
            signers[1].address,
            0n
          );

          const tx = await tokenManagmentContract
            .connect(signers[1])
            .wipeTokenAccountPublic(
              tokenAddress,
              signers[1].address,
              wipeAmount
            );

          const balanceAfter = await pollForNewERC20Balance(
            erc20Contract,
            tokenAddress,
            signers[1].address,
            balanceBefore
          );

          expect(balanceAfter).to.eq(balanceBefore - wipeAmount);
          expect(
            (await tx.wait()).logs.filter(
              (e) => e.fragment.name === Constants.Events.ResponseCode
            )[0].args.responseCode
          ).to.eq(TX_SUCCESS_CODE);
        }

        //Revert previous update token info
        {
          const updatedKeyAfter = updateTokenInfoValues(
            utils.KeyValueType.SECP256K1,
            utils.getSignerCompressedPublicKey()
          );

          const tokenAfter = {
            name: tokenInfoBefore.name,
            symbol: tokenInfoBefore.symbol,
            memo: tokenInfoBefore.memo,
            treasury: signers[0].address, // treasury has to be the signing account,
            tokenSupplyType: tokenInfoBefore.tokenSupplyType,
            maxSupply: tokenInfoBefore.maxSupply,
            freezeDefault: tokenInfoBefore.freezeDefault,
            tokenKeys: [[utils.KeyType.WIPE, updatedKeyAfter]],
            expiry: {
              second: 0,
              autoRenewAccount: tokenInfoBefore.expiry[1],
              autoRenewPeriod: 0,
            },
          };

          tokenAfter.treasury = signers[0].address;
          await updateTokenInfo(
            tokenManagmentContract,
            tokenAddress,
            tokenAfter
          );
        }
      });

      it('should not be able to wipe the token with different WIPE key', async function () {
        const wipeAmount = 3;
        await tokenTransferContract.transferTokensPublic(
          tokenAddress,
          [signers[0].address, signers[1].address],
          [-wipeAmount, wipeAmount]
        );

        // await until the new balance is settled for signers[1]
        await pollForNewERC20Balance(
          erc20Contract,
          tokenAddress,
          signers[1].address,
          0n
        );

        const wipeTokenTx = await tokenManagmentContract
          .connect(signers[1])
          .wipeTokenAccountPublic(tokenAddress, signers[1].address, wipeAmount);
        await utils.expectToFail(wipeTokenTx, Constants.CALL_EXCEPTION);
      });

      it('should be able to change FREEZE key to contractId and freeze the token with same contract', async function () {
        //Update token info
        {
          const contractId = await tokenManagmentContract.getAddress();
          const updatedKey = updateTokenInfoValues(
            utils.KeyValueType.CONTRACT_ID,
            contractId
          );

          const token = {
            name: tokenInfoBefore.name,
            symbol: tokenInfoBefore.symbol,
            memo: tokenInfoBefore.memo,
            treasury: signers[0].address, // treasury has to be the signing account,
            tokenSupplyType: tokenInfoBefore.tokenSupplyType,
            maxSupply: tokenInfoBefore.maxSupply,
            freezeDefault: tokenInfoBefore.freezeDefault,
            tokenKeys: [[utils.KeyType.FREEZE, updatedKey]],
            expiry: {
              second: 0,
              autoRenewAccount: tokenInfoBefore.expiry[1],
              autoRenewPeriod: 0,
            },
          };

          token.treasury = signers[0].address;

          await updateTokenInfo(tokenManagmentContract, tokenAddress, token);
        }

        //Freeze and unfreeze token
        {
          const freezeTx = await tokenManagmentContract
            .connect(signers[1])
            .freezeTokenPublic(
              tokenAddress,
              await tokenCreateContract.getAddress()
            );
          const isFrozenTxBefore = await tokenQueryContract.isFrozenPublic(
            tokenAddress,
            await tokenCreateContract.getAddress(),
            Constants.GAS_LIMIT_1_000_000
          );

          const unfreezeTx = await tokenManagmentContract
            .connect(signers[1])
            .unfreezeTokenPublic(
              tokenAddress,
              await tokenCreateContract.getAddress()
            );
          const isFrozenTxAfter = await tokenQueryContract.isFrozenPublic(
            tokenAddress,
            await tokenCreateContract.getAddress(),
            Constants.GAS_LIMIT_1_000_000
          );

          expect(
            (await isFrozenTxBefore.wait()).logs.filter(
              (e) => e.fragment.name === Constants.Events.Frozen
            )[0].args.frozen
          ).to.eq(true);
          expect(
            (await isFrozenTxAfter.wait()).logs.filter(
              (e) => e.fragment.name === Constants.Events.Frozen
            )[0].args.frozen
          ).to.eq(false);

          expect(
            (await freezeTx.wait()).logs.filter(
              (e) => e.fragment.name === Constants.Events.ResponseCode
            )[0].args.responseCode
          ).to.eq(TX_SUCCESS_CODE);
          expect(
            (await unfreezeTx.wait()).logs.filter(
              (e) => e.fragment.name === Constants.Events.ResponseCode
            )[0].args.responseCode
          ).to.eq(TX_SUCCESS_CODE);
        }

        //Revert previous update token info
        {
          const updatedKeyAfter = updateTokenInfoValues(
            utils.KeyValueType.SECP256K1,
            utils.getSignerCompressedPublicKey()
          );

          const tokenAfter = {
            name: tokenInfoBefore.name,
            symbol: tokenInfoBefore.symbol,
            memo: tokenInfoBefore.memo,
            treasury: signers[0].address, // treasury has to be the signing account,
            tokenSupplyType: tokenInfoBefore.tokenSupplyType,
            maxSupply: tokenInfoBefore.maxSupply,
            freezeDefault: tokenInfoBefore.freezeDefault,
            tokenKeys: [[utils.KeyType.FREEZE, updatedKeyAfter]],
            expiry: {
              second: 0,
              autoRenewAccount: tokenInfoBefore.expiry[1],
              autoRenewPeriod: 0,
            },
          };

          tokenAfter.treasury = signers[0].address;
          await updateTokenInfo(
            tokenManagmentContract,
            tokenAddress,
            tokenAfter
          );
        }
      });

      it('should not be able to freeze the token with different FREEZE key', async function () {
        const freezeTokenTx = await tokenManagmentContract
          .connect(signers[1])
          .freezeTokenPublic(
            tokenAddress,
            await tokenCreateContract.getAddress()
          );
        const unfreezeTokenTx = await tokenManagmentContract
          .connect(signers[1])
          .unfreezeTokenPublic(
            tokenAddress,
            await tokenCreateContract.getAddress(),
            Constants.GAS_LIMIT_1_000_000
          );

        await utils.expectToFail(freezeTokenTx, Constants.CALL_EXCEPTION);
        await utils.expectToFail(unfreezeTokenTx, Constants.CALL_EXCEPTION);
      });

      it('should be able to change ADMIN key to contractId and perform admin action with same contract', async function () {
        //Update token info
        {
          const contractId = await tokenManagmentContract.getAddress();

          const updatedKey = updateTokenInfoValues(
            utils.KeyValueType.CONTRACT_ID,
            contractId
          );

          const token = {
            name: tokenInfoBefore.name,
            symbol: tokenInfoBefore.symbol,
            memo: tokenInfoBefore.memo,
            treasury: signers[0].address, // treasury has to be the signing account,
            tokenSupplyType: tokenInfoBefore.tokenSupplyType,
            maxSupply: tokenInfoBefore.maxSupply,
            freezeDefault: tokenInfoBefore.freezeDefault,
            tokenKeys: [[utils.KeyType.ADMIN, updatedKey]],
            expiry: {
              second: 0,
              autoRenewAccount: tokenInfoBefore.expiry[1],
              autoRenewPeriod: 0,
            },
          };

          token.treasury = signers[0].address;

          await updateTokenInfo(tokenManagmentContract, tokenAddress, token);
        }

        //Change supply key with admin contract
        {
          const updatedKey = updateTokenInfoValues(
            utils.KeyValueType.CONTRACT_ID,
            await tokenTransferContract.getAddress()
          );

          const keyTxBefore = await tokenQueryContract.getTokenKeyPublic(
            tokenAddress,
            utils.KeyType.SUPPLY,
            Constants.GAS_LIMIT_1_000_000
          );
          const keyBefore = (await keyTxBefore.wait()).logs.filter(
            (e) => e.fragment.name === Constants.Events.TokenKey
          )[0].args.key;

          const updateTokenKeyTx = await tokenManagmentContract
            .connect(signers[1])
            .updateTokenKeysPublic(tokenAddress, [
              [utils.KeyType.SUPPLY, updatedKey],
            ]);

          const keyTxAfter = await tokenQueryContract.getTokenKeyPublic(
            tokenAddress,
            utils.KeyType.SUPPLY,
            Constants.GAS_LIMIT_1_000_000
          );
          const keyAfter = (await keyTxAfter.wait()).logs.filter(
            (e) => e.fragment.name === Constants.Events.TokenKey
          )[0].args.key;

          expect(keyBefore[1]).to.not.eq(keyAfter[1]);
          expect(
            (await updateTokenKeyTx.wait()).logs.filter(
              (e) => e.fragment.name === Constants.Events.ResponseCode
            )[0].args.responseCode
          ).to.eq(TX_SUCCESS_CODE);
        }
      });

      it('should be able to perform admin action with TokenManagementContract as ADMIN key', async function () {
        const updatedKey = updateTokenInfoValues(
          utils.KeyValueType.CONTRACT_ID,
          await tokenTransferContract.getAddress()
        );
        const updateTokenKeyTx = await tokenManagmentContract
          .connect(signers[1])
          .updateTokenKeysPublic(tokenAddress, [
            [utils.KeyType.SUPPLY, updatedKey],
          ]);

        expect(
          (await updateTokenKeyTx.wait()).logs.filter(
            (e) => e.fragment.name === Constants.Events.ResponseCode
          )[0].args.responseCode
        ).to.eq(TX_SUCCESS_CODE);
      });
    });

    describe('Admin key set to contractId', function () {
      before(async function () {
        tokenAddress = await utils.createFungibleTokenWithSECP256K1AdminKey(
          tokenCreateContract,
          signers[0].address,
          utils.getSignerCompressedPublicKey()
        );

        await utils.updateTokenKeysViaHapi(tokenAddress, [
          await tokenCreateContract.getAddress(),
          await tokenTransferContract.getAddress(),
          await tokenManagmentContract.getAddress(),
          await tokenQueryContract.getAddress(),
        ]);

        tokenInfoBefore = await getTokenInfo(tokenQueryContract, tokenAddress);

        await utils.associateToken(
          tokenCreateContract,
          tokenAddress,
          Constants.Contract.TokenCreateContract
        );

        await utils.grantTokenKyc(tokenCreateContract, tokenAddress);
      });
      describe('Positive', function () {
        it('should be able to change PAUSE key to ECDSA_secp256k and pause the token with the same account', async function () {
          await utils.updateTokenKeysViaHapi(
            tokenAddress,
            [await tokenManagmentContract.getAddress()],
            false,
            true,
            false,
            false,
            false,
            false
          );

          const pauseTokenTx = await tokenManagmentContract
            .connect(signers[1])
            .pauseTokenPublic(tokenAddress);
          const unpauseTokenTx = await tokenManagmentContract
            .connect(signers[1])
            .unpauseTokenPublic(tokenAddress);

          expect(
            (await pauseTokenTx.wait()).logs.filter(
              (e) => e.fragment.name === Constants.Events.PausedToken
            )[0].args.paused
          ).to.eq(true);
          expect(
            (await unpauseTokenTx.wait()).logs.filter(
              (e) => e.fragment.name === Constants.Events.UnpausedToken
            )[0].args.unpaused
          ).to.eq(true);
          expect(
            (await pauseTokenTx.wait()).logs.filter(
              (e) => e.fragment.name === Constants.Events.ResponseCode
            )[0].args.responseCode
          ).to.eq(TX_SUCCESS_CODE);
          expect(
            (await unpauseTokenTx.wait()).logs.filter(
              (e) => e.fragment.name === Constants.Events.ResponseCode
            )[0].args.responseCode
          ).to.eq(TX_SUCCESS_CODE);
        });

        it('should be able to change WIPE key to ECDSA_secp256k and wipe the token with the same account', async function () {
          await utils.updateTokenKeysViaHapi(
            tokenAddress,
            [await tokenManagmentContract.getAddress()],
            false,
            false,
            false,
            false,
            false,
            true
          );
          const wipeAmount = 3;
          await tokenTransferContract.transferTokensPublic(
            tokenAddress,
            [signers[0].address, signers[1].address],
            [-wipeAmount, wipeAmount],
            Constants.GAS_LIMIT_1_000_000
          );

          const balanceBefore = await pollForNewERC20Balance(
            erc20Contract,
            tokenAddress,
            signers[1].address,
            0n
          );

          const tx = await tokenManagmentContract
            .connect(signers[1])
            .wipeTokenAccountPublic(
              tokenAddress,
              signers[1].address,
              wipeAmount
            );

          const balanceAfter = await pollForNewERC20Balance(
            erc20Contract,
            tokenAddress,
            signers[1].address,
            balanceBefore
          );

          expect(balanceAfter).to.eq(balanceBefore - BigInt(wipeAmount));
          expect(
            (await tx.wait()).logs.filter(
              (e) => e.fragment.name === Constants.Events.ResponseCode
            )[0].args.responseCode
          ).to.eq(TX_SUCCESS_CODE);
        });

        it('should be able to change FREEZE key to ECDSA_secp256k and freeze the token with the same account', async function () {
          await utils.updateTokenKeysViaHapi(
            tokenAddress,
            [await tokenManagmentContract.getAddress()],
            false,
            false,
            false,
            true,
            false,
            false
          );
          const freezeTx = await tokenManagmentContract
            .connect(signers[1])
            .freezeTokenPublic(
              tokenAddress,
              await tokenCreateContract.getAddress(),
              Constants.GAS_LIMIT_1_000_000
            );
          const isFrozenTxBefore = await tokenQueryContract.isFrozenPublic(
            tokenAddress,
            await tokenCreateContract.getAddress(),
            Constants.GAS_LIMIT_1_000_000
          );

          const unfreezeTx = await tokenManagmentContract
            .connect(signers[1])
            .unfreezeTokenPublic(
              tokenAddress,
              await tokenCreateContract.getAddress(),
              Constants.GAS_LIMIT_1_000_000
            );
          const isFrozenTxAfter = await tokenQueryContract.isFrozenPublic(
            tokenAddress,
            await tokenCreateContract.getAddress(),
            Constants.GAS_LIMIT_1_000_000
          );

          expect(
            (await isFrozenTxBefore.wait()).logs.filter(
              (e) => e.fragment.name === Constants.Events.Frozen
            )[0].args.frozen
          ).to.eq(true);
          expect(
            (await isFrozenTxAfter.wait()).logs.filter(
              (e) => e.fragment.name === Constants.Events.Frozen
            )[0].args.frozen
          ).to.eq(false);

          expect(
            (await freezeTx.wait()).logs.filter(
              (e) => e.fragment.name === Constants.Events.ResponseCode
            )[0].args.responseCode
          ).to.eq(TX_SUCCESS_CODE);
          expect(
            (await unfreezeTx.wait()).logs.filter(
              (e) => e.fragment.name === Constants.Events.ResponseCode
            )[0].args.responseCode
          ).to.eq(TX_SUCCESS_CODE);
        });

        it('should be able to change ADMIN key to ECDSA_secp256k and perform admin action with same contract', async function () {
          await utils.updateTokenKeysViaHapi(
            tokenAddress,
            [await tokenManagmentContract.getAddress()],
            true,
            false,
            false,
            false,
            false,
            false
          );
          const keyTxBefore = await tokenQueryContract.getTokenKeyPublic(
            tokenAddress,
            utils.KeyType.SUPPLY,
            Constants.GAS_LIMIT_1_000_000
          );
          const keyBefore = (await keyTxBefore.wait()).logs.filter(
            (e) => e.fragment.name === Constants.Events.TokenKey
          )[0].args.key;
          const updatedKey = updateTokenInfoValues(
            utils.KeyValueType.CONTRACT_ID,
            await tokenTransferContract.getAddress()
          );
          const updateTokenKeyTx = await tokenManagmentContract
            .connect(signers[0])
            .updateTokenKeysPublic(tokenAddress, [
              [utils.KeyType.SUPPLY, updatedKey],
            ]);
          const keyTxAfter = await tokenQueryContract.getTokenKeyPublic(
            tokenAddress,
            utils.KeyType.SUPPLY,
            Constants.GAS_LIMIT_1_000_000
          );
          const keyAfter = (await keyTxAfter.wait()).logs.filter(
            (e) => e.fragment.name === Constants.Events.TokenKey
          )[0].args.key;

          expect(keyBefore[1]).to.not.eq(keyAfter[1]);
          expect(
            (await updateTokenKeyTx.wait()).logs.filter(
              (e) => e.fragment.name === Constants.Events.ResponseCode
            )[0].args.responseCode
          ).to.eq(TX_SUCCESS_CODE);
        });
      });
      describe('Negative', function () {
        before(async function () {
          tokenAddress = await utils.createFungibleTokenWithSECP256K1AdminKey(
            tokenCreateContract,
            signers[0].address,
            utils.getSignerCompressedPublicKey()
          );
        });
        it('should not be able to pause the token with different PAUSE key', async function () {
          const pauseTokenTx = await tokenManagmentContract
            .connect(signers[1])
            .pauseTokenPublic(tokenAddress);
          const unpauseTokenTx = await tokenManagmentContract
            .connect(signers[1])
            .unpauseTokenPublic(tokenAddress);

          await utils.expectToFail(pauseTokenTx, Constants.CALL_EXCEPTION);
          await utils.expectToFail(unpauseTokenTx, Constants.CALL_EXCEPTION);
        });

        it('should not be able to wipe the token with different WIPE key', async function () {
          const wipeAmount = 3;

          await utils.updateTokenKeysViaHapi(tokenAddress, [
            await tokenCreateContract.getAddress(),
          ]);

          await utils.associateToken(
            tokenCreateContract,
            tokenAddress,
            Constants.Contract.TokenCreateContract
          );
          await utils.grantTokenKyc(tokenCreateContract, tokenAddress);

          await tokenTransferContract.transferTokensPublic(
            tokenAddress,
            [signers[0].address, signers[1].address],
            [-wipeAmount, wipeAmount],
            Constants.GAS_LIMIT_1_000_000
          );

          // await until the new balance is settled for signers[1]
          await pollForNewERC20Balance(
            erc20Contract,
            tokenAddress,
            signers[1].address,
            0n
          );

          const wipeTokenTx = await tokenManagmentContract
            .connect(signers[1])
            .wipeTokenAccountPublic(
              tokenAddress,
              signers[1].address,
              wipeAmount
            );
          await utils.expectToFail(wipeTokenTx, Constants.CALL_EXCEPTION);
        });

        it('should not be able to freeze the token with different FREEZE key', async function () {
          const freezeTokenTx = await tokenManagmentContract
            .connect(signers[1])
            .freezeTokenPublic(
              tokenAddress,
              await tokenCreateContract.getAddress()
            );
          const unfreezeTokenTx = await tokenManagmentContract
            .connect(signers[1])
            .unfreezeTokenPublic(
              tokenAddress,
              await tokenCreateContract.getAddress()
            );

          await utils.expectToFail(freezeTokenTx, Constants.CALL_EXCEPTION);
          await utils.expectToFail(unfreezeTokenTx, Constants.CALL_EXCEPTION);
        });

        it('should not be able to perform admin action with different ADMIN key', async function () {
          const updatedKey = updateTokenInfoValues(
            utils.KeyValueType.CONTRACT_ID,
            await tokenTransferContract.getAddress()
          );
          const updateTokenKeyTx = await tokenManagmentContract
            .connect(signers[1])
            .updateTokenKeysPublic(tokenAddress, [
              [utils.KeyType.SUPPLY, updatedKey],
            ]);
          await utils.expectToFail(updateTokenKeyTx, Constants.CALL_EXCEPTION);
        });
      });
    });
  });

  describe('Update fees', function () {
    let feeToken;
    let tokenWithFees;
    let tenHbars;
    let twentyHbars;
    let tokenFeeAmount;

    before(async function () {
      // The owner of the fee token is the tokenCreateContract
      const adminKey = utils.constructIHederaTokenKey(
        'ADMIN',
        'SECP256K1',
        utils.getSignerCompressedPublicKey(0)
      );
      const kycKey = utils.constructIHederaTokenKey(
        'KYC',
        'CONTRACT_ID',
        await tokenCreateCustomContract.getAddress()
      );
      const freezeKey = utils.constructIHederaTokenKey(
        'FREEZE',
        'CONTRACT_ID',
        await tokenCreateCustomContract.getAddress()
      );
      const wipeKey = utils.constructIHederaTokenKey(
        'WIPE',
        'CONTRACT_ID',
        await tokenCreateCustomContract.getAddress()
      );
      const supplyKey = utils.constructIHederaTokenKey(
        'SUPPLY',
        'CONTRACT_ID',
        await tokenCreateCustomContract.getAddress()
      );
      const feeKey = utils.constructIHederaTokenKey(
        'FEE',
        'CONTRACT_ID',
        await tokenCreateCustomContract.getAddress()
      );
      const pauseKey = utils.constructIHederaTokenKey(
        'PAUSE',
        'CONTRACT_ID',
        await tokenCreateCustomContract.getAddress()
      );

      keys = [
        adminKey,
        kycKey,
        freezeKey,
        wipeKey,
        supplyKey,
        feeKey,
        pauseKey,
      ];
    });

    beforeEach(async function () {
      tenHbars = 10 * utils.tinybarToHbarCoef;
      twentyHbars = 20 * utils.tinybarToHbarCoef;
      tokenFeeAmount = 50;
      initialSupply = 1000000000;
      maxSupply = 2000000000;
      decimals = 0;
      feeToken = await utils.createFungibleTokenWithPresetKeysPublic(
        tokenCreateCustomContract,
        'FeeToken',
        'FT',
        'FeeToken',
        1000000000,
        2000000000,
        0,
        false,
        tokenCreateCustomContractAddress
      );
    });

    it('should be able to update fixed fee in HTS token', async function () {
      //need to associate the fee collector account of the token that will have fees
      await utils.associateAndGrantKyc(tokenCreateCustomContract, feeToken, [
        signers[0].address,
      ]);

      const fixedFee = [
        {
          amount: tokenFeeAmount,
          tokenId: feeToken,
          useHbarsForPayment: false,
          useCurrentTokenForPayment: false,
          feeCollector: signers[0].address,
        },
      ];
      tokenWithFees = await utils.createFungibleTokenWithCustomFeesAndKeys(
        tokenCreateCustomContract,
        signers[0].address,
        fixedFee,
        [],
        keys
      );
      await utils.updateTokenKeysViaHapi(tokenWithFees, [
        tokenManagementContractAddress,
        tokenTransferContractAddress,
        tokenCreateContractAddress,
        tokenCreateCustomContractAddress,
      ]);

      // ------------------ Associate and grantKyc to accounts tranfering tokenWithFees ------------------
      //TODO: error handling
      await utils.associateAndGrantKyc(tokenCreateContract, tokenWithFees, [
        signers[1].address,
        signers[2].address,
      ]);
      await utils.associateAndGrantKyc(tokenCreateCustomContract, feeToken, [
        signers[1].address,
      ]);

      const grantKycTx = await tokenCreateCustomContract.grantTokenKycPublic(
        feeToken,
        tokenCreateCustomContractAddress
      );
      await grantKycTx.wait();

      const transferTx = await tokenTransferContract.transferTokensPublic(
        tokenWithFees,
        [signers[0].address, signers[1].address],
        [-500, 500]
      );
      await transferTx.wait();

      const approveTx = await tokenCreateCustomContract.approvePublic(
        feeToken,
        tokenTransferContract,
        1000,
        Constants.GAS_LIMIT_1_000_000
      );
      await approveTx.wait();

      const transferFeeTokenToSigner1 =
        await tokenTransferContract.transferTokensPublic(
          feeToken,
          [tokenCreateCustomContractAddress, signers[1].address],
          [-150, 150],
          Constants.GAS_LIMIT_1_000_000
        );
      await transferFeeTokenToSigner1.wait();

      const updatedTokenFeeAmount = tokenFeeAmount + 15;
      const updatedFixedFee = [
        {
          amount: updatedTokenFeeAmount,
          tokenId: feeToken,
          useHbarsForPayment: false,
          useCurrentTokenForPayment: false,
          feeCollector: signers[0].address,
        },
      ];
      const updateFeeTx =
        await tokenManagmentContract.updateFungibleTokenCustomFeesPublic(
          tokenWithFees,
          updatedFixedFee,
          []
        );
      const updateFeeResponseCode = (await updateFeeTx.wait()).logs.filter(
        (e) => e.fragment.name === Constants.Events.ResponseCode
      )[0].args.responseCode;

      const balanceBeforeTransferTokenWithFees1 = await utils.getTokenBalance(
        signers[1].address,
        tokenWithFees
      );
      const balanceBeforeTransferTokenWithFees2 = await utils.getTokenBalance(
        signers[2].address,
        tokenWithFees
      );
      const balanceBeforeTransferFeeToken1 = await utils.getTokenBalance(
        signers[1].address,
        feeToken
      );

      const transferBeforeFeeUpdate =
        await tokenTransferContract.transferTokensPublic(
          tokenWithFees,
          [signers[1].address, signers[2].address],
          [-50, 50],
          Constants.GAS_LIMIT_1_000_000
        );
      await transferBeforeFeeUpdate.wait();

      const balanceAfterTransferTokenWithFees1 = await utils.getTokenBalance(
        signers[1].address,
        tokenWithFees
      );
      const balanceAfterTransferTokenWithFees2 = await utils.getTokenBalance(
        signers[2].address,
        tokenWithFees
      );
      const balanceAfterTransferFeeToken1 = await utils.getTokenBalance(
        signers[1].address,
        feeToken
      );

      expect(balanceAfterTransferTokenWithFees1).to.be.equal(
        balanceBeforeTransferTokenWithFees1 - 50
      );
      expect(balanceAfterTransferTokenWithFees2).to.be.equal(
        balanceBeforeTransferTokenWithFees2 + 50
      );
      expect(balanceAfterTransferFeeToken1).to.be.equal(
        balanceBeforeTransferFeeToken1 - updatedTokenFeeAmount
      );

      const tokenInfoTx =
        await tokenQueryContract.getTokenInfoPublic(tokenWithFees);
      const tokenInfoResponse = (await tokenInfoTx.wait()).logs.filter(
        (e) => e.fragment.name === Constants.Events.TokenInfo
      )[0].args.tokenInfo;

      expect(tokenInfoResponse[5].length).to.be.greaterThan(0);
      expect(tokenInfoResponse[5][0][2]).to.equal(false);
      expect(updateFeeResponseCode).to.equal(TX_SUCCESS_CODE);
    });

    it('should be able to update fixed fee for HBARs', async function () {
      const fixedFee = [
        {
          amount: tenHbars,
          tokenId: ethers.ZeroAddress,
          useHbarsForPayment: true,
          useCurrentTokenForPayment: false,
          feeCollector: signers[0].address,
        },
      ];
      const tokenWithFixedHbarFee =
        await utils.createFungibleTokenWithCustomFeesAndKeys(
          tokenCreateCustomContract,
          signers[0].address,
          fixedFee,
          [],
          keys
        );
      await utils.updateTokenKeysViaHapi(tokenWithFixedHbarFee, [
        tokenManagementContractAddress,
        tokenCreateContractAddress,
      ]);
      // ------------------ Associate and grantKyc to accounts transfering tokenWithFixedHbarFee ------------------
      await utils.associateAndGrantKyc(
        tokenCreateContract,
        tokenWithFixedHbarFee,
        [signers[1].address, signers[2].address]
      );

      const transferFromContract =
        await tokenTransferContract.transferTokensPublic(
          tokenWithFixedHbarFee,
          [signers[0].address, signers[1].address],
          [-500, 500]
        );
      const transferFromContractReceipt = await transferFromContract.wait();

      const balanceBeforeTransfer0 = await utils.getHbarBalance(
        signers[1].address
      );
      const balanceBeforeTransferContract0 = await utils.getHbarBalance(
        signers[2].address
      );

      const transferBeforeFeeUpdate =
        await tokenTransferContract.transferTokensPublic(
          tokenWithFixedHbarFee,
          [signers[1].address, signers[2].address],
          [-50, 50],
          Constants.GAS_LIMIT_1_000_000
        );
      await transferBeforeFeeUpdate.wait();

      const balanceAfterTransfer = await utils.getHbarBalance(
        signers[1].address
      );
      const balanceAfterTransferContract = await utils.getHbarBalance(
        signers[2].address
      );

      expect(parseFloat(balanceAfterTransfer)).to.be.equal(
        parseFloat(balanceBeforeTransfer0) -
          parseFloat(tenHbars / utils.tinybarToHbarCoef)
      );
      const updatedFixedFee = [
        {
          amount: twentyHbars,
          tokenId: '0x0000000000000000000000000000000000000000',
          useHbarsForPayment: true,
          useCurrentTokenForPayment: false,
          feeCollector: signers[0].address,
        },
      ];

      const updateFeeTx =
        await tokenManagmentContract.updateFungibleTokenCustomFeesPublic(
          tokenWithFixedHbarFee,
          updatedFixedFee,
          []
        );
      const updateFeeResponseCode = (await updateFeeTx.wait()).logs.filter(
        (e) => e.fragment.name === Constants.Events.ResponseCode
      )[0].args.responseCode;

      const transferAfterFeeUpdate =
        await tokenTransferContract.transferTokensPublic(
          tokenWithFixedHbarFee,
          [signers[1].address, signers[2].address],
          [-50, 50],
          Constants.GAS_LIMIT_1_000_000
        );
      await transferAfterFeeUpdate.wait();
      const balanceAfterUpdate = await utils.getHbarBalance(signers[1].address);
      const balanceAfterUpdateContract = await utils.getHbarBalance(
        signers[2].address
      );

      expect(parseFloat(balanceAfterUpdate)).to.be.equal(
        parseFloat(balanceAfterTransfer) -
          parseFloat(twentyHbars / utils.tinybarToHbarCoef)
      );
      const tokenInfoTx = await tokenQueryContract.getTokenInfoPublic(
        tokenWithFixedHbarFee
      );

      const tokenInfoResponse = (await tokenInfoTx.wait()).logs.filter(
        (e) => e.fragment.name === Constants.Events.TokenInfo
      )[0].args.tokenInfo;

      expect(tokenInfoResponse[5].length).to.be.greaterThan(0);
      expect(tokenInfoResponse[5][0][2]).to.equal(true);
      expect(updateFeeResponseCode).to.equal(TX_SUCCESS_CODE);
    });

    it('should be able to update fixed fee in the same token', async function () {
      const fixedFeeSameToken = [
        {
          amount: tokenFeeAmount,
          tokenId: ethers.ZeroAddress,
          useHbarsForPayment: false,
          useCurrentTokenForPayment: true,
          feeCollector: signers[3].address,
        },
      ];
      const tokenWithFixedFeeInSameToken =
        await utils.createFungibleTokenWithCustomFeesAndKeys(
          tokenCreateCustomContract,
          signers[0].address,
          fixedFeeSameToken,
          [],
          keys
        );

      await utils.updateTokenKeysViaHapi(tokenWithFixedFeeInSameToken, [
        tokenManagementContractAddress,
        tokenTransferContractAddress,
        tokenCreateContractAddress,
      ]);

      await utils.associateAndGrantKyc(
        tokenCreateContract,
        tokenWithFixedFeeInSameToken,
        [signers[1].address]
      );

      const transferTokenFromTreasury =
        await tokenTransferContract.transferTokensPublic(
          tokenWithFixedFeeInSameToken,
          [signers[0].address, signers[1].address],
          [-500, 500],
          Constants.GAS_LIMIT_1_000_000
        );
      await transferTokenFromTreasury.wait();

      const newFeeTokenAmount = tokenFeeAmount + 100;
      const fixedFeeSameTokenUpdated = [
        {
          amount: newFeeTokenAmount,
          tokenId: ethers.ZeroAddress,
          useHbarsForPayment: false,
          useCurrentTokenForPayment: true,
          feeCollector: signers[3].address,
        },
      ];
      const updateFeeTx =
        await tokenManagmentContract.updateFungibleTokenCustomFeesPublic(
          tokenWithFixedFeeInSameToken,
          fixedFeeSameTokenUpdated,
          []
        );
      await updateFeeTx.wait();

      const updateFeeResponseCode = (await updateFeeTx.wait()).logs.filter(
        (e) => e.fragment.name === Constants.Events.ResponseCode
      )[0].args.responseCode;
      const tokenInfoTx = await tokenQueryContract.getTokenInfoPublic(
        tokenWithFixedFeeInSameToken
      );

      const tokenInfoResponse = (await tokenInfoTx.wait()).logs.filter(
        (e) => e.fragment.name === Constants.Events.TokenInfo
      )[0].args.tokenInfo;

      expect(tokenInfoResponse[5].length).to.be.greaterThan(0);
      expect(updateFeeResponseCode).to.equal(TX_SUCCESS_CODE);
    });

    it('should be able to update multiple fixed fees in HTS token', async function () {
      const feeToken2 = await utils.createFungibleTokenWithPresetKeysPublic(
        tokenCreateCustomContract,
        'FeeToken2',
        'FT2',
        'FeeToken2',
        initialSupply,
        maxSupply,
        decimals,
        false,
        signers[3].address
      );
      //need to associate the fee collector account of the token that will have fees
      // with the fee token, since otherwise the collector won't be able to receive this token
      const associateTx = await tokenCreateCustomContract.associateTokenPublic(
        signers[0].address,
        feeToken2,
        Constants.GAS_LIMIT_1_000_000
      );
      await associateTx.wait();
      const associateTx2 = await tokenCreateCustomContract.associateTokenPublic(
        signers[0].address,
        feeToken,
        Constants.GAS_LIMIT_1_000_000
      );
      await associateTx2.wait();

      const fixedFee = {
        amount: tokenFeeAmount,
        tokenId: feeToken,
        useHbarsForPayment: false,
        useCurrentTokenForPayment: false,
        feeCollector: signers[0].address,
      };
      const fixedFee2 = {
        amount: tokenFeeAmount + 20,
        tokenId: feeToken2,
        useHbarsForPayment: false,
        useCurrentTokenForPayment: false,
        feeCollector: signers[0].address,
      };

      const tokenWithFees =
        await utils.createFungibleTokenWithCustomFeesAndKeys(
          tokenCreateCustomContract,
          signers[0].address,
          [fixedFee, fixedFee2],
          [],
          keys
        );
      expect(
        await utils.getTokenBalance(signers[0].address, tokenWithFees)
      ).to.be.equal(utils.initialSupply);
      await utils.updateTokenKeysViaHapi(tokenWithFees, [
        tokenManagementContractAddress,
        tokenTransferContractAddress,
        tokenCreateContractAddress,
        tokenCreateCustomContractAddress,
      ]);

      const associateTx3 = await tokenCreateCustomContract.associateTokenPublic(
        signers[2].address,
        feeToken2,
        Constants.GAS_LIMIT_1_000_000
      );
      await associateTx3.wait();

      const newTokenAmount = tokenFeeAmount + 25;
      const updatedFixedFee = {
        amount: newTokenAmount,
        tokenId: feeToken,
        useHbarsForPayment: false,
        useCurrentTokenForPayment: false,
        feeCollector: signers[0].address,
      };
      const updatedFixedFee2 = {
        amount: tokenFeeAmount + 18,
        tokenId: feeToken2,
        useHbarsForPayment: false,
        useCurrentTokenForPayment: false,
        feeCollector: signers[2].address,
      };
      const updateFeeTx =
        await tokenManagmentContract.updateFungibleTokenCustomFeesPublic(
          tokenWithFees,
          [updatedFixedFee, updatedFixedFee2],
          []
        );
      const updateFeeResponseCode = (await updateFeeTx.wait()).logs.filter(
        (e) => e.fragment.name === Constants.Events.ResponseCode
      )[0].args.responseCode;
      const tokenInfoTx =
        await tokenQueryContract.getTokenInfoPublic(tokenWithFees);
      const tokenInfoResponse = (await tokenInfoTx.wait()).logs.filter(
        (e) => e.fragment.name === Constants.Events.TokenInfo
      )[0].args.tokenInfo;

      expect(tokenInfoResponse[5].length).to.be.greaterThan(0);
      expect(tokenInfoResponse[5][0][0]).to.equal(BigInt(newTokenAmount));
      expect(tokenInfoResponse[5][0][2]).to.equal(false);
      expect(tokenInfoResponse[5][0][3]).to.equal(false);
      expect(tokenInfoResponse[5][1][0]).to.equal(BigInt(tokenFeeAmount + 18));
      expect(tokenInfoResponse[5][1][2]).to.equal(false);
      expect(tokenInfoResponse[5][1][3]).to.equal(false);
      expect(updateFeeResponseCode).to.equal(TX_SUCCESS_CODE);

      //TODO: Add transfer and test if the fee is collected
    });

    it('should be able to update multiple fixed fees in HBARs', async function () {
      const thirtyHbars = 30 * utils.tinybarToHbarCoef;
      const fixedFee = {
        amount: tenHbars,
        tokenId: ethers.ZeroAddress,
        useHbarsForPayment: true,
        useCurrentTokenForPayment: false,
        feeCollector: signers[0].address,
      };
      const fixedFee2 = {
        amount: thirtyHbars,
        tokenId: ethers.ZeroAddress,
        useHbarsForPayment: true,
        useCurrentTokenForPayment: false,
        feeCollector: signers[0].address,
      };
      const tokenWithFixedHbarFee =
        await utils.createFungibleTokenWithCustomFeesAndKeys(
          tokenCreateCustomContract,
          signers[0].address,
          [fixedFee, fixedFee2],
          [],
          keys
        );
      await utils.updateTokenKeysViaHapi(tokenWithFixedHbarFee, [
        tokenManagementContractAddress,
        tokenCreateContractAddress,
      ]);
      // ------------------ Associate and grantKyc to accounts transfering tokenWithFixedHbarFee ------------------
      await utils.associateAndGrantKyc(
        tokenCreateContract,
        tokenWithFixedHbarFee,
        [signers[1].address, signers[2].address]
      );

      const transferFromContract =
        await tokenTransferContract.transferTokensPublic(
          tokenWithFixedHbarFee,
          [signers[0].address, signers[1].address],
          [-500, 500]
        );
      await transferFromContract.wait();

      const balanceBeforeTransfer0 = await utils.getHbarBalance(
        signers[1].address
      );

      const transferBeforeFeeUpdate =
        await tokenTransferContract.transferTokensPublic(
          tokenWithFixedHbarFee,
          [signers[1].address, signers[2].address],
          [-50, 50],
          Constants.GAS_LIMIT_1_000_000
        );
      await transferBeforeFeeUpdate.wait();

      const balanceAfterTransfer = await utils.getHbarBalance(
        signers[1].address
      );

      expect(parseFloat(balanceAfterTransfer)).to.be.equal(
        parseFloat(balanceBeforeTransfer0) -
          parseFloat((tenHbars + thirtyHbars) / utils.tinybarToHbarCoef)
      );
      const updatedFixedFee = {
        amount: twentyHbars,
        tokenId: ethers.ZeroAddress,
        useHbarsForPayment: true,
        useCurrentTokenForPayment: false,
        feeCollector: signers[0].address,
      };
      const updatedFixedFee2 = {
        amount: twentyHbars,
        tokenId: ethers.ZeroAddress,
        useHbarsForPayment: true,
        useCurrentTokenForPayment: false,
        feeCollector: signers[0].address,
      };
      const updateFeeTx =
        await tokenManagmentContract.updateFungibleTokenCustomFeesPublic(
          tokenWithFixedHbarFee,
          [updatedFixedFee, updatedFixedFee2],
          []
        );
      const updateFeeResponseCode = (await updateFeeTx.wait()).logs.filter(
        (e) => e.fragment.name === Constants.Events.ResponseCode
      )[0].args.responseCode;

      const transferAfterFeeUpdate =
        await tokenTransferContract.transferTokensPublic(
          tokenWithFixedHbarFee,
          [signers[1].address, signers[2].address],
          [-50, 50],
          Constants.GAS_LIMIT_1_000_000
        );
      await transferAfterFeeUpdate.wait();
      const balanceAfterUpdate = await utils.getHbarBalance(signers[1].address);

      expect(parseFloat(balanceAfterUpdate)).to.be.equal(
        parseFloat(balanceAfterTransfer) -
          parseFloat((twentyHbars * 2) / utils.tinybarToHbarCoef)
      );

      const tokenInfoTx = await tokenQueryContract.getTokenInfoPublic(
        tokenWithFixedHbarFee
      );
      const tokenInfoResponse = (await tokenInfoTx.wait()).logs.filter(
        (e) => e.fragment.name === Constants.Events.TokenInfo
      )[0].args.tokenInfo;

      expect(tokenInfoResponse[5].length).to.be.greaterThan(0);
      expect(tokenInfoResponse[5][0][2]).to.equal(true);
      expect(updateFeeResponseCode).to.equal(TX_SUCCESS_CODE);
    });

    it('should be able to update fractional fee with net of transfer false in HTS token', async function () {
      const fractionalFeeNumerator = 30;
      const fractionalFeeDenominator = 100;
      const feeToken2 = await utils.createFungibleTokenWithPresetKeysPublic(
        tokenCreateCustomContract,
        'FeeToken2',
        'FT2',
        'FeeToken2',
        initialSupply,
        maxSupply,
        decimals,
        false,
        signers[3].address
      );
      await utils.associateToken(
        tokenCreateCustomContract,
        feeToken2,
        Constants.Contract.TokenCreateContract
      );

      const fractionalFee = {
        numerator: fractionalFeeNumerator,
        denominator: fractionalFeeDenominator,
        minimumAmount: 0,
        maximumAmount: 0,
        netOfTransfers: false,
        feeCollector: signers[0].address,
      };
      const fixedFee2 = {
        amount: tokenFeeAmount + 50,
        tokenId: feeToken2,
        useHbarsForPayment: false,
        useCurrentTokenForPayment: false,
        feeCollector: signers[0].address,
      };
      const tokenWithFees =
        await utils.createFungibleTokenWithCustomFeesAndKeys(
          tokenCreateCustomContract,
          signers[0].address,
          [fixedFee2],
          [fractionalFee],
          keys
        );

      await utils.updateTokenKeysViaHapi(tokenWithFees, [
        tokenManagementContractAddress,
        tokenTransferContractAddress,
        tokenCreateContractAddress,
        tokenCreateCustomContractAddress,
      ]);

      const updatedFractionalFeeNumerator = fractionalFeeNumerator + 5;
      const updatedFractionalFee = [
        {
          numerator: updatedFractionalFeeNumerator,
          denominator: fractionalFeeDenominator,
          minimumAmount: 100,
          maximumAmount: 1000,
          netOfTransfers: false,
          feeCollector: signers[0].address,
        },
      ];

      // make a transfer and ensure that the fee is collected
      //apparently first you need to associate and then gran token kyc
      await utils.associateAndGrantKyc(tokenCreateContract, tokenWithFees, [
        signers[1].address,
        signers[2].address,
      ]);
      const transferTx = await tokenTransferContract.transferTokensPublic(
        tokenWithFees,
        [signers[0].address, signers[1].address],
        [-500, 500]
      );
      await transferTx.wait();

      const updateFeeTx =
        await tokenManagmentContract.updateFungibleTokenCustomFeesPublic(
          tokenWithFees,
          [],
          updatedFractionalFee
        );
      const updateFeeResponseCode = (await updateFeeTx.wait()).logs.filter(
        (e) => e.fragment.name === Constants.Events.ResponseCode
      )[0].args.responseCode;
      const tokenInfoTx =
        await tokenQueryContract.getTokenInfoPublic(tokenWithFees);
      const tokenInfoResponse = (await tokenInfoTx.wait()).logs.filter(
        (e) => e.fragment.name === Constants.Events.TokenInfo
      )[0].args.tokenInfo;

      // fractional fee is at position 7 in the tokenInfo array
      expect(tokenInfoResponse[6].length).to.be.greaterThan(0);
      expect(tokenInfoResponse[6][0][0]).to.equal(BigInt(35));
      expect(tokenInfoResponse[6][0][2]).to.equal(BigInt(100));
      expect(updateFeeResponseCode).to.equal(TX_SUCCESS_CODE);

      const feeCollectorBalanceBeforeTransfer = await utils.getTokenBalance(
        signers[0].address,
        tokenWithFees
      );
      const senderBalanceBeforeTransfer = await utils.getTokenBalance(
        signers[1].address,
        tokenWithFees
      );
      const feeToBeCharged = Math.floor(
        (400 * updatedFractionalFeeNumerator) / fractionalFeeDenominator
      );
      const transferTx1 = await tokenTransferContract.transferTokensPublic(
        tokenWithFees,
        [signers[1].address, signers[2].address],
        [-400, 400],
        Constants.GAS_LIMIT_1_000_000
      );
      await transferTx1.wait();

      //ensure the fee has been updated and collected
      expect(
        await utils.getTokenBalance(signers[0].address, tokenWithFees)
      ).to.be.equal(feeCollectorBalanceBeforeTransfer + feeToBeCharged);
      expect(
        await utils.getTokenBalance(signers[1].address, tokenWithFees)
      ).to.be.equal(senderBalanceBeforeTransfer - 400);
      expect(
        await utils.getTokenBalance(signers[2].address, tokenWithFees)
      ).to.be.equal(400 - feeToBeCharged);
    });

    it('should be able to update fractional fee with net of transfer true in HTS token', async function () {
      const fractionalFeeNumerator = 30;
      const fractionalFeeDenominator = 100;
      const feeToken2 = await utils.createFungibleTokenWithPresetKeysPublic(
        tokenCreateCustomContract,
        'FeeToken2',
        'FT2',
        'FeeToken2',
        initialSupply,
        maxSupply,
        decimals,
        false,
        signers[3].address
      );
      await utils.associateToken(
        tokenCreateCustomContract,
        feeToken2,
        Constants.Contract.TokenCreateContract
      );

      const fractionalFee = {
        numerator: fractionalFeeNumerator,
        denominator: fractionalFeeDenominator,
        minimumAmount: 0,
        maximumAmount: 0,
        netOfTransfers: false,
        feeCollector: signers[0].address,
      };
      const fixedFee2 = {
        amount: tokenFeeAmount + 50,
        tokenId: feeToken2,
        useHbarsForPayment: false,
        useCurrentTokenForPayment: false,
        feeCollector: signers[0].address,
      };
      const tokenWithFees =
        await utils.createFungibleTokenWithCustomFeesAndKeys(
          tokenCreateCustomContract,
          signers[0].address,
          [fixedFee2],
          [fractionalFee],
          keys
        );

      await utils.updateTokenKeysViaHapi(tokenWithFees, [
        tokenManagementContractAddress,
        tokenTransferContractAddress,
        tokenCreateContractAddress,
        tokenCreateCustomContractAddress,
      ]);

      const updatedFractionalFeeNumerator = fractionalFeeNumerator + 5;
      const updatedFractionalFee = [
        {
          numerator: updatedFractionalFeeNumerator,
          denominator: fractionalFeeDenominator,
          minimumAmount: 100,
          maximumAmount: 1000,
          netOfTransfers: true,
          feeCollector: signers[0].address,
        },
      ];

      // make a transfer and ensure that the fee is collected
      //apparently first you need to associate and then gran token kyc

      await utils.associateAndGrantKyc(tokenCreateContract, tokenWithFees, [
        signers[1].address,
        signers[2].address,
      ]);

      const transferTx = await tokenTransferContract.transferTokensPublic(
        tokenWithFees,
        [signers[0].address, signers[1].address],
        [-1000, 1000]
      );
      await transferTx.wait();

      const updateFeeTx =
        await tokenManagmentContract.updateFungibleTokenCustomFeesPublic(
          tokenWithFees,
          [],
          updatedFractionalFee
        );
      const updateFeeResponseCode = (await updateFeeTx.wait()).logs.filter(
        (e) => e.fragment.name === Constants.Events.ResponseCode
      )[0].args.responseCode;
      const tokenInfoTx =
        await tokenQueryContract.getTokenInfoPublic(tokenWithFees);
      const tokenInfoResponse = (await tokenInfoTx.wait()).logs.filter(
        (e) => e.fragment.name === Constants.Events.TokenInfo
      )[0].args.tokenInfo;

      // fractional fee is at position 7 in the tokenInfo array
      expect(tokenInfoResponse[6].length).to.be.greaterThan(0);
      expect(tokenInfoResponse[6][0][0]).to.equal(BigInt(35));
      expect(tokenInfoResponse[6][0][2]).to.equal(BigInt(100));
      expect(updateFeeResponseCode).to.equal(TX_SUCCESS_CODE);

      const feeCollectorBalanceBeforeTransfer = await utils.getTokenBalance(
        signers[0].address,
        tokenWithFees
      );
      const senderBalanceBeforeTransfer = await utils.getTokenBalance(
        signers[1].address,
        tokenWithFees
      );
      const feeToBeCharged = Math.floor(
        (400 * updatedFractionalFeeNumerator) / fractionalFeeDenominator
      );
      const transferTx1 = await tokenTransferContract.transferTokensPublic(
        tokenWithFees,
        [signers[1].address, signers[2].address],
        [-400, 400],
        Constants.GAS_LIMIT_1_000_000
      );
      await transferTx1.wait();

      //ensure the fee has been updated and collected
      expect(
        await utils.getTokenBalance(signers[0].address, tokenWithFees)
      ).to.be.equal(feeCollectorBalanceBeforeTransfer + feeToBeCharged);
      expect(
        await utils.getTokenBalance(signers[1].address, tokenWithFees)
      ).to.be.equal(senderBalanceBeforeTransfer - 400 - feeToBeCharged);
      expect(
        await utils.getTokenBalance(signers[2].address, tokenWithFees)
      ).to.be.equal(400);
    });

    it('should be able to update multiple fractional fees in HTS token', async function () {
      const fractionalFeeNumerator = 30;
      const fractionalFeeDenominator = 100;
      const fractionalFeeNumerator2 = 10;
      console.log('Creating token');
      const feeToken2 = await utils.createFungibleTokenWithPresetKeysPublic(
        tokenCreateCustomContract,
        'FeeToken2',
        'FT2',
        'FeeToken2',
        initialSupply,
        maxSupply,
        decimals,
        false,
        signers[3].address
      );
      await utils.associateToken(
        tokenCreateCustomContract,
        feeToken2,
        Constants.Contract.TokenCreateCustomContract
      );

      const fixedFeeAmount = tokenFeeAmount + 50;
      const fractionalFee = {
        numerator: fractionalFeeNumerator,
        denominator: fractionalFeeDenominator,
        minimumAmount: 0,
        maximumAmount: 0,
        netOfTransfers: false,
        feeCollector: signers[0].address,
      };
      const fractionalFee2 = {
        numerator: fractionalFeeNumerator2,
        denominator: fractionalFeeDenominator,
        minimumAmount: 0,
        maximumAmount: 0,
        netOfTransfers: false,
        feeCollector: signers[0].address,
      };
      const fixedFee2 = {
        amount: fixedFeeAmount,
        tokenId: feeToken2,
        useHbarsForPayment: false,
        useCurrentTokenForPayment: false,
        feeCollector: signers[0].address,
      };
      const tokenWithFees =
        await utils.createFungibleTokenWithCustomFeesAndKeys(
          tokenCreateCustomContract,
          signers[0].address,
          [fixedFee2],
          [fractionalFee, fractionalFee2],
          keys
        );

      await utils.updateTokenKeysViaHapi(tokenWithFees, [
        tokenManagementContractAddress,
        tokenTransferContractAddress,
        tokenCreateContractAddress,
        tokenCreateCustomContractAddress,
      ]);

      const updatedFractionalFeeNumerator = fractionalFeeNumerator + 5;
      const updatedFractionalFeeNumerator2 = fractionalFeeNumerator2 - 5;
      const updatedFractionalFee = [
        {
          numerator: updatedFractionalFeeNumerator,
          denominator: fractionalFeeDenominator,
          minimumAmount: 100,
          maximumAmount: 1000,
          netOfTransfers: false,
          feeCollector: signers[0].address,
        },
        {
          numerator: updatedFractionalFeeNumerator2,
          denominator: fractionalFeeDenominator,
          minimumAmount: 1,
          maximumAmount: 1000,
          netOfTransfers: false,
          feeCollector: signers[0].address,
        },
      ];

      // make a transfer and ensure that the fee is collected
      //apparently first you need to associate and then gran token kyc
      await utils.associateAndGrantKyc(
        tokenCreateCustomContract,
        tokenWithFees,
        [signers[1].address, signers[2].address]
      );
      const transferTx = await tokenTransferContract.transferTokensPublic(
        tokenWithFees,
        [signers[0].address, signers[1].address],
        [-500, 500]
      );
      await transferTx.wait();

      const updateFeeTx =
        await tokenManagmentContract.updateFungibleTokenCustomFeesPublic(
          tokenWithFees,
          [],
          updatedFractionalFee
        );
      const updateFeeResponseCode = (await updateFeeTx.wait()).logs.filter(
        (e) => e.fragment.name === Constants.Events.ResponseCode
      )[0].args.responseCode;
      const tokenInfoTx =
        await tokenQueryContract.getTokenInfoPublic(tokenWithFees);
      const tokenInfoResponse = (await tokenInfoTx.wait()).logs.filter(
        (e) => e.fragment.name === Constants.Events.TokenInfo
      )[0].args.tokenInfo;

      // fractional fee is at position 7 in the tokenInfo array
      expect(tokenInfoResponse[6].length).to.be.greaterThan(0);
      expect(tokenInfoResponse[6][0][0]).to.equal(BigInt(35));
      expect(tokenInfoResponse[6][0][2]).to.equal(BigInt(100));
      expect(tokenInfoResponse[6][1][0]).to.equal(BigInt(5));
      expect(updateFeeResponseCode).to.equal(TX_SUCCESS_CODE);

      const feeCollectorBalanceBeforeTransfer = await utils.getTokenBalance(
        signers[0].address,
        tokenWithFees
      );
      const senderBalanceBeforeTransfer = await utils.getTokenBalance(
        signers[1].address,
        tokenWithFees
      );
      const feeToBeCharged = Math.floor(
        400 *
          ((updatedFractionalFeeNumerator + updatedFractionalFeeNumerator2) /
            fractionalFeeDenominator)
      );

      const transferTx1 = await tokenTransferContract.transferTokensPublic(
        tokenWithFees,
        [signers[1].address, signers[2].address],
        [-400, 400],
        Constants.GAS_LIMIT_1_000_000
      );
      await transferTx1.wait();

      const signer2BalanceAfterTransfer = await utils.getTokenBalance(
        signers[2].address,
        tokenWithFees
      );

      //ensure the fee has been updated and collected
      expect(
        await utils.getTokenBalance(signers[0].address, tokenWithFees)
      ).to.be.equal(feeCollectorBalanceBeforeTransfer + feeToBeCharged);
      expect(
        await utils.getTokenBalance(signers[1].address, tokenWithFees)
      ).to.be.equal(senderBalanceBeforeTransfer - 400);
      expect(signer2BalanceAfterTransfer).to.be.equal(400 - feeToBeCharged);
    });

    it('should be able to update royalty fee in HBARs for NFT', async function () {
      const fixedFees = [];
      const royaltyFees = [
        {
          numerator: 10,
          denominator: 100,
          amount: tenHbars,
          tokenId: ethers.ZeroAddress,
          useHbarsForPayment: true,
          feeCollector: signers[2].address,
        },
      ];
      const nft = await utils.createNonFungibleTokenWithCustomRoyaltyFeeAndKeys(
        tokenCreateCustomContract,
        signers[0].address,
        fixedFees,
        royaltyFees,
        keys
      );
      const nftTx = await utils.mintNFT(tokenCreateCustomContract, nft);

      await utils.associateAndGrantKyc(tokenCreateCustomContract, nft, [
        signers[1].address,
        signers[3].address,
      ]);

      const transferNft = await tokenTransferContract.transferNFTPublic(
        nft,
        signers[0].address,
        signers[1].address,
        nftTx
      );
      await transferNft.wait();

      await utils.updateTokenKeysViaHapi(nft, [
        tokenManagementContractAddress,
        tokenCreateCustomContractAddress,
      ]);
      const updatedRoyaltyFee = [
        {
          numerator: 10,
          denominator: 100,
          amount: twentyHbars,
          tokenId: ethers.ZeroAddress,
          useHbarsForPayment: true,
          feeCollector: signers[2].address,
        },
      ];
      const updateRoyaltyFeeTx =
        await tokenManagmentContract.updateNonFungibleTokenCustomFeesPublic(
          nft,
          [],
          updatedRoyaltyFee
        );
      await updateRoyaltyFeeTx.wait();

      const beforeNftTransferHbars2 = await utils.getHbarBalance(
        signers[2].address
      );
      const beforeNftTransferHbars3 = await utils.getHbarBalance(
        signers[3].address
      );

      const transferNftToSigner3 =
        await tokenTransferContract.transferNFTPublic(
          nft,
          signers[1].address,
          signers[3].address,
          nftTx
        );
      await transferNftToSigner3.wait();

      expect(await utils.getTokenBalance(signers[3].address, nft)).to.equal(1);
      expect(
        parseFloat(await utils.getHbarBalance(signers[2].address))
      ).to.equal(
        beforeNftTransferHbars2 +
          parseFloat(twentyHbars / utils.tinybarToHbarCoef)
      );
      expect(
        parseFloat(await utils.getHbarBalance(signers[3].address))
      ).to.equal(
        beforeNftTransferHbars3 -
          parseFloat(twentyHbars / utils.tinybarToHbarCoef)
      );
    });

    it('should be able to update multiple royalty fees in HBARs for NFT', async function () {
      const fixedFees = [];
      const royaltyFees = [
        {
          numerator: 10,
          denominator: 100,
          amount: tenHbars,
          tokenId: ethers.ZeroAddress,
          useHbarsForPayment: true,
          feeCollector: signers[2].address,
        },
      ];
      const nft = await utils.createNonFungibleTokenWithCustomRoyaltyFeeAndKeys(
        tokenCreateCustomContract,
        signers[0].address,
        fixedFees,
        royaltyFees,
        keys
      );
      const nftTx = await utils.mintNFT(tokenCreateCustomContract, nft);

      await utils.associateAndGrantKyc(tokenCreateCustomContract, nft, [
        signers[1].address,
        signers[3].address,
      ]);

      const transferNft = await tokenTransferContract.transferNFTPublic(
        nft,
        signers[0].address,
        signers[1].address,
        nftTx
      );
      await transferNft.wait();

      await utils.updateTokenKeysViaHapi(nft, [
        tokenManagementContractAddress,
        tokenCreateCustomContractAddress,
      ]);
      const updatedRoyaltyFee = [
        {
          numerator: 10,
          denominator: 100,
          amount: twentyHbars,
          tokenId: ethers.ZeroAddress,
          useHbarsForPayment: true,
          feeCollector: signers[2].address,
        },
        {
          numerator: 10,
          denominator: 100,
          amount: tenHbars,
          tokenId: ethers.ZeroAddress,
          useHbarsForPayment: true,
          feeCollector: signers[2].address,
        },
      ];
      const updateRoyaltyFeeTx =
        await tokenManagmentContract.updateNonFungibleTokenCustomFeesPublic(
          nft,
          [],
          updatedRoyaltyFee
        );
      await updateRoyaltyFeeTx.wait();

      const beforeNftTransferHbars2 = await utils.getHbarBalance(
        signers[2].address
      );
      const beforeNftTransferHbars3 = await utils.getHbarBalance(
        signers[3].address
      );

      const transferNftToSigner3 =
        await tokenTransferContract.transferNFTPublic(
          nft,
          signers[1].address,
          signers[3].address,
          nftTx
        );
      await transferNftToSigner3.wait();

      expect(await utils.getTokenBalance(signers[3].address, nft)).to.equal(1);
      expect(
        parseFloat(await utils.getHbarBalance(signers[2].address))
      ).to.equal(
        beforeNftTransferHbars2 +
          parseFloat((twentyHbars + tenHbars) / utils.tinybarToHbarCoef)
      );
      expect(
        parseFloat(await utils.getHbarBalance(signers[3].address))
      ).to.equal(
        beforeNftTransferHbars3 -
          parseFloat((twentyHbars + tenHbars) / utils.tinybarToHbarCoef)
      );
    });

    it('should be able to update fixed fee in HBARs for NFT', async function () {
      const fixedFees = [
        {
          amount: tenHbars,
          tokenId: ethers.ZeroAddress,
          useHbarsForPayment: true,
          useCurrentTokenForPayment: false,
          feeCollector: signers[2].address,
        },
      ];
      const royaltyFees = [];
      const nft = await utils.createNonFungibleTokenWithCustomRoyaltyFeeAndKeys(
        tokenCreateCustomContract,
        signers[0].address,
        fixedFees,
        royaltyFees,
        keys
      );
      const nftTx = await utils.mintNFT(tokenCreateCustomContract, nft);

      await utils.associateAndGrantKyc(tokenCreateCustomContract, nft, [
        signers[1].address,
        signers[3].address,
      ]);

      const transferNft = await tokenTransferContract.transferNFTPublic(
        nft,
        signers[0].address,
        signers[1].address,
        nftTx
      );
      await transferNft.wait();

      await utils.updateTokenKeysViaHapi(nft, [
        tokenManagementContractAddress,
        tokenCreateCustomContractAddress,
      ]);
      const updatedfixedFees = [
        {
          amount: twentyHbars,
          tokenId: ethers.ZeroAddress,
          useHbarsForPayment: true,
          useCurrentTokenForPayment: false,
          feeCollector: signers[2].address,
        },
      ];
      const updateRoyaltyFeeTx =
        await tokenManagmentContract.updateNonFungibleTokenCustomFeesPublic(
          nft,
          updatedfixedFees,
          []
        );
      await updateRoyaltyFeeTx.wait();

      const beforeNftTransferHbars2 = await utils.getHbarBalance(
        signers[2].address
      );
      const beforeNftTransferHbars1 = await utils.getHbarBalance(
        signers[1].address
      );

      const transferNftToSigner3 =
        await tokenTransferContract.transferNFTPublic(
          nft,
          signers[1].address,
          signers[3].address,
          nftTx
        );
      await transferNftToSigner3.wait();

      expect(await utils.getTokenBalance(signers[3].address, nft)).to.equal(1);
      expect(
        parseFloat(await utils.getHbarBalance(signers[2].address))
      ).to.equal(
        beforeNftTransferHbars2 +
          parseFloat(twentyHbars / utils.tinybarToHbarCoef)
      );
      expect(
        parseFloat(await utils.getHbarBalance(signers[1].address))
      ).to.equal(
        beforeNftTransferHbars1 -
          parseFloat(twentyHbars / utils.tinybarToHbarCoef)
      );
    });

    it.skip('should be able to update fixed HTS fee for NFT', async function () {
      await utils.associateToken(
        tokenCreateCustomContract,
        feeToken,
        Constants.Contract.TokenCreateCustomContract
      );
      //we need to grant kyc and associate token with the fee collector, which is signer[0]
      const grantKycFeeCollectorFeeToken =
        await tokenCreateCustomContract.grantTokenKycPublic(
          feeToken,
          signers[0].address
        );
      await grantKycFeeCollectorFeeToken.wait();

      const fixedFees = [
        {
          amount: tokenFeeAmount,
          tokenId: feeToken,
          useHbarsForPayment: false,
          useCurrentTokenForPayment: false,
          feeCollector: signers[0].address,
        },
      ];
      const royaltyFees = [];
      const nft = await utils.createNonFungibleTokenWithCustomRoyaltyFeeAndKeys(
        tokenCreateCustomContract,
        signers[0].address,
        fixedFees,
        royaltyFees,
        keys
      );
      const nftTx = await utils.mintNFT(tokenCreateCustomContract, nft);

      await utils.associateAndGrantKyc(tokenCreateCustomContract, nft, [
        signers[1].address,
        signers[3].address,
      ]);
      const transferNft = await tokenTransferContract.transferNFTPublic(
        nft,
        signers[0].address,
        signers[1].address,
        nftTx
      );
      await transferNft.wait();

      await utils.updateTokenKeysViaHapi(nft, [
        tokenManagementContractAddress,
        tokenCreateCustomContractAddress,
      ]);
      const updatedfixedFees = [
        {
          amount: tokenFeeAmount + 13,
          tokenId: feeToken,
          useHbarsForPayment: false,
          useCurrentTokenForPayment: false,
          feeCollector: signers[0].address,
        },
      ];

      const updateRoyaltyFeeTx =
        await tokenManagmentContract.updateNonFungibleTokenCustomFeesPublic(
          nft,
          updatedfixedFees,
          []
        );
      await updateRoyaltyFeeTx.wait();

      const beforeNftTransferHbars2 = await utils.getHbarBalance(
        signers[2].address
      );
      const beforeNftTransferHbars1 = await utils.getHbarBalance(
        signers[1].address
      );

      // need to grant kyc from the account which is the kyc key a.k.a tokenCreateCustomContract
      //should work witho another contract if token keys are updated
      const grantKycSigner1FeeToken =
        await tokenCreateCustomContract.grantTokenKycPublic(
          feeToken,
          signers[1].address
        );
      const grantKycSigner1FeeTokenReceipt =
        await grantKycSigner1FeeToken.wait();

      // ---------- send fee token to signer 1 ------------

      //prerequisite: signer 1 has to be associated
      // approve the tokenTransfer to spend feeTokens
      const approveTx = await tokenCreateCustomContract.approvePublic(
        feeToken,
        tokenTransferContract,
        1000,
        Constants.GAS_LIMIT_1_000_000
      );
      await approveTx.wait();
      const transferFeeToken = await tokenTransferContract.transferTokensPublic(
        feeToken,
        [tokenCreateCustomContractAddress, signers[1].address],
        [-500, 500]
      );
      await transferFeeToken.wait();

      const balanceBeforeFeeCollector = await utils.getTokenBalance(
        signers[0].address,
        feeToken
      );
      const balanceBeforeSigner1 = await utils.getTokenBalance(
        signers[1].address,
        feeToken
      );
      const transferNftToSigner3 =
        await tokenTransferContract.transferNFTPublic(
          nft,
          signers[1].address,
          signers[3].address,
          nftTx
        );
      await transferNftToSigner3.wait();

      expect(
        await utils.getTokenBalance(signers[1].address, feeToken)
      ).to.equal(balanceBeforeSigner1 - (tokenFeeAmount + 13));
      expect(
        await utils.getTokenBalance(signers[0].address, feeToken)
      ).to.equal(balanceBeforeFeeCollector + (tokenFeeAmount + 13));
      expect(await utils.getTokenBalance(signers[3].address, nft)).to.equal(1);
    });

    it.skip('should be able to update fixed HTS fee and royalty fee in NFT', async function () {
      await utils.associateToken(
        tokenCreateCustomContract,
        feeToken,
        Constants.Contract.TokenCreateContract
      );
      //we need to grant kyc and associate token with the fee collector, which is signer[0]
      const grantKycFeeCollectorFeeToken =
        await tokenCreateCustomContract.grantTokenKycPublic(
          feeToken,
          signers[0].address
        );
      await grantKycFeeCollectorFeeToken.wait();

      const fixedFees = [
        {
          amount: tokenFeeAmount,
          tokenId: feeToken,
          useHbarsForPayment: false,
          useCurrentTokenForPayment: false,
          feeCollector: signers[0].address,
        },
      ];
      const royaltyFees = [
        {
          numerator: 10,
          denominator: 100,
          amount: tenHbars,
          tokenId: ethers.ZeroAddress,
          useHbarsForPayment: true,
          feeCollector: signers[2].address,
        },
      ];
      const nft = await utils.createNonFungibleTokenWithCustomRoyaltyFeeAndKeys(
        tokenCreateCustomContract,
        signers[0].address,
        fixedFees,
        royaltyFees,
        keys
      );
      const nftTx = await utils.mintNFT(tokenCreateCustomContract, nft);

      await utils.associateAndGrantKyc(tokenCreateCustomContract, nft, [
        signers[1].address,
        signers[3].address,
      ]);
      const transferNft = await tokenTransferContract.transferNFTPublic(
        nft,
        signers[0].address,
        signers[1].address,
        nftTx
      );
      await transferNft.wait();

      await utils.updateTokenKeysViaHapi(nft, [
        tokenManagementContractAddress,
        tokenCreateCustomContractAddress,
      ]);
      const updatedfixedFees = [
        {
          amount: tokenFeeAmount + 13,
          tokenId: feeToken,
          useHbarsForPayment: false,
          useCurrentTokenForPayment: false,
          feeCollector: signers[0].address,
        },
      ];
      const updatedRoyaltyFee = [
        {
          numerator: 10,
          denominator: 100,
          amount: twentyHbars,
          tokenId: ethers.ZeroAddress,
          useHbarsForPayment: true,
          feeCollector: signers[2].address,
        },
      ];

      const updateRoyaltyFeeTx =
        await tokenManagmentContract.updateNonFungibleTokenCustomFeesPublic(
          nft,
          updatedfixedFees,
          updatedRoyaltyFee
        );
      await updateRoyaltyFeeTx.wait();

      const updateFeeResponseCode = (
        await updateRoyaltyFeeTx.wait()
      ).logs.filter((e) => e.fragment.name === Constants.Events.ResponseCode)[0]
        .args.responseCode;
      const tokenInfoTx =
        await tokenQueryContract.getNonFungibleTokenInfoPublic(nft, nftTx);
      const tokenInfoResponse = (await tokenInfoTx.wait()).logs.filter(
        (e) => e.fragment.name === Constants.Events.NonFungibleTokenInfo
      )[0].args.tokenInfo;

      // fractional fee is at position 7 in the tokenInfo array
      expect(tokenInfoResponse[0][5].length).to.be.greaterThan(0);
      expect(tokenInfoResponse[0][7].length).to.be.greaterThan(0);
      expect(tokenInfoResponse[0][5][0][0]).to.equal(63);
      expect(tokenInfoResponse[0][5][0][1]).to.equal(feeToken);
      expect(tokenInfoResponse[0][7][0][2]).to.equal(twentyHbars);
      expect(tokenInfoResponse[0][7][0][4]).to.equal(true);
      expect(updateFeeResponseCode).to.equal(TX_SUCCESS_CODE);

      // need to grant kyc from the account which is the kyc key a.k.a tokenCreateCustomContract
      //should work witho another contract if token keys are updated
      const grantKycSigner1FeeToken =
        await tokenCreateCustomContract.grantTokenKycPublic(
          feeToken,
          signers[1].address
        );
      const grantKycSigner1FeeTokenReceipt =
        await grantKycSigner1FeeToken.wait();

      // ---------- send fee token to signer 1 ------------

      //prerequisite: signer 1 has to be associated
      // approve the tokenTransfer to spend feeTokens
      const approveTx = await tokenCreateCustomContract.approvePublic(
        feeToken,
        tokenTransferContract,
        1000,
        Constants.GAS_LIMIT_1_000_000
      );
      await approveTx.wait();

      const transferFeeToken = await tokenTransferContract.transferTokensPublic(
        feeToken,
        [tokenCreateCustomContractAddress, signers[1].address],
        [-500, 500]
      );
      await transferFeeToken.wait();

      const balanceBeforeFeeCollector = await utils.getTokenBalance(
        signers[0].address,
        feeToken
      );
      const balanceBeforeSigner1 = await utils.getTokenBalance(
        signers[1].address,
        feeToken
      );
      const beforeNftTransferHbars2 = await utils.getHbarBalance(
        signers[2].address
      );
      const beforeNftTransferHbars3 = await utils.getHbarBalance(
        signers[3].address
      );
      const transferNftToSigner3 =
        await tokenTransferContract.transferNFTPublic(
          nft,
          signers[1].address,
          signers[3].address,
          nftTx
        );
      await transferNftToSigner3.wait();

      expect(
        await utils.getTokenBalance(signers[1].address, feeToken)
      ).to.equal(balanceBeforeSigner1 - (tokenFeeAmount + 13));
      expect(
        await utils.getTokenBalance(signers[0].address, feeToken)
      ).to.equal(balanceBeforeFeeCollector + (tokenFeeAmount + 13));
      expect(await utils.getTokenBalance(signers[3].address, nft)).to.equal(1);
      expect(
        parseFloat(await utils.getHbarBalance(signers[2].address))
      ).to.equal(
        beforeNftTransferHbars2 +
          parseFloat(twentyHbars / utils.tinybarToHbarCoef)
      );
      expect(
        parseFloat(await utils.getHbarBalance(signers[3].address))
      ).to.equal(
        beforeNftTransferHbars3 -
          parseFloat(twentyHbars / utils.tinybarToHbarCoef)
      );
    });

    describe.skip('Update fees negative cases', async function () {
      it('should fail when updating fungible token non-existing fixed fee', async function () {
        let transactionHash;
        tokenWithFees = await utils.createFungibleTokenWithCustomFeesAndKeys(
          tokenCreateCustomContract,
          signers[0].address,
          [],
          [],
          keys
        );
        await utils.updateTokenKeysViaHapi(tokenWithFees, [
          tokenManagementContractAddress,
          tokenTransferContractAddress,
          tokenCreateContractAddress,
          tokenCreateCustomContractAddress,
        ]);

        const updateFeeTx =
          await tokenManagmentContract.updateFungibleTokenCustomFeesPublic(
            tokenWithFees,
            [],
            []
          );
        try {
          await updateFeeTx.wait();
        } catch (error) {
          transactionHash = error.receipt.hash;
        }

        const revertReason =
          await utils.getRevertReasonFromReceipt(transactionHash);
        const decodeRevertReason = utils.decodeErrorMessage(revertReason);
        expect(decodeRevertReason).to.equal(
          CUSTOM_SCHEDULE_ALREADY_HAS_NO_FEES
        );
      });

      it('should fail when updating non fungible token non-existing fixed fee', async function () {
        let transactionHash;
        const nft =
          await utils.createNonFungibleTokenWithCustomRoyaltyFeeAndKeys(
            tokenCreateCustomContract,
            signers[0].address,
            [],
            [],
            keys
          );
        await utils.updateTokenKeysViaHapi(nft, [
          tokenManagementContractAddress,
          tokenTransferContractAddress,
          tokenCreateContractAddress,
          tokenCreateCustomContractAddress,
        ]);

        const updateFeeTx =
          await tokenManagmentContract.updateNonFungibleTokenCustomFeesPublic(
            nft,
            [],
            []
          );
        try {
          await updateFeeTx.wait();
        } catch (error) {
          transactionHash = error.receipt.hash;
        }

        const revertReason =
          await utils.getRevertReasonFromReceipt(transactionHash);
        const decodeRevertReason = utils.decodeErrorMessage(revertReason);
        expect(decodeRevertReason).to.equal(
          CUSTOM_SCHEDULE_ALREADY_HAS_NO_FEES
        );
      });

      it('should fail when trying to update fees of fungible token with no fee schedule key', async function () {
        let transactionHash;
        const keysWithoutFeeSchedule = keys.slice();
        keysWithoutFeeSchedule.splice(5, 1);
        tokenWithFees = await utils.createFungibleTokenWithCustomFeesAndKeys(
          tokenCreateCustomContract,
          signers[0].address,
          [],
          [],
          keysWithoutFeeSchedule
        );

        await utils.updateTokenKeysViaHapi(
          tokenWithFees,
          [
            tokenManagementContractAddress,
            tokenTransferContractAddress,
            tokenCreateContractAddress,
            tokenCreateCustomContractAddress,
          ],
          (setFeeScheduleKey = false)
        );

        const updateFeeTx =
          await tokenManagmentContract.updateFungibleTokenCustomFeesPublic(
            tokenWithFees,
            [],
            []
          );
        try {
          await updateFeeTx.wait();
        } catch (error) {
          transactionHash = error.receipt.hash;
        }

        const revertReason =
          await utils.getRevertReasonFromReceipt(transactionHash);
        const decodeRevertReason = utils.decodeErrorMessage(revertReason);
        expect(decodeRevertReason).to.equal(TOKEN_HAS_NO_FEE_SCHEDULE_KEY);
      });

      it('should fail when trying to update fees of non fungible token with no fee schedule key', async function () {
        let transactionHash;
        const keysWithoutFeeSchedule = keys.slice();
        keysWithoutFeeSchedule.splice(5, 1);
        const nft =
          await utils.createNonFungibleTokenWithCustomRoyaltyFeeAndKeys(
            tokenCreateCustomContract,
            signers[0].address,
            [],
            [],
            keysWithoutFeeSchedule
          );
        await utils.updateTokenKeysViaHapi(nft, [
          tokenManagementContractAddress,
          tokenTransferContractAddress,
          tokenCreateContractAddress,
          tokenCreateCustomContractAddress,
        ]);

        const updateFeeTx =
          await tokenManagmentContract.updateNonFungibleTokenCustomFeesPublic(
            nft,
            [],
            []
          );
        try {
          await updateFeeTx.wait();
        } catch (error) {
          transactionHash = error.receipt.hash;
        }

        const revertReason =
          await utils.getRevertReasonFromReceipt(transactionHash);
        const decodeRevertReason = utils.decodeErrorMessage(revertReason);
        expect(decodeRevertReason).to.equal(TOKEN_HAS_NO_FEE_SCHEDULE_KEY);
      });

      it('should fail when fee has negative values', async function () {
        const negativeHbars = -10 * utils.tinybarToHbarCoef;
        const fixedFee = {
          amount: tenHbars,
          tokenId: ethers.ZeroAddress,
          useHbarsForPayment: false,
          useCurrentTokenForPayment: true,
          feeCollector: signers[0].address,
        };
        tokenWithFees = await utils.createFungibleTokenWithCustomFeesAndKeys(
          tokenCreateCustomContract,
          signers[0].address,
          [fixedFee],
          [],
          keys
        );
        await utils.updateTokenKeysViaHapi(tokenWithFees, [
          tokenManagementContractAddress,
        ]);
        let transactionHash;
        const updatedFixedFee = {
          amount: negativeHbars,
          tokenId: ethers.ZeroAddress,
          useHbarsForPayment: true,
          useCurrentTokenForPayment: false,
          feeCollector: signers[0].address,
        };
        const updateFeeTx =
          await tokenManagmentContract.updateFungibleTokenCustomFeesPublic(
            tokenWithFees,
            [updatedFixedFee],
            []
          );
        try {
          await updateFeeTx.wait();
        } catch (error) {
          transactionHash = error.receipt.hash;
        }

        const revertReason =
          await utils.getRevertReasonFromReceipt(transactionHash);
        const decodeRevertReason = utils.decodeErrorMessage(revertReason);
        expect(decodeRevertReason).to.equal(CUSTOM_FEE_MUST_BE_POSITIVE);
      });

      it('should fail when fee has negative values for non fungible token', async function () {
        let transactionHash;
        const negativeHbars = -10 * utils.tinybarToHbarCoef;
        const fixedFee = {
          amount: tenHbars,
          tokenId: ethers.ZeroAddress,
          useHbarsForPayment: true,
          useCurrentTokenForPayment: false,
          feeCollector: signers[0].address,
        };
        const nft =
          await utils.createNonFungibleTokenWithCustomRoyaltyFeeAndKeys(
            tokenCreateCustomContract,
            signers[0].address,
            [fixedFee],
            [],
            keys
          );
        await utils.updateTokenKeysViaHapi(nft, [
          tokenManagementContractAddress,
        ]);

        const updatedFixedFee = {
          amount: negativeHbars,
          tokenId: ethers.ZeroAddress,
          useHbarsForPayment: true,
          useCurrentTokenForPayment: false,
          feeCollector: signers[0].address,
        };
        const updateFeeTx =
          await tokenManagmentContract.updateNonFungibleTokenCustomFeesPublic(
            nft,
            [updatedFixedFee],
            []
          );
        try {
          await updateFeeTx.wait();
        } catch (error) {
          transactionHash = error.receipt.hash;
        }

        const revertReason =
          await utils.getRevertReasonFromReceipt(transactionHash);
        const decodeRevertReason = utils.decodeErrorMessage(revertReason);
        expect(decodeRevertReason).to.equal(CUSTOM_FEE_MUST_BE_POSITIVE);
      });

      it('should fail when fractional fee has denominator zero', async function () {
        let transactionHash;
        const fractionalFee = {
          numerator: 10,
          denominator: 100,
          minimumAmount: 0,
          maximumAmount: 0,
          netOfTransfers: false,
          feeCollector: signers[0].address,
        };
        tokenWithFees = await utils.createFungibleTokenWithCustomFeesAndKeys(
          tokenCreateCustomContract,
          signers[0].address,
          [],
          [fractionalFee],
          keys
        );
        await utils.updateTokenKeysViaHapi(tokenWithFees, [
          tokenManagementContractAddress,
        ]);
        const updatedFractionalFee = {
          numerator: 10,
          denominator: 0,
          minimumAmount: 0,
          maximumAmount: 0,
          netOfTransfers: false,
          feeCollector: signers[0].address,
        };

        const updateFeeTx =
          await tokenManagmentContract.updateFungibleTokenCustomFeesPublic(
            tokenWithFees,
            [],
            [updatedFractionalFee]
          );
        try {
          await updateFeeTx.wait();
        } catch (error) {
          transactionHash = error.receipt.hash;
        }
        const revertReason =
          await utils.getRevertReasonFromReceipt(transactionHash);
        const decodeRevertReason = utils.decodeErrorMessage(revertReason);
        expect(decodeRevertReason).to.equal(FRACTION_DIVIDES_BY_ZERO);
      });

      // Note: Tests below are skipped due to CUSTOM_FEES_LIST_TOO_LONG error introduced in network node v0.56.0
      // which enforces a maximum of 10 custom fees per token. This validation was previously done at the SDK level.
      // TODO: Re-enable tests once validation is properly handled - see https://github.com/hashgraph/hedera-services/issues/17533
      // and https://github.com/hashgraph/hedera-smart-contracts/issues/1207
      it.skip('should fail when updating fungible token fees to more than 10', async function () {
        let transactionHash;
        tokenWithFees = await utils.createFungibleTokenWithCustomFeesAndKeys(
          tokenCreateCustomContract,
          signers[0].address,
          [],
          [],
          keys
        );
        await utils.updateTokenKeysViaHapi(tokenWithFees, [
          tokenManagementContractAddress,
        ]);

        const fees = [];
        for (let i = 0; i < 11; i++) {
          fees.push({
            amount: tokenFeeAmount + i,
            tokenId: ethers.ZeroAddress,
            useHbarsForPayment: true,
            useCurrentTokenForPayment: false,
            feeCollector: signers[0].address,
          });
        }
        const updateFeeTx =
          await tokenManagmentContract.updateFungibleTokenCustomFeesPublic(
            tokenWithFees,
            fees,
            []
          );
        try {
          await updateFeeTx.wait();
        } catch (error) {
          transactionHash = error.receipt.hash;
        }

        const revertReason =
          await utils.getRevertReasonFromReceipt(transactionHash);
        const decodeRevertReason = utils.decodeErrorMessage(revertReason);
        expect(decodeRevertReason).to.equal(CUSTOM_FEES_LIST_TOO_LONG);
      });

      // Note: Tests below are skipped due to CUSTOM_FEES_LIST_TOO_LONG error introduced in network node v0.56.0
      // which enforces a maximum of 10 custom fees per token. This validation was previously done at the SDK level.
      // TODO: Re-enable tests once validation is properly handled - see https://github.com/hashgraph/hedera-services/issues/17533
      // and https://github.com/hashgraph/hedera-smart-contracts/issues/1207
      it.skip('should fail when updating NFT token fees to more than 10', async function () {
        const nft =
          await utils.createNonFungibleTokenWithCustomRoyaltyFeeAndKeys(
            tokenCreateCustomContract,
            signers[0].address,
            [],
            [],
            keys
          );
        await utils.updateTokenKeysViaHapi(nft, [
          tokenManagementContractAddress,
        ]);

        let transactionHash;
        const fees = [];
        for (let i = 0; i < 11; i++) {
          fees.push({
            amount: tokenFeeAmount + i,
            tokenId: ethers.ZeroAddress,
            useHbarsForPayment: true,
            useCurrentTokenForPayment: false,
            feeCollector: signers[0].address,
          });
        }
        const updateFeeTx =
          await tokenManagmentContract.updateNonFungibleTokenCustomFeesPublic(
            nft,
            fees,
            []
          );
        try {
          await updateFeeTx.wait();
        } catch (error) {
          transactionHash = error.receipt.hash;
        }

        const revertReason =
          await utils.getRevertReasonFromReceipt(transactionHash);
        const decodeRevertReason = utils.decodeErrorMessage(revertReason);
        expect(decodeRevertReason).to.equal(CUSTOM_FEES_LIST_TOO_LONG);
      });

      it('should fail when the provided fee collector is invalid', async function () {
        let transactionHash;
        tokenWithFees = await utils.createFungibleTokenWithCustomFeesAndKeys(
          tokenCreateCustomContract,
          signers[0].address,
          [],
          [],
          keys
        );
        await utils.updateTokenKeysViaHapi(tokenWithFees, [
          tokenManagementContractAddress,
        ]);
        const fixedFee = {
          amount: tenHbars,
          tokenId: ethers.ZeroAddress,
          useHbarsForPayment: true,
          useCurrentTokenForPayment: false,
          feeCollector: feeToken,
        };
        const updateFeeTx =
          await tokenManagmentContract.updateFungibleTokenCustomFeesPublic(
            tokenWithFees,
            [fixedFee],
            []
          );
        try {
          await updateFeeTx.wait();
        } catch (error) {
          transactionHash = error.receipt.hash;
        }

        const revertReason =
          await utils.getRevertReasonFromReceipt(transactionHash);
        const decodeRevertReason = utils.decodeErrorMessage(revertReason);
        expect(decodeRevertReason).to.equal(INVALID_CUSTOM_FEE_COLLECTOR);
      });

      it('should fail when the provided fee collector is invalid for NFT', async function () {
        let transactionHash;
        const nft =
          await utils.createNonFungibleTokenWithCustomRoyaltyFeeAndKeys(
            tokenCreateCustomContract,
            signers[0].address,
            [],
            [],
            keys
          );
        await utils.updateTokenKeysViaHapi(nft, [
          tokenManagementContractAddress,
        ]);
        const fixedFee = {
          amount: tenHbars,
          tokenId: ethers.ZeroAddress,
          useHbarsForPayment: true,
          useCurrentTokenForPayment: false,
          feeCollector: feeToken,
        };
        const updateFeeTx =
          await tokenManagmentContract.updateNonFungibleTokenCustomFeesPublic(
            nft,
            [fixedFee],
            []
          );
        try {
          await updateFeeTx.wait();
        } catch (error) {
          transactionHash = error.receipt.hash;
        }

        const revertReason =
          await utils.getRevertReasonFromReceipt(transactionHash);
        const decodeRevertReason = utils.decodeErrorMessage(revertReason);
        expect(decodeRevertReason).to.equal(INVALID_CUSTOM_FEE_COLLECTOR);
      });

      it('should fail when the provided token id is invalid', async function () {
        tokenWithFees = await utils.createFungibleTokenWithCustomFeesAndKeys(
          tokenCreateCustomContract,
          signers[0].address,
          [],
          [],
          keys
        );
        await utils.updateTokenKeysViaHapi(tokenWithFees, [
          tokenManagementContractAddress,
        ]);

        const fixedFee = {
          amount: 10,
          tokenId: signers[1].address,
          useHbarsForPayment: false,
          useCurrentTokenForPayment: false,
          feeCollector: signers[0].address,
        };
        const updateFeeTx =
          await tokenManagmentContract.updateFungibleTokenCustomFeesPublic(
            tokenWithFees,
            [fixedFee],
            []
          );
        try {
          await updateFeeTx.wait();
        } catch (error) {
          transactionHash = error.receipt.hash;
        }

        const revertReason =
          await utils.getRevertReasonFromReceipt(transactionHash);
        const decodeRevertReason = utils.decodeErrorMessage(revertReason);
        expect(decodeRevertReason).to.equal(INVALID_TOKEN_ID_IN_CUSTOM_FEES);
      });

      it('should fail when the provided token id is invalid for NFT', async function () {
        const nft =
          await utils.createNonFungibleTokenWithCustomRoyaltyFeeAndKeys(
            tokenCreateCustomContract,
            signers[0].address,
            [],
            [],
            keys
          );
        await utils.updateTokenKeysViaHapi(nft, [
          tokenManagementContractAddress,
        ]);
        const fixedFee = {
          amount: 10,
          tokenId: signers[1].address,
          useHbarsForPayment: false,
          useCurrentTokenForPayment: false,
          feeCollector: signers[0].address,
        };
        let transactionHash;
        const updateFeeTx =
          await tokenManagmentContract.updateNonFungibleTokenCustomFeesPublic(
            nft,
            [fixedFee],
            []
          );
        try {
          await updateFeeTx.wait();
        } catch (error) {
          transactionHash = error.receipt.hash;
        }

        const revertReason =
          await utils.getRevertReasonFromReceipt(transactionHash);
        const decodeRevertReason = utils.decodeErrorMessage(revertReason);
        expect(decodeRevertReason).to.equal(INVALID_TOKEN_ID_IN_CUSTOM_FEES);
      });

      it('should fail for updateFungibleTokenCustomFees when token is not associated to fee collector', async function () {
        //need to associate the fee collector account of the token that will have fees
        tokenWithFees = await utils.createFungibleTokenWithCustomFeesAndKeys(
          tokenCreateCustomContract,
          signers[0].address,
          [],
          [],
          keys
        );
        await utils.updateTokenKeysViaHapi(tokenWithFees, [
          tokenManagementContractAddress,
          tokenTransferContractAddress,
          tokenCreateContractAddress,
          tokenCreateCustomContractAddress,
        ]);

        // ------------------ Associate and grantKyc to accounts tranfering tokenWithFees ------------------
        //TODO: error handling
        await utils.associateAndGrantKyc(tokenCreateContract, tokenWithFees, [
          signers[1].address,
          signers[2].address,
        ]);
        await utils.associateAndGrantKyc(tokenCreateCustomContract, feeToken, [
          signers[1].address,
        ]);

        const grantKycTx = await tokenCreateCustomContract.grantTokenKycPublic(
          feeToken,
          tokenCreateCustomContractAddress
        );
        await grantKycTx.wait();

        const transferTx = await tokenTransferContract.transferTokensPublic(
          tokenWithFees,
          [signers[0].address, signers[1].address],
          [-500, 500]
        );
        await transferTx.wait();

        const approveTx = await tokenCreateCustomContract.approvePublic(
          feeToken,
          tokenTransferContract,
          1000,
          Constants.GAS_LIMIT_1_000_000
        );
        await approveTx.wait();

        const transferFeeTokenToSigner1 =
          await tokenTransferContract.transferTokensPublic(
            feeToken,
            [tokenCreateCustomContractAddress, signers[1].address],
            [-150, 150],
            Constants.GAS_LIMIT_1_000_000
          );
        await transferFeeTokenToSigner1.wait();

        const updatedTokenFeeAmount = tokenFeeAmount + 15;
        const updatedFixedFee = [
          {
            amount: updatedTokenFeeAmount,
            tokenId: feeToken,
            useHbarsForPayment: false,
            useCurrentTokenForPayment: false,
            feeCollector: signers[0].address,
          },
        ];

        const updateFeeTx =
          await tokenManagmentContract.updateFungibleTokenCustomFeesPublic(
            tokenWithFees,
            updatedFixedFee,
            []
          );
        let transactionHash;
        try {
          await updateFeeTx.wait();
        } catch (error) {
          transactionHash = error.receipt.hash;
        }
        const revertReason =
          await utils.getRevertReasonFromReceipt(transactionHash);
        const decodeRevertReason = utils.decodeErrorMessage(revertReason);
        expect(decodeRevertReason).to.equal(
          TOKEN_NOT_ASSOCIATED_TO_FEE_COLLECTOR
        );
      });

      it('should fail for updateNonFungibleTokenCustomFees when token is not associated to fee collector', async function () {
        //we need to grant kyc and associate token with the fee collector, which is signer[0]
        const nft =
          await utils.createNonFungibleTokenWithCustomRoyaltyFeeAndKeys(
            tokenCreateCustomContract,
            signers[0].address,
            [],
            [],
            keys
          );
        const nftTx = await utils.mintNFT(tokenCreateCustomContract, nft);

        await utils.associateAndGrantKyc(tokenCreateCustomContract, nft, [
          signers[1].address,
          signers[3].address,
        ]);
        const transferNft = await tokenTransferContract.transferNFTPublic(
          nft,
          signers[0].address,
          signers[1].address,
          nftTx
        );
        await transferNft.wait();

        await utils.updateTokenKeysViaHapi(nft, [
          tokenManagementContractAddress,
          tokenCreateCustomContractAddress,
        ]);
        const updatedfixedFees = [
          {
            amount: tokenFeeAmount + 13,
            tokenId: feeToken,
            useHbarsForPayment: false,
            useCurrentTokenForPayment: false,
            feeCollector: signers[0].address,
          },
        ];

        let transactionHash;
        const updateRoyaltyFeeTx =
          await tokenManagmentContract.updateNonFungibleTokenCustomFeesPublic(
            nft,
            updatedfixedFees,
            []
          );
        try {
          await updateRoyaltyFeeTx.wait();
        } catch (error) {
          transactionHash = error.receipt.hash;
        }

        const revertReason =
          await utils.getRevertReasonFromReceipt(transactionHash);
        const decodeRevertReason = utils.decodeErrorMessage(revertReason);
        expect(decodeRevertReason).to.equal(
          TOKEN_NOT_ASSOCIATED_TO_FEE_COLLECTOR
        );
      });
    });
  });
});
