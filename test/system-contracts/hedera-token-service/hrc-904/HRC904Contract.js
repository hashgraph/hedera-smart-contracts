const { expect } = require('chai');
const { ethers } = require('hardhat');
const utils = require('../utils');
const Constants = require('../../../constants');
const { Contract } = require('ethers');
const {
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Client,
  ContractId,
  ScheduleCreateTransaction,
  TransactionId,
  AccountId,
  TransactionReceiptQuery,
  PrivateKey,
  TransactionRecordQuery,
  Wallet,
} = require('@hashgraph/sdk');
const axios = require('axios');

describe('HRC904Contract Test Suite', function () {
  let hrc904Contract;
  let airdropContract;
  let tokenAddress;
  let nftTokenAddress;
  let tokenCreateContract;
  let tokenTransferContract;
  let tokenQueryContract;
  let mintedTokenSerialNumber;
  let signers;
  const invalidAddress = '0x000000000000000000000000000000000000dead';
  let client;
  let wallet;

  before(async function () {
    client = Client.forLocalNode();
    client.setOperator(
      process.env.OPERATOR_ID_A,
      PrivateKey.fromStringECDSA(process.env.OPERATOR_KEY_A)
    );
    signers = await ethers.getSigners();
    airdropContract = await utils.deployAirdropContract();
    tokenCreateContract = await utils.deployTokenCreateContract();
    tokenQueryContract = await utils.deployTokenQueryContract();
    tokenTransferContract = await utils.deployTokenTransferContract();
    hrc904Contract = await utils.deployHRC904Contract();

    await utils.updateAccountKeysViaHapi([
      await airdropContract.getAddress(),
      await tokenCreateContract.getAddress(),
      await tokenQueryContract.getAddress(),
      await tokenTransferContract.getAddress(),
      await hrc904Contract.getAddress(),
    ]);

    // Create fungible and non-fungible tokens
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

    await utils.associateToken(
      tokenCreateContract,
      tokenAddress,
      Constants.Contract.TokenCreateContract
    );
    await utils.grantTokenKyc(tokenCreateContract, tokenAddress);

    nftTokenAddress = await utils.createNonFungibleTokenWithSECP256K1AdminKey(
      tokenCreateContract,
      signers[0].address,
      utils.getSignerCompressedPublicKey()
    );

    await utils.updateTokenKeysViaHapi(nftTokenAddress, [
      await airdropContract.getAddress(),
      await tokenCreateContract.getAddress(),
      await hrc904Contract.getAddress(),
      await tokenQueryContract.getAddress(),
      await tokenTransferContract.getAddress(),
    ]);

    await utils.associateToken(
      tokenCreateContract,
      nftTokenAddress,
      Constants.Contract.TokenCreateContract
    );
    await utils.grantTokenKyc(tokenCreateContract, nftTokenAddress);

    const IHRC904AccountFacade = new ethers.Interface(
      (await hre.artifacts.readArtifact('IHRC904AccountFacade')).abi
    );

    walletIHRC904AccountFacade = new Contract(
      signers[1].address,
      IHRC904AccountFacade,
      signers[1]
    );

    // Disabling automatic associations for receiver so all airdrops will be pending
    const disableAutoAssociations =
      await walletIHRC904AccountFacade.setUnlimitedAutomaticAssociations(
        false,
        {
          gasLimit: 2_000_000,
        }
      );
    await disableAutoAssociations.wait();

    // Mint a non-fungible token
    mintedTokenSerialNumber = await utils.mintNFT(
      tokenCreateContract,
      nftTokenAddress
    );
  });

  // Positive tests
  it('should cancel a pending airdrop for a fungible token (FT)', async function () {
    const receiver = signers[1].address;

    const airdrop = await airdropContract.tokenAirdrop(
      tokenAddress,
      signers[0].address,
      receiver,
      1,
      {
        gasLimit: 2_000_000,
      }
    );
    const airdropReceipt = await airdrop.wait();
    expect(airdropReceipt.status).to.eq(1);

    const tx = await hrc904Contract.cancelAirdropFT(tokenAddress, receiver);
    const receipt = await tx.wait();

    expect(receipt).to.exist;
    expect(receipt.status).to.eq(1);
  });

  it('should cancel a pending airdrop for a non-fungible token (NFT)', async function () {
    const receiver = signers[1].address;
    await utils.associateToken(
      tokenCreateContract,
      nftTokenAddress,
      Constants.Contract.TokenCreateContract
    );

    const airdrop = await airdropContract.nftAirdrop(
      nftTokenAddress,
      signers[0].address,
      receiver,
      mintedTokenSerialNumber,
      {
        gasLimit: 2_000_000,
      }
    );
    await airdrop.wait();

    const tx = await hrc904Contract.cancelAirdropNFT(
      nftTokenAddress,
      receiver,
      mintedTokenSerialNumber
    );
    const receipt = await tx.wait();

    expect(receipt).to.exist;
    expect(receipt.status).to.eq(1);
  });

  it('should enable unlimited automatic associations for an account', async function () {
    const tx =
      await walletIHRC904AccountFacade.setUnlimitedAutomaticAssociations(
        false,
        {
          gasLimit: 2_000_000,
        }
      );
    const receipt = await tx.wait();

    expect(receipt).to.exist;
    expect(receipt.status).to.eq(1);
  });

  it('should disable unlimited automatic associations for an account', async function () {
    const tx =
      await walletIHRC904AccountFacade.setUnlimitedAutomaticAssociations(
        false,
        {
          gasLimit: 2_000_000,
        }
      );
    const receipt = await tx.wait();

    expect(receipt).to.exist;
    expect(receipt.status).to.eq(1);
  });

  it('should claim a pending airdrop for a fungible token (FT)', async function () {
    const receiver = signers[1].address;

    const airdrop = await airdropContract.tokenAirdrop(
      tokenAddress,
      signers[0].address,
      receiver,
      1,
      {
        gasLimit: 2_000_000,
      }
    );
    const airdropReceipt = await airdrop.wait();
    expect(airdropReceipt.status).to.eq(1);
    const tx = await hrc904Contract.claimAirdropFT(tokenAddress, receiver);
    const receipt = await tx.wait();

    expect(receipt).to.exist;
    expect(receipt.status).to.eq(1);
  });

  it('should claim a pending airdrop for a non-fungible token (NFT)', async function () {
    await airdropContract.nftAirdrop(
      nftTokenAddress,
      signers[0].address,
      signers[1].address,
      mintedTokenSerialNumber
    );

    const tx = await hrc904Contract.claimAirdropNFT(
      nftTokenAddress,
      signers[1].address,
      mintedTokenSerialNumber
    );

    const receipt = await tx.wait();

    expect(receipt).to.exist;
    expect(receipt.status).to.eq(1);
  });

  it('should reject tokens for a given account (FT)', async function () {
    const receiver = signers[1].address;

    const airdrop = await airdropContract.tokenAirdrop(
      tokenAddress,
      signers[0].address,
      receiver,
      1,
      {
        gasLimit: 2_000_000,
      }
    );
    const airdropReceipt = await airdrop.wait();
    expect(airdropReceipt.status).to.eq(1);
    const tx = await hrc904Contract.rejectTokenFT(tokenAddress);

    const receipt = await tx.wait();

    expect(receipt).to.exist;
    expect(receipt.status).to.eq(1);
  });

  it('should reject tokens for a given account and serial number (NFT)', async function () {
    const receiver = signers[1].address;
    await airdropContract.nftAirdrop(
      nftTokenAddress,
      signers[0].address,
      receiver,
      mintedTokenSerialNumber
    );

    const tx = await hrc904Contract.rejectTokenNFTs(receiver, [
      mintedTokenSerialNumber,
    ]);

    const receipt = await tx.wait();

    expect(receipt).to.exist;
    expect(receipt.status).to.eq(1);
  });

  it('should reject 10 tokens for a given account and serial number (NFT)', async function () {
    const serialNumbers = [];
    for (let i = 0; i < 10; i++) {
      serialNumbers.push(
        await utils.mintNFT(tokenCreateContract, nftTokenAddress)
      );
    }
    serialNumbers = serialNumbers.map(BigInt);
    await airdropContract.nftAirdrop(
      nftTokenAddress,
      signers[0].address,
      signers[1].address,
      serialNumbers
    );

    const tx = await hrc904Contract.rejectTokenNFTs(
      signers[1].address,
      serialNumbers
    );

    const receipt = await tx.wait();

    expect(receipt).to.exist;
    expect(receipt.status).to.eq(1);
  });

  // Negative tests
  it('should fail to cancel a pending airdrop for FT when sender has no pending airdrops', async function () {
    const receiver = signers[1].address;

    const airdrop = await airdropContract.tokenAirdrop(
      tokenAddress,
      signers[0].address,
      receiver,
      1,
      {
        gasLimit: 2_000_000,
      }
    );
    const airdropReceipt = await airdrop.wait();
    expect(airdropReceipt.status).to.eq(1);
    const tx = await hrc904Contract.cancelAirdropFT(
      tokenAddress,
      invalidAddress
    );
    const r = await tx.wait();
    // Act & Assert
    await expect(
      hrc904Contract.cancelAirdropFT(tokenAddress, signers[2].address)
    ).to.be.revertedWith('No pending airdrops');
  });

  it('should fail to cancel a pending airdrop for FT when sender has no valid account', async function () {
    // Act & Assert
    await expect(
      hrc904Contract.cancelAirdropFT(tokenAddress, invalidAddress)
    ).to.be.revertedWith('Invalid account');
  });

  it('should fail to cancel a pending airdrop for NFT when sender has no pending airdrops', async function () {
    // Act & Assert
    await expect(
      hrc904Contract.cancelAirdropNFT(
        tokenAddress,
        signers[2].address,
        mintedTokenSerialNumber
      )
    ).to.be.revertedWith('No pending airdrops');
  });

  it('should fail to cancel a pending airdrop for NFT when sender has no valid account', async function () {
    // Act & Assert
    await expect(
      hrc904Contract.cancelAirdropNFT(
        tokenAddress,
        ethers.ZeroAddress,
        mintedTokenSerialNumber
      )
    ).to.be.revertedWith('Invalid account');
  });

  it('should fail to claim FT airdrop with no pending airdrops', async function () {
    const tx = await hrc904Contract.claimAirdropFT(
      tokenAddress,
      signers[2].address
    );
    const receipt = await tx.wait();
    await expect().to.be.revertedWith('No pending airdrops');
  });

  it('should fail to claim FT airdrop with an invalid account', async function () {
    const tx = await hrc904Contract.claimAirdropFT(
      tokenAddress,
      invalidAddress
    );
    const r = await tx.wait();
    await expect(
      hrc904Contract.claimAirdropFT(tokenAddress, invalidAddress)
    ).to.be.revertedWith('Invalid account');
  });

  it('should fail to claim NFT airdrop with no pending airdrops', async function () {
    await expect(
      hrc904Contract.claimAirdropNFT(
        nftTokenAddress,
        signers[2].address,
        mintedTokenSerialNumber
      )
    ).to.be.revertedWith('No pending airdrops');
  });

  it('should fail to claim NFT airdrop with an invalid account', async function () {
    await expect(
      hrc904Contract.claimAirdropNFT(
        nftTokenAddress,
        invalidAddress,
        mintedTokenSerialNumber
      )
    ).to.be.revertedWith('Invalid account');
  });

  it('should fail to reject FT tokens with no tokens', async function () {
    await expect(
      hrc904Contract.rejectTokenFT(signers[2].address)
    ).to.be.revertedWith('No tokens to reject');
  });

  it('should fail to reject FT tokens with an invalid account', async function () {
    await expect(
      hrc904Contract.rejectTokenFT(ethers.ZeroAddress)
    ).to.be.revertedWith('Invalid account');
  });

  it('should fail to reject NFT tokens with no tokens', async function () {
    await expect(
      hrc904Contract.rejectTokenNFTs(signers[2].address, [
        mintedTokenSerialNumber,
      ])
    ).to.be.revertedWith('No tokens to reject');
  });

  it('should fail to reject NFT tokens when 11 or more serials are provided', async function () {
    const serialNumbers = Array.from(
      { length: 11 },
      (_, i) => mintedTokenSerialNumber + i
    );
    await expect(
      hrc904Contract.rejectTokenNFTs(signers[1].address, serialNumbers)
    ).to.be.revertedWith('Too many serials');
  });
});
