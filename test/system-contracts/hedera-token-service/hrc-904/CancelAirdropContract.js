const { expect } = require('chai');
const { ethers } = require('hardhat');
const utils = require('../utils');
const Constants = require('../../../constants');

describe('HIP904 CancelAirdropContract Test Suite', function () {
  let airdropContract;
  let cancelAirdropContract;
  let tokenCreateContract;
  let erc20Contract;
  let erc721Contract;
  let signers;
  let owner;
  let accounts;
  let receiver;
  let walletIHRC904AccountFacade;

  async function setupToken() {
    const tokenAddress =
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
      false
    );

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

  async function createPendingAirdrops(count) {
    const senders = [];
    const receivers = [];
    const tokens = [];
    const serials = [];
    const amounts = [];

    for (let i = 0; i < count; i++) {
      const tokenAddress = await setupToken();
      const ftAmount = BigInt(i + 1); // Different amount for each airdrop

      const airdropTx = await airdropContract.tokenAirdrop(
        tokenAddress,
        owner,
        receiver,
        ftAmount,
        {
          value: BigInt('850000000000000000'),
          gasLimit: 2_000_000,
        }
      );
      await airdropTx.wait();

      senders.push(owner);
      receivers.push(receiver);
      tokens.push(tokenAddress);
      serials.push(0); // 0 for fungible tokens
      amounts.push(ftAmount);
    }

    return { senders, receivers, tokens, serials, amounts };
  }

  before(async function () {
    signers = await ethers.getSigners();
    airdropContract = await utils.deployContract(Constants.Contract.Airdrop);
    cancelAirdropContract = await utils.deployContract(
      Constants.Contract.CancelAirdrop
    );

    receiver = new ethers.Wallet(
      ethers.hexlify(ethers.randomBytes(32))
    ).connect(ethers.provider);

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
    accounts = signers.slice(1, 3).map((s) => s.address);

    await utils.updateAccountKeysViaHapi([
      await airdropContract.getAddress(),
      await tokenCreateContract.getAddress(),
      await cancelAirdropContract.getAddress(),
    ]);

    tokenAddress = await setupToken();

    const IHRC904AccountFacade = new ethers.Interface(
      (await hre.artifacts.readArtifact('IHRC904AccountFacade')).abi
    );

    walletIHRC904AccountFacade = new ethers.Contract(
      receiver.address,
      IHRC904AccountFacade,
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

  it('should cancel a single pending fungible token airdrop', async function () {
    const ftAmount = BigInt(1);
    const sender = signers[0].address;
    const tokenAddress = await setupToken();

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
        value: BigInt('850000000000000000'),
        gasLimit: 2_000_000,
      }
    );
    await airdropTx.wait();

    const cancelTx = await cancelAirdropContract.cancelAirdrop(
      sender,
      receiver.address,
      tokenAddress,
      Constants.GAS_LIMIT_2_000_000
    );
    await cancelTx.wait();

    const updatedBalance = await erc20Contract.balanceOf(
      tokenAddress,
      receiver.address
    );
    expect(updatedBalance).to.equal(initialBalance);
  });

  it('should cancel a single pending NFT airdrop', async function () {
    const sender = signers[0].address;
    const nftTokenAddress = await setupNft();

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
        value: BigInt('850000000000000000'),
        gasLimit: 2_000_000,
      }
    );
    await airdropTx.wait();

    const cancelTx = await cancelAirdropContract.cancelNFTAirdrop(
      sender,
      receiver.address,
      nftTokenAddress,
      serialNumber,
      Constants.GAS_LIMIT_2_000_000
    );
    await cancelTx.wait();

    const nftOwner = await erc721Contract.ownerOf(
      nftTokenAddress,
      serialNumber
    );
    expect(nftOwner).to.equal(sender);
  });

  it('should cancel multiple pending fungible token airdrops', async function () {
    const numAirdrops = 10;
    const { senders, receivers, tokens, serials, amounts } =
      await createPendingAirdrops(numAirdrops);

    const initialBalances = await Promise.all(
      tokens.map(async (token) => erc20Contract.balanceOf(token, receiver))
    );

    const cancelTx = await cancelAirdropContract.cancelMultipleAirdrops(
      senders,
      receivers,
      tokens,
      serials,
      Constants.GAS_LIMIT_2_000_000
    );
    await cancelTx.wait();

    for (let i = 0; i < tokens.length; i++) {
      const updatedBalance = await erc20Contract.balanceOf(tokens[i], receiver);
      expect(updatedBalance).to.equal(initialBalances[i]);
    }
  });

  it('should fail when sender has no pending airdrops', async function () {
    const sender = signers[1].address;
    const tokenAddress = await setupToken();

    const tx = await cancelAirdropContract.cancelAirdrop(
      sender,
      receiver,
      tokenAddress,
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('367'); // NO_PENDING_REWARD code
  });

  it('should fail when sender account is invalid', async function () {
    const invalidSender = ethers.Wallet.createRandom().address;
    const tokenAddress = await setupToken();

    const tx = await cancelAirdropContract.cancelAirdrop(
      invalidSender,
      receiver,
      tokenAddress,
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('15'); // INVALID_ACCOUNT_ID code
  });

  it('should fail when receiver account is invalid', async function () {
    const invalidReceiver = ethers.Wallet.createRandom().address;
    const tokenAddress = await setupToken();

    const tx = await cancelAirdropContract.cancelAirdrop(
      owner,
      invalidReceiver,
      tokenAddress,
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('367'); // INVALID_PENDING_AIRDROP_ID code
  });

  it('should fail when token does not exist', async function () {
    const invalidToken = ethers.Wallet.createRandom().address;

    try {
      const tx = await cancelAirdropContract.cancelAirdrop(
        owner,
        receiver,
        invalidToken,
        Constants.GAS_LIMIT_2_000_000
      );
      await tx.wait();
      expect.fail('Should revert');
    } catch (error) {
      expect(error.shortMessage).to.eq('transaction execution reverted');
    }
  });

  it('should fail when NFT does not exist', async function () {
    const invalidNftToken = ethers.Wallet.createRandom().address;
    const serialNumber = 1;

    try {
      const tx = await cancelAirdropContract.cancelNFTAirdrop(
        owner,
        receiver,
        invalidNftToken,
        serialNumber,
        Constants.GAS_LIMIT_2_000_000
      );
      await tx.wait();
      expect.fail('Should revert');
    } catch (error) {
      expect(error.shortMessage).to.eq('transaction execution reverted');
    }
  });

  it('should fail when more than 10 pending airdrops provided', async function () {
    try {
      const { senders, receivers, tokens, serials } =
        await createPendingAirdrops(11);

      const tx = await cancelAirdropContract.cancelMultipleAirdrops(
        senders,
        receivers,
        tokens,
        serials,
        Constants.GAS_LIMIT_2_000_000
      );
      await tx.wait();
      expect.fail('Should revert');
    } catch (error) {
      expect(error.shortMessage).to.eq('transaction execution reverted');
    }
  });

  it('should fail when NFT serial number does not exist', async function () {
    const nftTokenAddress = await setupNft();
    const invalidSerialNumber = 999;

    const tx = await cancelAirdropContract.cancelNFTAirdrop(
      owner,
      receiver,
      nftTokenAddress,
      invalidSerialNumber,
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('367'); // INVALID_PENDING_AIRDROP_ID code
  });
});
