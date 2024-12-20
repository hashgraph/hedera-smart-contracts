const { expect } = require('chai');
const { ethers } = require('hardhat');
const utils = require('../utils');
const Constants = require('../../../constants');
const IHRC904Contract = require('../../../../artifacts/contracts/system-contracts/hedera-token-service/IHRC904.sol/IHRC904.json');
const { Contract } = require('ethers');

describe('AirdropContract Test Suite', function () {
  let hrc904Contract;
  let airdropContract;
  let tokenCreateContract;
  let tokenTransferContract;
  let tokenQueryContract;
  let erc20Contract;
  let erc721Contract;
  let tokenAddress;
  let tokenAddress2;
  let nftTokenAddress;
  let mintedTokenSerialNumber;
  let signers;
  let IHRC904;

  before(async function () {
    signers = await ethers.getSigners();
    airdropContract = await utils.deployAirdropContract();
    tokenCreateContract = await utils.deployTokenCreateContract();
    tokenQueryContract = await utils.deployTokenQueryContract();
    tokenTransferContract = await utils.deployTokenTransferContract();
    erc20Contract = await utils.deployERC20Contract();
    erc721Contract = await utils.deployERC721Contract();
    hrc904Contract = await utils.deployHRC904Contract();
    hrc904Address = await hrc904Contract.getAddress();
    hrc904Interface = new ethers.Interface(IHRC904Contract.abi);

    await utils.updateAccountKeysViaHapi([
      await airdropContract.getAddress(),
      await tokenCreateContract.getAddress(),
      await tokenQueryContract.getAddress(),
      await tokenTransferContract.getAddress(),
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
      await tokenQueryContract.getAddress(),
      await tokenTransferContract.getAddress(),
      await hrc904Contract.getAddress(),
    ]);
    nftTokenAddress = await utils.createNonFungibleTokenWithSECP256K1AdminKey(
      tokenCreateContract,
      signers[0].address,
      utils.getSignerCompressedPublicKey()
    );
    await utils.updateTokenKeysViaHapi(nftTokenAddress, [
      await airdropContract.getAddress(),
      await tokenCreateContract.getAddress(),
      await tokenQueryContract.getAddress(),
      await tokenTransferContract.getAddress(),
      await hrc904Contract.getAddress(),
    ]);
    mintedTokenSerialNumber = await utils.mintNFT(
      tokenCreateContract,
      nftTokenAddress
    );

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

    IHRC904 = new ethers.Interface(
      (await hre.artifacts.readArtifact('IHRC904')).abi
    );
    hrc904AccountInterface = new Contract(
      signers[1].address,
      IHRC904,
      signers[1]
    );
  });

  it('should airdrop multiple tokens (FT and NFT) to multiple accounts', async function () {
    const ftAmount = BigInt(1);
    const accounts = signers.slice(1, 3).map((s) => s.address);
    // Check initial balances
    const initialFTBalances = await Promise.all(
      accounts.map((account) => erc20Contract.balanceOf(tokenAddress, account))
    );
    const initialNFTBalances = await Promise.all(
      accounts.map((account) =>
        erc721Contract
          .ownerOf(nftTokenAddress, mintedTokenSerialNumber)
          .catch(() => null)
      )
    );
    // Airdrop fungible tokens
    const tx = await airdropContract.mixedAirdrop(
      [tokenAddress, tokenAddress2], // tokens
      [nftTokenAddress], // nft's
      [signers[0].address], // ft senders
      accounts, // ft receivers
      [signers[0].address], // nft senders
      accounts, // nft receivers
      ftAmount, // ft amount
      [mintedTokenSerialNumber], // serials
      {
        gasLimit: 5_000_000,
      }
    );
    await tx.wait();

    // Check updated balances
    const updatedFTBalances = await Promise.all(
      accounts.map((account) => erc20Contract.balanceOf(tokenAddress, account))
    );
    const updatedNFTBalances = await Promise.all(
      accounts.map((account, index) =>
        erc721Contract
          .ownerOf(nftTokenAddress, mintedTokenSerialNumber)
          .catch(() => null)
      )
    );

    // Validate FT balances
    for (let i = 0; i < accounts.length; i++) {
      expect(updatedFTBalances[i]).to.equal(initialFTBalances[i] + ftAmount);
    }

    // Validate NFT ownership
    for (let i = 0; i < accounts.length; i++) {
      expect(updatedNFTBalances[i]).to.equal(accounts[i]);
    }
  });

  it('should airdrop 10 tokens (FT and NFT) to multiple accounts', async function () {
    const ftAmount = BigInt(1);
    const nftSerialNumbers = Array.from(
      { length: 10 },
      (_, i) => BigInt(mintedTokenSerialNumber) + BigInt(i)
    );
    const accounts = signers.slice(1, 11).map((s) => s.address);

    const mintedTokenSerialNumbers = [];
    // Mint additional NFTs
    for (let i = 1; i < 10; i++) {
      const serialNumber = await utils.mintNFT(
        tokenCreateContract,
        nftTokenAddress
      );
      mintedTokenSerialNumbers.push(serialNumber);
    }

    const tx = await airdropContract.mixedAirdrop(
      [tokenAddress], // tokens
      [nftTokenAddress], // nft's
      [signers[0].address], // ft senders
      accounts, // ft receivers
      [signers[0].address], // nft senders
      accounts, // nft receivers
      ftAmount, // ft amount
      mintedTokenSerialNumbers, // serials
      {
        gasLimit: 5_000_000,
      }
    );
    await tx.wait();

    // Validate FT balances
    for (let i = 0; i < accounts.length; i++) {
      const balance = await erc20Contract.balanceOf(tokenAddress, accounts[i]);
      expect(balance).to.equal(ftAmount);
    }

    // Validate NFT ownership
    for (let i = 0; i < accounts.length; i++) {
      const owner = await erc721Contract.ownerOf(
        nftTokenAddress,
        nftSerialNumbers[i]
      );
      expect(owner).to.equal(accounts[i]);
    }
  });

  it('should airdrop a fungible token to a single account', async function () {
    const ftAmount = BigInt(1);
    const receiver = signers[1].address;
    const initialBalance = await erc20Contract.balanceOf(
      tokenAddress,
      receiver
    );

    const tx = await airdropContract.tokenAirdrop(
      tokenAddress,
      signers[0].address,
      receiver,
      ftAmount,
      {
        gasLimit: 2_000_000,
      }
    );
    await tx.wait();

    const updatedBalance = await erc20Contract.balanceOf(
      tokenAddress,
      receiver
    );
    expect(updatedBalance).to.equal(initialBalance + ftAmount);
  });

  it('should airdrop a non-fungible token to a single account', async function () {
    const receiver = signers[1].address;

    const tx = await airdropContract.nftAirdrop(
      nftTokenAddress,
      signers[0].address,
      receiver,
      mintedTokenSerialNumber,
      {
        gasLimit: 2_000_000,
      }
    );
    await tx.wait();

    const owner = await erc721Contract.ownerOf(
      nftTokenAddress,
      mintedTokenSerialNumber
    );
    expect(owner).to.equal(receiver);
  });

  it('should fail when the sender does not have enough balance', async function () {
    const ftAmount = BigInt(100_000_000_000_000_000);
    const receiver = signers[1].address;

    try {
      const tx = await airdropContract.tokenAirdrop(
        tokenAddress,
        signers[2].address, // Insufficient balance
        receiver,
        ftAmount,
        {
          gasLimit: 2_000_000,
        }
      );
      await tx.wait();
      expect.fail('Should revert');
    } catch (error) {
      expect(error.reason).to.eq('INSUFFICIENT_TOKEN_BALANCE');
    }
  });

  it('should fail when the receiver does not have a valid account', async function () {
    const ftAmount = BigInt(1);
    const invalidReceiver = '0x000000000000000000000000000000000000dead';

    try {
      const tx = await airdropContract.tokenAirdrop(
        tokenAddress,
        signers[2].address,
        invalidReceiver,
        ftAmount,
        {
          gasLimit: 2_000_000,
        }
      );
      await tx.wait();
      console.log(tx.hash);
      expect.fail('Should revert');
    } catch (error) {
      console.log(JSON.stringify(error));
      expect(error.code).to.eq(Constants.CONTRACT_REVERT_EXECUTED_CODE);
    }
  });

  it('should fail when the token does not exist', async function () {
    const ftAmount = BigInt(1);
    const receiver = signers[1].address;
    const invalidToken = '0x000000000000000000000000000000000000dead';

    try {
      const tx = await airdropContract.tokenAirdrop(
        invalidToken,
        signers[0].address,
        receiver,
        ftAmount
      );
      await tx.wait();
      console.log(tx.hash);

      expect.fail('Should revert');
    } catch (error) {
      console.log(JSON.stringify(error));
      expect(error.code).to.eq(Constants.CONTRACT_REVERT_EXECUTED_CODE);
    }
  });

  it('should fail when the airdrop amounts are out of bounds', async function () {
    const invalidAmount = BigInt(-100);
    const receiver = signers[1].address;

    try {
      const tx = await airdropContract.tokenAirdrop(
        tokenAddress,
        signers[0].address,
        receiver,
        invalidAmount
      );
      await tx.wait();
      console.log(tx.hash);
      expect.fail('Should revert');
    } catch (error) {
      console.log(JSON.stringify(error));
      expect(error.code).to.eq(Constants.CONTRACT_REVERT_EXECUTED_CODE);
    }
  });

  it('should fail when 11 or more airdrops are provided', async function () {
    const ftAmount = BigInt(1);
    const receivers = new Array(11).fill(signers[1].address);

    try {
      const tx = await airdropContract.tokenNAmountAirdrops(
        [tokenAddress],
        new Array(11).fill(signers[0].address),
        receivers,
        ftAmount
      );
      await tx.wait();
      expect.fail('Should revert');
    } catch (error) {
      console.log(JSON.stringify(error));
      expect(error.code).to.eq(Constants.CONTRACT_REVERT_EXECUTED_CODE);
    }
  });
});
