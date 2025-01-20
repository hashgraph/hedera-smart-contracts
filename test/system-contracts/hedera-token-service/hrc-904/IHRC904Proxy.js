const { expect } = require('chai');
const { ethers } = require('hardhat');
const utils = require('../utils');
const Constants = require('../../../constants');
const { Contract } = require('ethers');

describe('HIP904 IHRC904 Proxy Methods Test Suite', function () {
  let airdropContract;
  let tokenAddress;
  let nftTokenAddress;
  let tokenCreateContract;
  let signers;
  let owner;
  let receiver;
  const invalidAddress = '0x000000000000000000000000000000000000dead';
  let walletIHRC904TokenFacadeSender;
  let walletIHRC904AccountFacade;
  let walletIHRC904NftFacadeSender;
  let walletIHRC904TokenFacadeReceiver;
  let walletIHRC904NftFacadeReceiver;
  let contractAddresses;

  async function setupNft() {
    const nftTokenAddress =
      await utils.createNonFungibleTokenWithSECP256K1AdminKeyWithoutKYC(
        tokenCreateContract,
        owner,
        utils.getSignerCompressedPublicKey()
      );

    await utils.updateTokenKeysViaHapi(
      nftTokenAddress,
      contractAddresses,
      true,
      true,
      false,
      true,
      true,
      true,
      false
    );

    await utils.associateToken(
      tokenCreateContract,
      nftTokenAddress,
      Constants.Contract.TokenCreateContract
    );

    return nftTokenAddress;
  }

  before(async function () {
    signers = await ethers.getSigners();
    airdropContract = await utils.deployContract(Constants.Contract.Airdrop);
    tokenCreateContract = await utils.deployContract(
      Constants.Contract.TokenCreateContract
    );
    owner = signers[0].address;
    receiver = new ethers.Wallet(
      ethers.hexlify(ethers.randomBytes(32))
    ).connect(ethers.provider);

    invalidSender = new ethers.Wallet(
      ethers.hexlify(ethers.randomBytes(32))
    ).connect(ethers.provider);

    // Send some HBAR to activate the account
    await signers[0].sendTransaction({
      to: receiver.address,
      value: ethers.parseEther('100'),
    });

    await utils.updateAccountKeysViaHapi([
      await airdropContract.getAddress(),
      await tokenCreateContract.getAddress(),
    ]);

    tokenAddress =
      await utils.createFungibleTokenWithSECP256K1AdminKeyWithoutKYC(
        tokenCreateContract,
        owner,
        utils.getSignerCompressedPublicKey()
      );

    await utils.updateTokenKeysViaHapi(
      tokenAddress,
      [
        await airdropContract.getAddress(),
        await tokenCreateContract.getAddress(),
      ],
      true,
      true,
      false,
      true,
      true,
      true,
      true,
      true
    );

    await utils.associateToken(
      tokenCreateContract,
      tokenAddress,
      Constants.Contract.TokenCreateContract
    );

    contractAddresses = [
      await airdropContract.getAddress(),
      await tokenCreateContract.getAddress(),
    ];

    nftTokenAddress = await setupNft();

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
    const airdrop = await airdropContract.tokenAirdrop(
      tokenAddress,
      owner,
      receiver.address,
      BigInt(1),
      {
        value: BigInt('850000000000000000'),
        gasLimit: 2_000_000,
      }
    );
    await airdrop.wait();
    const tx = await walletIHRC904TokenFacadeSender.cancelAirdropFT(
      receiver.address
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('22');
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
        value: BigInt('850000000000000000'),
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
  });

  it('should enable unlimited automatic associations for an account', async function () {
    const tx =
      await walletIHRC904AccountFacade.setUnlimitedAutomaticAssociations(
        false,
        {
          gasLimit: 2_000_000,
        }
      );
    const responseCode = await utils.getHASResponseCode(tx.hash);
    expect(responseCode).to.eq('22');
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
  });

  it('should claim a pending airdrop for a fungible token (FT)', async function () {
    const airdrop = await airdropContract.tokenAirdrop(
      tokenAddress,
      owner,
      receiver.address,
      BigInt(1),
      {
        value: BigInt('850000000000000000'),
        gasLimit: 2_000_000,
      }
    );
    await airdrop.wait();

    const tx = await walletIHRC904TokenFacadeReceiver.claimAirdropFT(owner);
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('22');
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
        value: BigInt('850000000000000000'),
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
  });

  it('should reject tokens for a given account (FT)', async function () {
    const airdrop = await airdropContract.tokenAirdrop(
      tokenAddress,
      owner,
      receiver.address,
      BigInt(1),
      {
        value: BigInt('850000000000000000'),
        gasLimit: 2_000_000,
      }
    );
    await airdrop.wait();
    const tx = await walletIHRC904TokenFacadeReceiver.rejectTokenFT();
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('22');
  });

  it('should reject tokens for a given account and serial number (NFT)', async function () {
    const nftTokenAddress = await setupNft();
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
        value: BigInt('850000000000000000'),
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
    const nftTokenAddress = await setupNft();
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
          value: BigInt('850000000000000000'),
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
    expect(responseCode).to.eq('367');
  });

  it('should fail to cancel a pending airdrop for FT when receiver has no valid account', async function () {
    const tx =
      await walletIHRC904TokenFacadeSender.cancelAirdropFT(invalidAddress);
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('367');
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
    expect(responseCode).to.eq('367');
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
    expect(responseCode).to.eq('367');
  });

  it('should fail to claim FT airdrop with no pending airdrops', async function () {
    const tx = await walletIHRC904TokenFacadeReceiver.claimAirdropFT(owner);
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('367');
  });

  it('should fail to claim FT airdrop with an invalid account', async function () {
    const tx =
      await walletIHRC904TokenFacadeReceiver.claimAirdropFT(invalidAddress);
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('367');
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
    expect(responseCode).to.eq('367');
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
    expect(responseCode).to.eq('367');
  });

  it('should fail to reject FT tokens with no tokens', async function () {
    const tx = await walletIHRC904TokenFacadeReceiver.rejectTokenFT();
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('178');
  });

  it('should fail to reject FT tokens with an invalid account', async function () {
    // Trying to reject FT tokens with the treasury account
    const tx = await walletIHRC904TokenFacadeSender.rejectTokenFT();
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('196');
  });

  it('should fail to reject NFT tokens with no tokens', async function () {
    const nftTokenAddress = await setupNft();
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
    expect(responseCode).to.eq('354');
  });

  it('should revert when trying to reject NFT tokens when 11 or more serials are provided', async function () {
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
