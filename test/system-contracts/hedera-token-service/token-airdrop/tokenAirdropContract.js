const { expect } = require('chai');
const { Contract } = require('ethers');
const { ethers } = require('hardhat');
const utils = require('../utils');
const Constants = require('../../../constants');
const IHRC904Contract = require('../../../../artifacts/contracts/system-contracts/hedera-token-service/IHRC904.sol/IHRC904.json');

describe('HRC904Contract Test Suite', function () {
  let hrc904Contract;
  let hrc904Address;
  let hrc904Interface;
  let airdropContract;
  let tokenCreateContract;
  let tokenAddress;
  let signers;
  let IHRC904;
  let hrc904AccountInterface;

  before(async function () {
    signers = await ethers.getSigners();
    airdropContract = await utils.deployAirdropContract();
    tokenCreateContract = await utils.deployTokenCreateContract();
    hrc904Contract = await utils.deployHRC904Contract();
    hrc904Address = await hrc904Contract.getAddress();
    hrc904Interface = new ethers.Interface(IHRC904Contract.abi);
    await utils.updateAccountKeysViaHapi([
      await airdropContract.getAddress(),
      await tokenCreateContract.getAddress(),
      await hrc904Contract.getAddress(),
    ]);

    tokenAddress = await utils.createFungibleTokenWithSECP256K1AdminKey(
      tokenCreateContract,
      signers[0].address,
      utils.getSignerCompressedPublicKey()
    );
    await utils.updateTokenKeysViaHapi(tokenAddress, [
      await airdropContract.getAddress(),
      await tokenCreateContract.getAddress(),
      await hrc904Contract.getAddress(),
    ]);
    await utils.associateToken(
      tokenCreateContract,
      tokenAddress,
      Constants.Contract.TokenCreateContract
    );
    await utils.grantTokenKyc(tokenCreateContract, tokenAddress);

    IHRC904 = new ethers.Interface(
      (await hre.artifacts.readArtifact('IHRC904')).abi
    );
    hrc904AccountInterface = new Contract(
      signers[1].address,
      IHRC904,
      signers[1]
    );
  });

  it('should be able to create an HTS fungible token', async function () {
    expect(tokenAddress).to.exist;
  });

  it('should be able to associate receiver with a token', async function () {
    const tx = await hrc904Contract.associate(
      tokenAddress,
      Constants.GAS_LIMIT_1_000_000
    );
    const receipt = await tx.wait();
    expect(receipt.status).to.eq(1);
  });

  it('should be able to set the auto associate setting to true', async function () {
    const tx = await hrc904AccountInterface.setUnlimitedAutomaticAssociations(
      true,
      {
        gasLimit: 1_000_000,
      }
    );
    const receipt = await tx.wait();
    expect(receipt.status).to.eq(1);
  });

  it('should revert for tokenAirdrop to a smart contract', async function () {
    try {
      const tx = await airdropContract.tokenAirdrop(
        tokenAddress,
        signers[0].address,
        tokenCreateContract.target,
        1,
        {
          gasLimit: 2_000_000,
          value: 100_000,
        }
      );
      await tx.wait();
      expect.fail('Should revert');
    } catch (error) {
      expect(error.code).to.eq(Constants.CALL_EXCEPTION);
    }
  });

  it('should be able to airdrop any token in its balance based on token address', async function () {
    const tx = await airdropContract.tokenAirdrop(
      tokenAddress,
      signers[0].address,
      signers[1].address,
      1,
      {
        gasLimit: 2_000_000,
        value: 100_000,
      }
    );
    const receipt = await tx.wait();
    expect(receipt.status).to.eq(1);
  });

  it('should be able to claim any token airdropped to it based on token address', async function () {
    const data = hrc904Interface.encodeFunctionData('claimAirdropFT', [
      signers[0].address,
    ]);
    const tx = await signers[1].sendTransaction({
      to: tokenAddress,
      data: data,
      gasLimit: 1_000_000,
    });
    const receipt = await tx.wait();
    expect(receipt.status).to.eq(1);
  });

  it('should be able to cancel a token it airdropped', async function () {
    const tx = await hrc904Contract.cancelAirdropFT(
      tokenAddress,
      hrc904Address
    );
    const receipt = await tx.wait();
    expect(receipt.status).to.eq(1);
  });

  it('should be able to revoke any token in its balance', async function () {
    const tx = await hrc904Contract.rejectTokenFT(tokenAddress);
    const receipt = await tx.wait();
    expect(receipt.status).to.eq(1);
  });

  it('should be able to set the auto associate setting back to false', async function () {
    const tx = await hrc904AccountInterface.setUnlimitedAutomaticAssociations(
      false,
      {
        gasLimit: 1_000_000,
      }
    );
    const receipt = await tx.wait();
    expect(receipt.status).to.eq(1);
  });
});
