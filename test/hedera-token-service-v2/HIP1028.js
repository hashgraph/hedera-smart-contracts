// SPDX-License-Identifier: Apache-2.0

const {expect} = require('chai');
const {ethers} = require('hardhat');
const utils = require('../hedera-token-service/utils');

describe('HIP1028 Test Suite', function () {
  let signers;
  let hip1028Contract;
  let tokenWithMetadataAndMetadataKeyAndCustomFeeAddress;
  let nftWithMetadataAndMetadataKeyAndCustomFeeAddress;

  const TWENTY_HBARS = '20000000000000000000';
  const META_TEXT = 'testmeta';
  const FIXED_FEE_AMOUNT = 10;

  before(async () => {
    signers = await ethers.getSigners();
    hip1028Contract = await (await ethers.getContractFactory('HIP1028Contract'))
        .deploy({gasLimit: 5_000_000});
    await hip1028Contract.waitForDeployment();
  });

  describe('create token', async () => {
    it('should verify createTokenWithMetadata creates a fungible token with metadata', async () => {
      const receipt = await (await hip1028Contract.createTokenWithMetadata(META_TEXT, {
        value: TWENTY_HBARS,
        gasLimit: 5_000_000
      })).wait();

      const info = await utils.getTokenInfoByMN(receipt.logs[0].args[0]);
      expect(ethers.toUtf8String((ethers.decodeBase64(info.metadata)))).to.equal(META_TEXT);
      expect(info.metadata_key).to.be.null;
      expect(info.custom_fees.fixed_fees).to.be.empty;
      expect(info.custom_fees.fractional_fees).to.be.empty;
    });

    it('should verify createTokenWithMetadataAndCustomFees creates a fungible token with metadata and custom fee', async () => {
      const receipt = await (await hip1028Contract.createTokenWithMetadataAndCustomFees(META_TEXT, {
        value: TWENTY_HBARS,
        gasLimit: 5_000_000
      })).wait();

      const info = await utils.getTokenInfoByMN(receipt.logs[0].args[0]);
      expect(ethers.toUtf8String((ethers.decodeBase64(info.metadata)))).to.equal(META_TEXT);
      expect(info.metadata_key).to.be.null;
      expect(info.custom_fees.fixed_fees).to.not.be.empty;
      expect(info.custom_fees.fixed_fees[0].amount).to.equal(FIXED_FEE_AMOUNT);
    });

    it('should verify createTokenWithMetadataAndKey creates a fungible token with metadata and metadata key', async () => {
      const receipt = await (await hip1028Contract.createTokenWithMetadataAndKey(META_TEXT, {
        value: TWENTY_HBARS,
        gasLimit: 5_000_000
      })).wait();

      const info = await utils.getTokenInfoByMN(receipt.logs[0].args[0]);
      expect(ethers.toUtf8String((ethers.decodeBase64(info.metadata)))).to.equal(META_TEXT);
      expect(info.metadata_key).to.not.be.null;
      expect(info.custom_fees.fixed_fees).to.be.empty;
      expect(info.custom_fees.fractional_fees).to.be.empty;
    });

    it('should verify createTokenWithMetadataAndKeyAndCustomFees creates a fungible token with metadata and metadata key and custom fee', async () => {
      const receipt = await (await hip1028Contract.createTokenWithMetadataAndKeyAndCustomFees(META_TEXT, {
        value: TWENTY_HBARS,
        gasLimit: 5_000_000
      })).wait();

      tokenWithMetadataAndMetadataKeyAndCustomFeeAddress = receipt.logs[0].args[0];
      const info = await utils.getTokenInfoByMN(tokenWithMetadataAndMetadataKeyAndCustomFeeAddress);
      expect(ethers.toUtf8String((ethers.decodeBase64(info.metadata)))).to.equal(META_TEXT);
      expect(info.metadata_key).to.not.be.null;
      expect(info.custom_fees.fixed_fees).to.not.be.empty;
      expect(info.custom_fees.fixed_fees[0].amount).to.equal(FIXED_FEE_AMOUNT);
    });

    it('should verify createNftWithMetadata creates a non-fungible token with metadata', async () => {
      const receipt = await (await hip1028Contract.createNftWithMetadata(META_TEXT, {
        value: TWENTY_HBARS,
        gasLimit: 5_000_000
      })).wait();

      const info = await utils.getTokenInfoByMN(receipt.logs[0].args[0]);
      expect(ethers.toUtf8String((ethers.decodeBase64(info.metadata)))).to.equal(META_TEXT);
      expect(info.metadata_key).to.be.null;
      expect(info.custom_fees.fixed_fees).to.be.empty;
      expect(info.custom_fees.royalty_fees).to.be.empty;
    });

    it('should verify createNftWithMetadataAndCustomFees creates a non-fungible token with metadata and custom fee', async () => {
      const receipt = await (await hip1028Contract.createNftWithMetadataAndCustomFees(META_TEXT, {
        value: TWENTY_HBARS,
        gasLimit: 5_000_000
      })).wait();

      const info = await utils.getTokenInfoByMN(receipt.logs[0].args[0]);
      expect(ethers.toUtf8String((ethers.decodeBase64(info.metadata)))).to.equal(META_TEXT);
      expect(info.metadata_key).to.be.null;
      expect(info.custom_fees.fixed_fees).to.not.be.empty;
      expect(info.custom_fees.fixed_fees[0].amount).to.equal(FIXED_FEE_AMOUNT);
    });

    it('should verify createNftWithMetaAndKey creates a non-fungible token with metadata and metadata key', async () => {
      const receipt = await (await hip1028Contract.createNftWithMetaAndKey(META_TEXT, {
        value: TWENTY_HBARS,
        gasLimit: 5_000_000
      })).wait();

      const info = await utils.getTokenInfoByMN(receipt.logs[0].args[0]);
      expect(ethers.toUtf8String((ethers.decodeBase64(info.metadata)))).to.equal(META_TEXT);
      expect(info.metadata_key).to.not.be.null;
      expect(info.custom_fees.fixed_fees).to.be.empty;
      expect(info.custom_fees.royalty_fees).to.be.empty;
    });

    it('should verify createNftWithMetaAndKeyAndCustomFees creates a fungible token with metadata and metadata key and custom fee', async () => {
      const receipt = await (await hip1028Contract.createNftWithMetaAndKeyAndCustomFees(META_TEXT, {
        value: TWENTY_HBARS,
        gasLimit: 5_000_000
      })).wait();

      nftWithMetadataAndMetadataKeyAndCustomFeeAddress = receipt.logs[0].args[0];
      const info = await utils.getTokenInfoByMN(nftWithMetadataAndMetadataKeyAndCustomFeeAddress);
      expect(ethers.toUtf8String((ethers.decodeBase64(info.metadata)))).to.equal(META_TEXT);
      expect(info.metadata_key).to.not.be.null;
      expect(info.custom_fees.fixed_fees).to.not.be.empty;
      expect(info.custom_fees.fixed_fees[0].amount).to.equal(FIXED_FEE_AMOUNT);
    });
  });

  describe('get token info', async () => {
    it('should verify getInformationForToken returns the correct metadata and metadata key and custom fee for a token', async () => {
      const infoReceipt = await (
          await hip1028Contract.getInformationForToken(tokenWithMetadataAndMetadataKeyAndCustomFeeAddress, {gasLimit: 5_000_000})
      ).wait();

      const info = infoReceipt.logs[0].args[0];
      // metadata
      expect(ethers.toUtf8String(info[0][9])).to.equal(META_TEXT);
      // metadata key
      expect(info[0][7][7][0]).to.equal(128);
      expect(info[0][7][7][1][2]).to.not.equal(ethers.ZeroAddress);
      // custom fee
      expect(info[5][0][0]).to.equal(FIXED_FEE_AMOUNT);
    });

    it('should verify getInformationForToken returns the correct metadata and metadata key and custom fee for an nft', async () => {
      const infoReceipt = await (
          await hip1028Contract.getInformationForToken(nftWithMetadataAndMetadataKeyAndCustomFeeAddress, {gasLimit: 5_000_000})
      ).wait();

      const info = infoReceipt.logs[0].args[0];
      // metadata
      expect(ethers.toUtf8String(info[0][9])).to.equal(META_TEXT);
      // metadata key
      expect(info[0][7][7][0]).to.equal(128);
      expect(info[0][7][7][1][2]).to.not.equal(ethers.ZeroAddress);
      // custom fee
      expect(info[5][0][0]).to.equal(FIXED_FEE_AMOUNT);
    });

    it('should verify getInformationForFungibleToken returns the correct metadata and metadata key and custom fee for a token', async () => {
      const infoReceipt = await (
          await hip1028Contract.getInformationForFungibleToken(tokenWithMetadataAndMetadataKeyAndCustomFeeAddress, {gasLimit: 5_000_000})
      ).wait();

      const info = infoReceipt.logs[0].args[0][0];
      // metadata
      expect(ethers.toUtf8String(info[0][9])).to.equal(META_TEXT);
      // metadata key
      expect(info[0][7][7][0]).to.equal(128);
      expect(info[0][7][7][1][2]).to.not.equal(ethers.ZeroAddress);
      // custom fee
      expect(info[5][0][0]).to.equal(FIXED_FEE_AMOUNT);
    });

    it('should verify getInformationForNonFungibleToken returns the correct metadata and metadata key and custom fee for an nft', async () => {
      const infoReceipt = await (
          await hip1028Contract.getInformationForNonFungibleToken(nftWithMetadataAndMetadataKeyAndCustomFeeAddress, 1, {gasLimit: 5_000_000})
      ).wait();

      const info = infoReceipt.logs[0].args[0][0];
      // metadata
      expect(ethers.toUtf8String(info[0][9])).to.equal(META_TEXT);
      // metadata key
      expect(info[0][7][7][0]).to.equal(128);
      expect(info[0][7][7][1][2]).to.not.equal(ethers.ZeroAddress);
      // custom fee
      expect(info[5][0][0]).to.equal(FIXED_FEE_AMOUNT);
    });
  });

  describe('update token info', async () => {
    const UPDATED_METADATA = '5644';

    it('should verify updateTokenMetadata updates the metadata value for a token', async () => {
      const infoBefore = await utils.getTokenInfoByMN(tokenWithMetadataAndMetadataKeyAndCustomFeeAddress);
      await (
          await hip1028Contract.updateTokenMetadata(tokenWithMetadataAndMetadataKeyAndCustomFeeAddress, UPDATED_METADATA, {gasLimit: 5_000_000})
      ).wait();

      const infoAfter = await utils.getTokenInfoByMN(tokenWithMetadataAndMetadataKeyAndCustomFeeAddress);
      expect(infoBefore.metadata).to.not.equal(infoAfter.metadata);
      expect(ethers.toUtf8String((ethers.decodeBase64(infoAfter.metadata)))).to.equal(UPDATED_METADATA);
    });

    it('should verify updateNFTsMetadata updates the metadata value for an nft', async () => {
      const infoBefore = await utils.getTokenInfoByMN(nftWithMetadataAndMetadataKeyAndCustomFeeAddress);
      await (
          await hip1028Contract.updateTokenMetadata(nftWithMetadataAndMetadataKeyAndCustomFeeAddress, UPDATED_METADATA, {gasLimit: 5_000_000})
      ).wait();

      const infoAfter = await utils.getTokenInfoByMN(nftWithMetadataAndMetadataKeyAndCustomFeeAddress);
      expect(infoBefore.metadata).to.not.equal(infoAfter.metadata);
      expect(ethers.toUtf8String((ethers.decodeBase64(infoAfter.metadata)))).to.equal(UPDATED_METADATA);
    });
  });

  describe('update token keys', async () => {
    it('should verify updateTokenKeys updates the metadata key value for a token', async () => {
      const infoBefore = await utils.getTokenInfoByMN(tokenWithMetadataAndMetadataKeyAndCustomFeeAddress);
      await (
          await hip1028Contract.updateTokenKeys(tokenWithMetadataAndMetadataKeyAndCustomFeeAddress, signers[1].address, {gasLimit: 5_000_000})
      ).wait();

      const infoAfter = await utils.getTokenInfoByMN(tokenWithMetadataAndMetadataKeyAndCustomFeeAddress);
      expect(infoBefore.metadata_key.key).to.not.equal(infoAfter.metadata_key.key);
    });

    it('should verify updateTokenKeys updates the metadata key value for an nft', async () => {
      const infoBefore = await utils.getTokenInfoByMN(nftWithMetadataAndMetadataKeyAndCustomFeeAddress);
      await (
          await hip1028Contract.updateTokenKeys(nftWithMetadataAndMetadataKeyAndCustomFeeAddress, signers[1].address, {gasLimit: 5_000_000})
      ).wait();

      const infoAfter = await utils.getTokenInfoByMN(nftWithMetadataAndMetadataKeyAndCustomFeeAddress);
      expect(infoBefore.metadata_key.key).to.not.equal(infoAfter.metadata_key.key);
    });
  });
});
