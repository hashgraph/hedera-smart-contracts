// SPDX-License-Identifier: Apache-2.0

const Constants = require('../../constants');
const { Contract } = require('ethers');
const { expect } = require('chai');
const hre = require('hardhat');
const { ethers } = hre;
const utils = require('../utils');

describe('@HRC-719 Test Suite', function () {
  let tokenCreateContract;
  let tokenAddress;
  let hrc719Contract;
  let signers;
  let hrcToken;
  let IHRC719;

  const parseCallResponseEventData = async (tx) => {
    return (await tx.wait()).logs.filter(
      (e) => e.fragment.name === Constants.Events.CallResponseEvent
    )[0].args;
  };

  const decodeHexToDec = (message) => {
    message = message.replace(/^0x/, '');
    return parseInt(message, 16);
  };

  before(async function () {
    signers = await ethers.getSigners();
    tokenCreateContract = await utils.deployTokenCreateContract();
    await utils.updateAccountKeysViaHapi([
      await tokenCreateContract.getAddress(),
    ]);

    hrc719Contract = await utils.deployHRC719Contract();

    IHRC719 = new ethers.Interface(
      (await hre.artifacts.readArtifact('IHRC719')).abi
    );
  });

  beforeEach(async () => {
    // create new tokenAddress for every unit test
    tokenAddress = await utils.createFungibleToken(
      tokenCreateContract,
      signers[0].address
    );
    await utils.updateTokenKeysViaHapi(tokenAddress, [
      await tokenCreateContract.getAddress(),
    ]);

    // create a contract object for the token
    hrcToken = new Contract(tokenAddress, IHRC719, signers[0]);
  });

  describe('HRC719 wrapper contract', () => {
    it('should be able to associate() to the token from a contract', async function () {
      const txAssociate = await hrc719Contract.associate(
        tokenAddress,
        Constants.GAS_LIMIT_1_000_000
      );
      const receiptAssociate = await txAssociate.wait();
      expect(receiptAssociate).to.exist;
      expect(receiptAssociate.status).to.eq(1);
    });

    it('should be able to disssociate() to the token from a contract', async function () {
      const txDissociate = await hrc719Contract.dissociate(
        tokenAddress,
        Constants.GAS_LIMIT_1_000_000
      );
      const receiptDissociate = await txDissociate.wait();
      expect(receiptDissociate).to.exist;
      expect(receiptDissociate.status).to.eq(1);
    });

    it('should be able to call isAssociated()', async function () {
      const txIsAssociate = await hrc719Contract
        .connect(signers[1])
        .isAssociated(tokenAddress, Constants.GAS_LIMIT_1_000_000);
      const receiptIsAssociate = await txIsAssociate.wait();
      const logIsAssociate = receiptIsAssociate.logs.find(
        (log) => log.fragment.name === Constants.Events.IsAssociated
      );

      expect(logIsAssociate).to.exist;
      expect(logIsAssociate.args[0]).to.eq(false);
    });

    it('should be able to call isAssociated() after token association', async function () {
      const txAssociate = await hrc719Contract
        .connect(signers[1])
        .associate(tokenAddress, Constants.GAS_LIMIT_1_000_000);
      await txAssociate.wait();

      const txIsAssociate = await hrc719Contract
        .connect(signers[1])
        .isAssociated(tokenAddress, Constants.GAS_LIMIT_1_000_000);
      const receiptIsAssociate = await txIsAssociate.wait();
      const logIsAssociate = receiptIsAssociate.logs.find(
        (log) => log.fragment.name === Constants.Events.IsAssociated
      );

      expect(logIsAssociate).to.exist;
      expect(logIsAssociate.args[0]).to.eq(true);
    });

    it('should be able to call isAssociated() after token dissociation', async function () {
      const txAssociate = await hrc719Contract
        .connect(signers[1])
        .dissociate(tokenAddress, Constants.GAS_LIMIT_1_000_000);
      await txAssociate.wait();

      const txIsAssociate = await hrc719Contract
        .connect(signers[1])
        .isAssociated(tokenAddress, Constants.GAS_LIMIT_1_000_000);
      const receiptIsAssociate = await txIsAssociate.wait();
      const logIsAssociate = receiptIsAssociate.logs.find(
        (log) => log.fragment.name === Constants.Events.IsAssociated
      );

      expect(logIsAssociate).to.exist;
      expect(logIsAssociate.args[0]).to.eq(false);
    });
  });

  describe('HRC719 Token', () => {
    it('should be able to associate() to the token from an EOA', async function () {
      const txAssociate = await hrcToken.associate(
        Constants.GAS_LIMIT_1_000_000
      );
      const receiptAssociate = await txAssociate.wait();
      expect(receiptAssociate).to.exist;
      expect(receiptAssociate.status).to.eq(1);
    });

    it('should be able to dissociate() to the token from an EOA', async function () {
      const txDissociate = await hrcToken.dissociate(
        Constants.GAS_LIMIT_1_000_000
      );
      const receiptDissociate = await txDissociate.wait();

      expect(receiptDissociate).to.exist;
      expect(receiptDissociate.status).to.eq(1);
    });

    // @notice: skip as IHRC719.isAssociated() is not yet supported by mirror node
    // @notice: should not be skipped when the feature is fully implemented in mirror node
    // @notice: track by https://github.com/hashgraph/hedera-smart-contracts/issues/948
    xit('should be able to call isAssociated() to the token from an EOA', async function () {
      const hrcTokenSigner1 = new Contract(tokenAddress, IHRC719, signers[1]);
      const isAssociatedSigner1 = await hrcTokenSigner1.isAssociated();
      expect(isAssociatedSigner1).to.be.false;
    });

    // @notice: skip as IHRC719.isAssociated() is not yet supported by mirror node
    // @notice: should not be skipped when the feature is fully implemented in mirror node
    // @notice: track by https://github.com/hashgraph/hedera-smart-contracts/issues/948
    xit('should be able to call isAssociated() to the token from an EOA when associated', async function () {
      const hrcTokenSigner1 = new Contract(tokenAddress, IHRC719, signers[1]);

      const txAssociate = await hrcTokenSigner1.associate(
        Constants.GAS_LIMIT_1_000_000
      );
      await txAssociate.wait();

      const isAssociated = await hrcTokenSigner1.isAssociated();
      expect(isAssociated).to.exist;
      expect(isAssociated).to.eq(true);
    });

    // @notice: skip as IHRC719.isAssociated() is not yet supported by mirror node
    // @notice: should not be skipped when the feature is fully implemented in mirror node
    // @notice: track by https://github.com/hashgraph/hedera-smart-contracts/issues/948
    xit('should be able to call isAssociated() to the token from an EOA when dissociated', async function () {
      const hrcTokenSigner1 = new Contract(tokenAddress, IHRC719, signers[1]);

      const txAssociate = await hrcTokenSigner1.dissociate(
        Constants.GAS_LIMIT_1_000_000
      );
      await txAssociate.wait();

      const isAssociated = await hrcTokenSigner1.isAssociated();
      expect(isAssociated).to.exist;
      expect(isAssociated).to.eq(false);
    });
  });

  describe('redirectoForToken', () => {
    it('should be able to execute associate() via redirectForToken', async function () {
      const encodedFunc = IHRC719.encodeFunctionData('associate()');
      const tx = await tokenCreateContract.redirectForToken(
        tokenAddress,
        encodedFunc,
        Constants.GAS_LIMIT_1_000_000
      );
      const [success, result] = await parseCallResponseEventData(tx);
      expect(success).to.eq(true);
      expect(decodeHexToDec(result)).to.eq(Constants.TX_SUCCESS_CODE);
    });

    it('should be able to execute dissociate() via redirectForToken', async function () {
      // first associate the token before dissociate other wise get response_code = 184 instead of 22 (success)
      const encodedFuncAssociate = IHRC719.encodeFunctionData('associate()');
      const associateTx = await tokenCreateContract.redirectForToken(
        tokenAddress,
        encodedFuncAssociate,
        Constants.GAS_LIMIT_1_000_000
      );
      await associateTx.wait();

      const enCodedFuncDissociate = IHRC719.encodeFunctionData('dissociate()');
      const dissociateTx = await tokenCreateContract.redirectForToken(
        tokenAddress,
        enCodedFuncDissociate,
        Constants.GAS_LIMIT_1_000_000
      );

      const [success, result] = await parseCallResponseEventData(dissociateTx);
      expect(success).to.eq(true);
      expect(decodeHexToDec(result)).to.eq(Constants.TX_SUCCESS_CODE);
    });

    it('should be able to execute isAssociated() via redirectForToken', async function () {
      const encodedFunc = IHRC719.encodeFunctionData('isAssociated()');
      const tx = await tokenCreateContract.redirectForToken(
        tokenAddress,
        encodedFunc,
        Constants.GAS_LIMIT_1_000_000
      );
      const [success, result] = await parseCallResponseEventData(tx);
      expect(success).to.eq(true);
      expect(decodeHexToDec(result)).to.eq(0); // 0 = false
    });

    it('should be able to execute isAssociated() after association via redirectForToken', async function () {
      await (
        await tokenCreateContract.redirectForToken(
          tokenAddress,
          IHRC719.encodeFunctionData('associate()'),
          Constants.GAS_LIMIT_1_000_000
        )
      ).wait();

      const encodedFunc = IHRC719.encodeFunctionData('isAssociated()');
      const tx = await tokenCreateContract.redirectForToken(
        tokenAddress,
        encodedFunc,
        Constants.GAS_LIMIT_1_000_000
      );
      const [success, result] = await parseCallResponseEventData(tx);
      expect(success).to.eq(true);
      expect(decodeHexToDec(result)).to.eq(1); // 1 = true
    });
  });
});
