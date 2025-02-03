/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2025 Hedera Hashgraph, LLC
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
const utils = require('../utils');
const Constants = require('../../../constants');
const { Contract } = require('ethers');

describe('HIP904 IHRC904Facade ContractTest Suite', function () {
  let airdropContract;
  let tokenAddress;
  let nftTokenAddress;
  let tokenCreateContract;
  let signers;
  let owner;
  let receiver;
  let receiverPrivateKey;
  const invalidAddress = '0x000000000000000000000000000000000000dead';
  let walletIHRC904TokenFacadeSender;
  let walletIHRC904AccountFacade;
  let walletIHRC904NftFacadeSender;
  let walletIHRC904TokenFacadeReceiver;
  let walletIHRC904NftFacadeReceiver;
  let erc20Contract;
  let erc721Contract;
  let contractAddresses;

  before(async function () {
    signers = await ethers.getSigners();
    airdropContract = await utils.deployContract(Constants.Contract.Airdrop);
    tokenCreateContract = await utils.deployContract(
      Constants.Contract.TokenCreateContract
    );
    owner = signers[0].address;
    receiverPrivateKey = ethers.hexlify(ethers.randomBytes(32));
    receiver = new ethers.Wallet(receiverPrivateKey).connect(ethers.provider);
    invalidSender = ethers.Wallet.createRandom().connect(ethers.provider);

    // Send some HBAR to activate the account
    await signers[0].sendTransaction({
      to: receiver.address,
      value: ethers.parseEther('100'),
    });

    erc20Contract = await utils.deployContract(
      Constants.Contract.ERC20Contract
    );
    erc721Contract = await utils.deployContract(
      Constants.Contract.ERC721Contract
    );

    await utils.updateAccountKeysViaHapi([
      await airdropContract.getAddress(),
      await tokenCreateContract.getAddress(),
    ]);

    contractAddresses = [
      await airdropContract.getAddress(),
      await tokenCreateContract.getAddress(),
    ];

    tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses
    );
    nftTokenAddress = await utils.setupNft(
      tokenCreateContract,
      owner,
      contractAddresses
    );

    const IHRC904AccountFacade = new ethers.Interface(
      (await hre.artifacts.readArtifact('IHRC904AccountFacade')).abi
    );

    walletIHRC904AccountFacade = new Contract(
      receiver.address,
      IHRC904AccountFacade,
      receiver
    );

    const IHRC904TokenFacade = new ethers.Interface(
      (await hre.artifacts.readArtifact('IHRC904TokenFacade')).abi
    );

    walletIHRC904TokenFacadeSender = new Contract(
      tokenAddress,
      IHRC904TokenFacade,
      signers[0]
    );

    walletIHRC904NftFacadeSender = new Contract(
      nftTokenAddress,
      IHRC904TokenFacade,
      signers[0]
    );

    walletIHRC904TokenFacadeReceiver = new Contract(
      tokenAddress,
      IHRC904TokenFacade,
      receiver
    );

    walletIHRC904NftFacadeReceiver = new Contract(
      nftTokenAddress,
      IHRC904TokenFacade,
      receiver
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
  });

  // Positive tests
  it('should cancel a pending airdrop for a fungible token (FT)', async function () {
    const initialBalance = await erc20Contract.balanceOf(
      tokenAddress,
      receiver.address
    );

    const airdrop = await airdropContract.tokenAirdrop(
      tokenAddress,
      owner,
      receiver.address,
      BigInt(1),
      {
        value: Constants.ONE_HBAR,
        gasLimit: 2_000_000,
      }
    );
    await airdrop.wait();
    const tx = await walletIHRC904TokenFacadeSender.cancelAirdropFT(
      receiver.address
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('22');

    const finalBalance = await erc20Contract.balanceOf(
      tokenAddress,
      receiver.address
    );
    expect(finalBalance).to.equal(initialBalance);
  });

  it('should cancel a pending airdrop for a non-fungible token (NFT)', async function () {
    const mintedTokenSerialNumber = await utils.mintNFTToAddress(
      tokenCreateContract,
      nftTokenAddress
    );

    const airdrop = await airdropContract.nftAirdrop(
      nftTokenAddress,
      owner,
      receiver.address,
      mintedTokenSerialNumber,
      {
        value: Constants.ONE_HBAR,
        gasLimit: 2_000_000,
      }
    );
    await airdrop.wait();

    const tx = await walletIHRC904NftFacadeSender.cancelAirdropNFT(
      receiver.address,
      mintedTokenSerialNumber
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('22');

    const finalOwner = await erc721Contract.ownerOf(
      nftTokenAddress,
      mintedTokenSerialNumber
    );
    expect(finalOwner).to.not.equal(receiver.address);
  });

  it('should enable unlimited automatic associations for an account', async function () {
    const tx =
      await walletIHRC904AccountFacade.setUnlimitedAutomaticAssociations(true, {
        gasLimit: 2_000_000,
      });
    const responseCode = await utils.getHASResponseCode(tx.hash);
    expect(responseCode).to.eq('22');

    const maxAssociations = await utils.getMaxAutomaticTokenAssociations(
      receiver.address
    );
    expect(maxAssociations).to.eq(-1);
  });

  it('should disable unlimited automatic associations for an account', async function () {
    const tx =
      await walletIHRC904AccountFacade.setUnlimitedAutomaticAssociations(
        false,
        {
          gasLimit: 2_000_000,
        }
      );
    const responseCode = await utils.getHASResponseCode(tx.hash);
    expect(responseCode).to.eq('22');

    const maxAssociations = await utils.getMaxAutomaticTokenAssociations(
      receiver.address
    );
    expect(maxAssociations).to.eq(0);
  });

  it('should claim a pending airdrop for a fungible token (FT)', async function () {
    const initialBalance = await erc20Contract.balanceOf(
      tokenAddress,
      receiver.address
    );
    const amount = BigInt(1);

    const airdrop = await airdropContract.tokenAirdrop(
      tokenAddress,
      owner,
      receiver.address,
      amount,
      {
        value: Constants.ONE_HBAR,
        gasLimit: 2_000_000,
      }
    );
    await airdrop.wait();
    await utils.associateWithSigner(receiverPrivateKey, tokenAddress);

    const tx = await walletIHRC904TokenFacadeReceiver.claimAirdropFT(owner);
    await tx.wait();

    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('22');

    const finalBalance = await erc20Contract.balanceOf(
      tokenAddress,
      receiver.address
    );
    expect(finalBalance).to.equal(initialBalance + amount);
  });

  it('should claim a pending airdrop for a non-fungible token (NFT)', async function () {
    const mintedTokenSerialNumber = await utils.mintNFTToAddress(
      tokenCreateContract,
      nftTokenAddress
    );
    const airdrop = await airdropContract.nftAirdrop(
      nftTokenAddress,
      owner,
      receiver.address,
      mintedTokenSerialNumber,
      {
        value: Constants.ONE_HBAR,
        gasLimit: 2_000_000,
      }
    );
    await airdrop.wait();

    const tx = await walletIHRC904NftFacadeReceiver.claimAirdropNFT(
      owner,
      mintedTokenSerialNumber
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('22');

    const finalOwner = await erc721Contract.ownerOf(
      nftTokenAddress,
      mintedTokenSerialNumber
    );
    expect(finalOwner).to.equal(receiver.address);
  });

  it('should reject tokens for a given account (FT)', async function () {
    const airdrop = await airdropContract.tokenAirdrop(
      tokenAddress,
      owner,
      receiver.address,
      BigInt(1),
      {
        value: Constants.ONE_HBAR,
        gasLimit: 2_000_000,
      }
    );
    await airdrop.wait();
    const tx = await walletIHRC904TokenFacadeReceiver.rejectTokenFT();
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('22');
  });

  it('should reject tokens for a given account and serial number (NFT)', async function () {
    const nftTokenAddress = await utils.setupNft(
      tokenCreateContract,
      owner,
      contractAddresses
    );
    const mintedTokenSerialNumber = await utils.mintNFTToAddress(
      tokenCreateContract,
      nftTokenAddress
    );
    const airdrop = await airdropContract.nftAirdrop(
      nftTokenAddress,
      owner,
      signers[1].address,
      mintedTokenSerialNumber,
      {
        value: Constants.ONE_HBAR,
        gasLimit: 2_000_000,
      }
    );
    await airdrop.wait();

    const IHRC904TokenFacade = new ethers.Interface(
      (await hre.artifacts.readArtifact('IHRC904TokenFacade')).abi
    );
    let walletIHRC904NftFacadeReceiver = new Contract(
      nftTokenAddress,
      IHRC904TokenFacade,
      signers[1]
    );

    await walletIHRC904NftFacadeReceiver.claimAirdropNFT(
      owner,
      mintedTokenSerialNumber
    );

    const tx = await walletIHRC904NftFacadeReceiver.rejectTokenNFTs([
      mintedTokenSerialNumber,
    ]);

    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('22');
  });

  it('should reject 10 tokens for a given account and serial number (NFT)', async function () {
    const nftTokenAddress = await utils.setupNft(
      tokenCreateContract,
      owner,
      contractAddresses
    );
    let serialNumbers = [];
    for (let i = 0; i < 10; i++) {
      serialNumbers.push(
        await utils.mintNFTToAddress(tokenCreateContract, nftTokenAddress)
      );
    }
    serialNumbers = serialNumbers.map(BigInt);

    for (let serialNumber of serialNumbers) {
      const airdrop = await airdropContract.nftAirdrop(
        nftTokenAddress,
        owner,
        signers[1].address,
        serialNumber,
        {
          value: Constants.ONE_HBAR,
          gasLimit: 2_000_000,
        }
      );
      await airdrop.wait();
    }

    const IHRC904TokenFacade = new ethers.Interface(
      (await hre.artifacts.readArtifact('IHRC904TokenFacade')).abi
    );
    let walletIHRC904NftFacadeReceiver = new Contract(
      nftTokenAddress,
      IHRC904TokenFacade,
      signers[1]
    );

    for (let serialNumber of serialNumbers) {
      await walletIHRC904NftFacadeReceiver.claimAirdropNFT(owner, serialNumber);
    }

    const tx =
      await walletIHRC904NftFacadeReceiver.rejectTokenNFTs(serialNumbers);
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('22');
  });

  // Negative tests
  it('should fail to cancel a pending airdrop for FT when sender has no pending airdrops', async function () {
    const tx = await walletIHRC904TokenFacadeSender.cancelAirdropFT(
      receiver.address
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('367'); // INVALID_PENDING_AIRDROP_ID code
  });

  it('should fail to cancel a pending airdrop for FT when receiver has no valid account', async function () {
    const tx =
      await walletIHRC904TokenFacadeSender.cancelAirdropFT(invalidAddress);
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('367'); // INVALID_PENDING_AIRDROP_ID code
  });

  it('should fail to cancel a pending airdrop for NFT when sender has no pending airdrops', async function () {
    const mintedTokenSerialNumber = await utils.mintNFTToAddress(
      tokenCreateContract,
      nftTokenAddress
    );
    const tx = await walletIHRC904NftFacadeSender.cancelAirdropNFT(
      signers[2].address,
      mintedTokenSerialNumber
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('367'); // INVALID_PENDING_AIRDROP_ID code
  });

  it('should fail to cancel a pending airdrop for NFT when receiver has no valid account', async function () {
    const mintedTokenSerialNumber = await utils.mintNFTToAddress(
      tokenCreateContract,
      nftTokenAddress
    );
    const tx = await walletIHRC904NftFacadeSender.cancelAirdropNFT(
      invalidAddress,
      mintedTokenSerialNumber
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('367'); // INVALID_PENDING_AIRDROP_ID code
  });

  it('should fail to claim FT airdrop with no pending airdrops', async function () {
    const tx = await walletIHRC904TokenFacadeReceiver.claimAirdropFT(owner);
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('367'); // INVALID_PENDING_AIRDROP_ID code
  });

  it('should fail to claim FT airdrop with an invalid account', async function () {
    const tx =
      await walletIHRC904TokenFacadeReceiver.claimAirdropFT(invalidAddress);
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('367'); // INVALID_PENDING_AIRDROP_ID code
  });

  it('should fail to claim NFT airdrop with no pending airdrops', async function () {
    const mintedTokenSerialNumber = await utils.mintNFTToAddress(
      tokenCreateContract,
      nftTokenAddress
    );
    const tx = await walletIHRC904NftFacadeReceiver.claimAirdropNFT(
      owner,
      mintedTokenSerialNumber
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('367'); // INVALID_PENDING_AIRDROP_ID code
  });

  it('should fail to claim NFT airdrop with an invalid account', async function () {
    const mintedTokenSerialNumber = await utils.mintNFTToAddress(
      tokenCreateContract,
      nftTokenAddress
    );
    const tx = await walletIHRC904NftFacadeReceiver.claimAirdropNFT(
      invalidAddress,
      mintedTokenSerialNumber
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('367'); // INVALID_PENDING_AIRDROP_ID code
  });

  it('should fail to reject FT tokens with no tokens', async function () {
    const tx = await walletIHRC904TokenFacadeReceiver.rejectTokenFT();
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('178'); // INSUFFICIENT_TOKEN_BALANCE code
  });

  it('should fail to reject FT tokens with an invalid account', async function () {
    // Trying to reject FT tokens with the treasury account
    const tx = await walletIHRC904TokenFacadeSender.rejectTokenFT();
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('196'); // ACCOUNT_IS_TREASURY code
  });

  it('should fail to reject NFT tokens with no tokens', async function () {
    const nftTokenAddress = await utils.setupNft(
      tokenCreateContract,
      owner,
      contractAddresses
    );
    const mintedTokenSerialNumber = await utils.mintNFTToAddress(
      tokenCreateContract,
      nftTokenAddress
    );

    const IHRC904TokenFacade = new ethers.Interface(
      (await hre.artifacts.readArtifact('IHRC904TokenFacade')).abi
    );
    let walletIHRC904NftFacadeReceiver = new Contract(
      nftTokenAddress,
      IHRC904TokenFacade,
      signers[1]
    );

    const tx = await walletIHRC904NftFacadeReceiver.rejectTokenNFTs([
      mintedTokenSerialNumber,
    ]);
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('354'); // INVALID_OWNER_ID code
  });

  // TODO: The following test is skipped because it is not supported by the current implementation in services
  // It does not return the correct error code and we can currently only check if it reverts
  // therefore it will be skipped until the implementation is updated
  // https://github.com/hashgraph/hedera-services/issues/17534
  it.skip('should revert when trying to reject NFT tokens when 11 or more serials are provided', async function () {
    let serialNumbers = [];
    for (let i = 0; i < 11; i++) {
      serialNumbers.push(
        await utils.mintNFT(tokenCreateContract, nftTokenAddress)
      );
    }

    await expect(walletIHRC904NftFacadeReceiver.rejectTokenNFTs(serialNumbers))
      .to.be.reverted;
  });
});
