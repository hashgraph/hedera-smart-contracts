// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const { ethers } = require('hardhat');
const utils = require('../utils');
const Constants = require('../../../constants');
const Utils = require("../utils");

describe('HIP904Batch3 ClaimAirdropContract Test Suite', function () {
  let airdropContract;
  let claimAirdropContract;
  let tokenCreateContract;
  let erc20Contract;
  let erc721Contract;
  let signers;
  let owner;
  let receiver;
  let receiverPrivateKey;
  let contractAddresses;

  before(async function () {
    signers = await ethers.getSigners();
    airdropContract = await utils.deployContract(Constants.Contract.Airdrop);
    claimAirdropContract = await utils.deployContract(
      Constants.Contract.ClaimAirdrop
    );

    receiverPrivateKey = ethers.hexlify(ethers.randomBytes(32));
    receiver = new ethers.Wallet(receiverPrivateKey).connect(ethers.provider);

    // Send some HBAR to activate the account
    await signers[0].sendTransaction({
      to: receiver.address,
      value: ethers.parseEther('100'),
    });
    tokenCreateContract = await utils.deployContract(
      Constants.Contract.TokenCreateContract
    );
    erc20Contract = await utils.deployContract(
      Constants.Contract.ERC20Contract
    );
    erc721Contract = await utils.deployContract(
      Constants.Contract.ERC721Contract
    );
    owner = signers[0].address;
    contractAddresses = [
      await airdropContract.getAddress(),
      await tokenCreateContract.getAddress(),
      await claimAirdropContract.getAddress(),
    ];

    await utils.updateAccountKeysViaHapi(contractAddresses);

    await utils.updateAccountKeysViaHapi(contractAddresses, [
      receiverPrivateKey,
    ]);

    tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses
    );

    const IHRC904AccountFacade = new ethers.Interface(
      (await hre.artifacts.readArtifact('IHRC904AccountFacade')).abi
    );

    const walletIHRC904AccountFacade = new ethers.Contract(
      receiver.address,
      IHRC904AccountFacade,
      receiver
    );

    // Disabling automatic associations for receiver so all airdrops will be pending
    const disableAutoAssociations =
      await walletIHRC904AccountFacade.setUnlimitedAutomaticAssociations(
        false,
        Constants.GAS_LIMIT_2_000_000
      );
    await disableAutoAssociations.wait();
  });

  it('should claim a single pending fungible token airdrop', async function () {
    const ftAmount = BigInt(1);
    const sender = signers[0].address;
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses
    );

    const initialBalance = await erc20Contract.balanceOf(
      tokenAddress,
      receiver.address
    );

    const airdropTx = await airdropContract.tokenAirdrop(
      tokenAddress,
      sender,
      receiver.address,
      ftAmount,
      {
        value: Constants.ONE_HBAR,
        ...Constants.GAS_LIMIT_2_000_000
      }
    );
    await airdropTx.wait();

    await utils.associateWithSigner(receiverPrivateKey, tokenAddress);
    const claimTx = await claimAirdropContract.claim(
      sender,
      receiver.address,
      tokenAddress,
      Constants.GAS_LIMIT_2_000_000
    );
    await claimTx.wait();

    const updatedBalance = await erc20Contract.balanceOf(
      tokenAddress,
      receiver.address
    );
    expect(updatedBalance).to.equal(initialBalance + ftAmount);
  });

  it('should claim a single pending NFT airdrop', async function () {
    const sender = signers[0].address;
    const nftTokenAddress = await utils.setupNft(
      tokenCreateContract,
      owner,
      contractAddresses
    );

    const serialNumber = await utils.mintNFTToAddress(
      tokenCreateContract,
      nftTokenAddress
    );

    const airdropTx = await airdropContract.nftAirdrop(
      nftTokenAddress,
      sender,
      receiver.address,
      serialNumber,
      {
        value: Constants.ONE_HBAR,
        ...Constants.GAS_LIMIT_2_000_000
      }
    );
    await airdropTx.wait();

    const claimTx = await claimAirdropContract.claimNFTAirdrop(
      sender,
      receiver.address,
      nftTokenAddress,
      serialNumber,
      Constants.GAS_LIMIT_2_000_000
    );
    await claimTx.wait();

    const nftOwner = await erc721Contract.ownerOf(
      nftTokenAddress,
      serialNumber
    );
    expect(nftOwner).to.equal(receiver.address);
  });

  it('should claim multiple pending fungible token airdrops', async function () {
    const { senders, receivers, tokens, serials, amounts } =
      await utils.createPendingAirdrops(
        10,
        tokenCreateContract,
        owner,
        airdropContract,
        receiver.address
      );

    const initialBalances = await Promise.all(
      tokens.map((token) => erc20Contract.balanceOf(token, receiver.address))
    );

    for (let token of tokens) {
      await utils.associateWithSigner(receiverPrivateKey, token);
    }

    const claimTx = await claimAirdropContract.claimMultipleAirdrops(
      senders,
      receivers,
      tokens,
      serials,
      Constants.GAS_LIMIT_10_000_000
    );
    await claimTx.wait();

    for (let i = 0; i < tokens.length; i++) {
      const updatedBalance = await erc20Contract.balanceOf(
        tokens[i],
        receiver.address
      );
      expect(updatedBalance).to.equal(initialBalances[i] + amounts[i]);
    }
  });

  it('should fail to claim airdrops when sender has no pending airdrops', async function () {
    const sender = signers[1].address;
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses
    );

    const tx = await claimAirdropContract.claim(
      sender,
      receiver.address,
      tokenAddress,
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('367'); // INVALID_PENDING_AIRDROP_ID code
  });

  it('should fail to claim airdrops when sender does not have a valid account', async function () {
    const invalidSender = ethers.Wallet.createRandom().address;
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses
    );

    const tx = await claimAirdropContract.claim(
      invalidSender,
      receiver.address,
      tokenAddress,
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('367'); // INVALID_PENDING_AIRDROP_ID code
  });

  it('should fail to claim airdrops when receiver does not have a valid account', async function () {
    const invalidReceiver = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses
    );
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses
    );

    const tx = await claimAirdropContract.claim(
      owner,
      invalidReceiver,
      tokenAddress,
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('15'); // INVALID_ACCOUNT_ID code
  });

  it('should fail to claim more than 10 pending airdrops at once', async function () {
    const { senders, receivers, tokens, serials, amounts } =
      await utils.createPendingAirdrops(
        11,
        tokenCreateContract,
        owner,
        airdropContract,
        receiver.address
      );

    for (let token of tokens) {
      await utils.associateWithSigner(receiverPrivateKey, token);
    }

    const tx = await claimAirdropContract.claimMultipleAirdrops(
      senders,
      receivers,
      tokens,
      serials,
      Constants.GAS_LIMIT_10_000_000
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    const responseText = utils.decimalToAscii(responseCode);
    expect(responseText).to.eq('PENDING_AIRDROP_ID_LIST_TOO_LONG');
  });

  it('should fail to claim airdrops when token does not exist', async function () {
    const nonExistentToken = '0x1234567890123456789012345678901234567890';

    const tx = await claimAirdropContract.claim(
      owner,
      receiver.address,
      nonExistentToken,
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    const responseText = utils.decimalToAscii(responseCode);
    expect(responseText).to.eq('INVALID_TOKEN_ID');
  });

  it('should fail to claim airdrops when NFT does not exist', async function () {
    const nonExistentNft = '0x1234567890123456789012345678901234567890';

    const tx = await claimAirdropContract.claimNFTAirdrop(
      owner,
      receiver.address,
      nonExistentNft,
      1,
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    const responseText = utils.decimalToAscii(responseCode);
    expect(responseText).to.eq('INVALID_TOKEN_ID');
  });

  it('should fail to claim airdrops when NFT serial number does not exist', async function () {
    const sender = signers[0].address;
    const nftTokenAddress = await utils.setupNft(
      tokenCreateContract,
      owner,
      contractAddresses
    );
    const nonExistentSerialNumber = 999;

    const serialNumber = await utils.mintNFTToAddress(
      tokenCreateContract,
      nftTokenAddress
    );

    const airdropTx = await airdropContract.nftAirdrop(
      nftTokenAddress,
      sender,
      receiver.address,
      serialNumber,
      {
        value: Constants.ONE_HBAR,
        ...Constants.GAS_LIMIT_2_000_000
      }
    );
    await airdropTx.wait();

    const tx = await claimAirdropContract.claimNFTAirdrop(
      owner,
      receiver.address,
      nftTokenAddress,
      nonExistentSerialNumber,
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('367'); // INVALID_PENDING_AIRDROP_ID code
  });

  it('should fail with `SENDER_DOES_NOT_OWN_NFT_SERIAL_NO` when contract airdrops multiple duplicated NFT tokens to an account with max auto associations enable', async function () {
    const sender = signers[0].address;
    const receiverTemp = signers[1].address;

    const nftTokenAddress = await utils.setupNft(
        tokenCreateContract,
        owner,
        contractAddresses
    );

    const serialNumber = await utils.mintNFTToAddress(
        tokenCreateContract,
        nftTokenAddress
    );

    const airdropTx = await airdropContract.nftAirdrop(
        nftTokenAddress,
        sender,
        receiverTemp,
        serialNumber,
        {
          value: Constants.ONE_HBAR,
          ...Constants.GAS_LIMIT_2_000_000
        }
    );
    await airdropTx.wait();

    const airdropTx2 = await airdropContract.nftAirdrop(
        nftTokenAddress,
        sender,
        receiverTemp,
        serialNumber,
        {
          value: Constants.ONE_HBAR,
          ...Constants.GAS_LIMIT_2_000_000
        }
    );

    await expect(airdropTx2.wait()).to.be.rejectedWith('transaction execution reverted');
    expect(await Utils.getHTSResponseCode(airdropTx2.hash)).to.equal('237'); // SENDER_DOES_NOT_OWN_NFT_SERIAL_NO
  });

  it('should fail with `PENDING_NFT_AIRDROP_ALREADY_EXISTS` when contract airdrops multiple duplicated NFT tokens to an account with max auto associations disabled', async function () {
    const sender = signers[0].address;
    const receiverTemp = receiver;

    const nftTokenAddress = await utils.setupNft(
        tokenCreateContract,
        owner,
        contractAddresses
    );

    const serialNumber = await utils.mintNFTToAddress(
        tokenCreateContract,
        nftTokenAddress
    );

    const airdropTx = await airdropContract.nftAirdrop(
        nftTokenAddress,
        sender,
        receiverTemp,
        serialNumber,
        {
          value: Constants.ONE_HBAR,
          ...Constants.GAS_LIMIT_2_000_000
        }
    );
    await airdropTx.wait();

    const airdropTx2 = await airdropContract.nftAirdrop(
        nftTokenAddress,
        sender,
        receiverTemp,
        serialNumber,
        {
          value: Constants.ONE_HBAR,
          ...Constants.GAS_LIMIT_2_000_000
        }
    );

    await expect(airdropTx2.wait()).to.be.rejectedWith('transaction execution reverted');
    expect(await Utils.getHTSResponseCode(airdropTx2.hash)).to.equal('364'); // PENDING_NFT_AIRDROP_ALREADY_EXISTS
  });

  it('should fail to airdrop a token to themselves', async function () {
    const ftAmount = BigInt(1);
    const sender = signers[0].address;
    const tokenAddress = await utils.setupToken(
        tokenCreateContract,
        owner,
        contractAddresses
    );

    const airdropTx = await airdropContract.tokenAirdrop(
        tokenAddress,
        sender,
        sender,
        ftAmount,
        {
          value: Constants.ONE_HBAR,
          ...Constants.GAS_LIMIT_2_000_000
        }
    );

    await expect(airdropTx.wait()).to.be.rejectedWith('transaction execution reverted');
    expect(await Utils.getHTSResponseCode(airdropTx.hash)).to.equal('74'); // ACCOUNT_REPEATED_IN_ACCOUNT_AMOUNTS
  });

  it('should fail to delete contract if there is pending airdrop', async function () {
    const sampleContractFactory = await ethers.getContractFactory('Sample');
    const sampleContract = await sampleContractFactory.deploy();
    await sampleContract.waitForDeployment();

    const ftAmount = BigInt(5);
    const sender = signers[0].address;
    const tokenAddress = await utils.setupToken(
        tokenCreateContract,
        owner,
        contractAddresses
    );

    const airdropTx = await airdropContract.tokenAirdrop(
        tokenAddress,
        sender,
        sampleContract.target,
        ftAmount,
        {
          value: Constants.ONE_HBAR,
          ...Constants.GAS_LIMIT_2_000_000
        }
    );
    await airdropTx.wait();

    const deleteTx = await sampleContract.selfDestructSample();

    await expect(deleteTx.wait()).to.be.rejectedWith('reverted');
    const cr = await Utils.getContractResultFromMN(deleteTx.hash);
    expect(cr.error_message).to.equal('CONTRACT_STILL_OWNS_NFTS');
  });

  it('should fail to airdrop Number.MAX_SAFE_INTEGER + 1 tokens', async function () {
    const tokenAddress = await utils.setupToken(
        tokenCreateContract,
        owner,
        contractAddresses
    );

    await expect(airdropContract.tokenAirdrop(
        tokenAddress,
        signers[0].address,
        receiver.address,
        Number.MAX_SAFE_INTEGER + 1,
        {
          value: Constants.ONE_HBAR,
          ...Constants.GAS_LIMIT_2_000_000
        }
    )).to.be.rejectedWith('overflow');
  });
});
