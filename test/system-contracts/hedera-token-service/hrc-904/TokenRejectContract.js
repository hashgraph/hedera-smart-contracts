const { expect } = require('chai');
const { ethers } = require('hardhat');
const utils = require('../utils');
const Constants = require('../../../constants');

describe('HIP904 TokenRejectContract Test Suite', function () {
  let tokenRejectContract;
  let tokenCreateContract;
  let airdropContract;
  let signers;
  let owner;
  let receiver;
  let walletIHRC904AccountFacade;

  async function setupToken() {
    const tokenAddress =
      await utils.createFungibleTokenWithSECP256K1AdminKeyWithoutKYC(
        tokenCreateContract,
        owner,
        utils.getSignerCompressedPublicKey()
      );

    await utils.updateTokenKeysViaHapi(tokenAddress, [
      await airdropContract.getAddress(),
      await tokenCreateContract.getAddress(),
    ]);

    await utils.associateToken(
      tokenCreateContract,
      tokenAddress,
      Constants.Contract.TokenCreateContract
    );

    return tokenAddress;
  }

  async function setupNft() {
    const nftTokenAddress =
      await utils.createNonFungibleTokenWithSECP256K1AdminKeyWithoutKYC(
        tokenCreateContract,
        owner,
        utils.getSignerCompressedPublicKey()
      );

    await utils.updateTokenKeysViaHapi(
      nftTokenAddress,
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
    tokenRejectContract = await utils.deployContract(
      Constants.Contract.TokenReject
    );
    tokenCreateContract = await utils.deployContract(
      Constants.Contract.TokenCreateContract
    );
    airdropContract = await utils.deployContract(Constants.Contract.Airdrop);
    owner = signers[0].address;

    const receiverPrivateKey = ethers.hexlify(ethers.randomBytes(32));
    receiver = new ethers.Wallet(receiverPrivateKey).connect(ethers.provider);

    await signers[0].sendTransaction({
      to: receiver.address,
      value: ethers.parseEther('100'),
    });

    await utils.updateAccountKeysViaHapi([
      await tokenRejectContract.getAddress(),
      await tokenCreateContract.getAddress(),
      await airdropContract.getAddress(),
    ]);

    await utils.updateAccountKeysViaHapi(
      [
        await tokenRejectContract.getAddress(),
        await tokenCreateContract.getAddress(),
        await airdropContract.getAddress(),
      ],
      [receiverPrivateKey]
    );

    const IHRC904AccountFacade = new ethers.Interface(
      (await hre.artifacts.readArtifact('IHRC904AccountFacade')).abi
    );

    walletIHRC904AccountFacade = new ethers.Contract(
      receiver.address,
      IHRC904AccountFacade,
      receiver
    );
  });

  it('should reject tokens for a single account', async function () {
    const tokenAddress = await setupToken();
    const receiver = signers[1];

    const ftAmount = BigInt(1);
    const airdropTx = await airdropContract.tokenAirdrop(
      tokenAddress,
      owner,
      receiver.address,
      ftAmount,
      {
        value: Constants.ONE_HBAR,
        gasLimit: 2_000_000,
      }
    );
    await airdropTx.wait();

    await walletIHRC904AccountFacade.setUnlimitedAutomaticAssociations(true, {
      gasLimit: 2_000_000,
    });

    const tx = await tokenRejectContract.rejectTokens(
      receiver.address,
      [tokenAddress],
      [],
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('22'); // SUCCESS code
  });

  it('should reject NFTs for a single account', async function () {
    const nftTokenAddress = await setupNft();
    const receiver = signers[1];

    const serial = utils.mintNFTToAddress(tokenCreateContract, nftTokenAddress);

    const airdropTx = await airdropContract.nftAirdrop(
      nftTokenAddress,
      owner,
      receiver.address,
      serial,
      {
        value: Constants.ONE_HBAR,
        gasLimit: 2_000_000,
      }
    );
    await airdropTx.wait();

    await walletIHRC904AccountFacade.setUnlimitedAutomaticAssociations(true, {
      gasLimit: 2_000_000,
    });

    const tx = await tokenRejectContract.rejectTokens(
      receiver.address,
      [],
      [nftTokenAddress],
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('22'); // SUCCESS code
  });

  it('should reject tokens for multiple accounts', async function () {
    const tokenAddress = await setupToken();
    const receivers = signers.slice(1, 3);

    for (const receiver of receivers) {
      const airdropTx = await airdropContract.tokenAirdrop(
        tokenAddress,
        owner,
        receiver.address,
        BigInt(1),
        {
          value: Constants.ONE_HBAR,
          gasLimit: 2_000_000,
        }
      );
      await airdropTx.wait();

      const tx = await tokenRejectContract.rejectTokens(
        receiver.address,
        [tokenAddress],
        [],
        Constants.GAS_LIMIT_2_000_000
      );
      const responseCode = await utils.getHTSResponseCode(tx.hash);
      expect(responseCode).to.eq('22'); // SUCCESS code
    }
  });

  it('should fail when sender does not have any associated tokens', async function () {
    const tokenAddress = await setupToken();

    await walletIHRC904AccountFacade.setUnlimitedAutomaticAssociations(false, {
      gasLimit: 2_000_000,
    });

    const airdropTx = await airdropContract.tokenAirdrop(
      tokenAddress,
      owner,
      receiver.address,
      BigInt(1),
      {
        value: Constants.ONE_HBAR,
        gasLimit: 2_000_000,
      }
    );
    await airdropTx.wait();

    const tx = await tokenRejectContract.rejectTokens(
      receiver.address,
      [tokenAddress],
      [],
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('184'); // TOKEN_NOT_ASSOCIATED_TO_ACCOUNT code
  });

  it('should fail when sender does not have a pending airdrop', async function () {
    const tokenAddress = await setupToken();
    const receiver = signers[1];

    const tx = await tokenRejectContract.rejectTokens(
      receiver.address,
      [tokenAddress],
      [],
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('178'); // INSUFFICIENT_TOKEN_BALANCE code
  });

  it('should fail when provided fungible token is invalid', async function () {
    const invalidToken = ethers.Wallet.createRandom().address;
    const nftTokenAddress = await setupNft();

    const tx = await tokenRejectContract.rejectTokens(
      receiver.address,
      [invalidToken],
      [nftTokenAddress],
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('167'); // INVALID_TOKEN_ID code
  });

  it('should fail when provided NFT is invalid', async function () {
    const invalidNft = ethers.Wallet.createRandom().address;

    const nftTokenAddress = await setupNft();
    const receiver = signers[1];

    const serial = utils.mintNFTToAddress(tokenCreateContract, nftTokenAddress);

    const airdropTx = await airdropContract.nftAirdrop(
      nftTokenAddress,
      owner,
      receiver.address,
      serial,
      {
        value: Constants.ONE_HBAR,
        gasLimit: 2_000_000,
      }
    );
    await airdropTx.wait();

    await walletIHRC904AccountFacade.setUnlimitedAutomaticAssociations(true, {
      gasLimit: 2_000_000,
    });

    const tx = await tokenRejectContract.rejectTokens(
      receiver.address,
      [],
      [invalidNft],
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('226'); // INVALID_NFT_ID code
  });
});
