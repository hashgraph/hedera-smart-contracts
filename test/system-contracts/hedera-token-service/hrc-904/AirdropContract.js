const { expect } = require('chai');
const { ethers } = require('hardhat');
const utils = require('../utils');
const Constants = require('../../../constants');

describe('AirdropContract Test Suite', function () {
  let airdropContract;
  let tokenCreateContract;
  let erc20Contract;
  let erc721Contract;
  let tokenAddress;
  let nftTokenAddress;
  let signers;
  let owner;

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
    airdropContract = await utils.deployAirdropContract();
    tokenCreateContract = await utils.deployTokenCreateContract();
    erc20Contract = await utils.deployERC20Contract();
    erc721Contract = await utils.deployERC721Contract();
    owner = signers[0].address;

    await utils.updateAccountKeysViaHapi([
      await airdropContract.getAddress(),
      await tokenCreateContract.getAddress(),
    ]);

    tokenAddress = await setupToken();
    nftTokenAddress = await setupNft();
  });

  it('should airdrop fungible tokens (FT) to multiple accounts', async function () {
    const ftAmount = BigInt(1);
    const accounts = signers.slice(1, 3).map((s) => s.address);

    const getBalances = async () =>
      Promise.all(
        accounts.map((account) =>
          erc20Contract.balanceOf(tokenAddress, account)
        )
      );

    const initialBalances = await getBalances();

    const tx = await airdropContract.tokenAirdropDistribute(
      tokenAddress,
      owner,
      accounts,
      ftAmount,
      {
        gasLimit: 5_000_000,
      }
    );
    await tx.wait();

    const updatedBalances = await getBalances();

    updatedBalances.forEach((balance, index) => {
      expect(balance).to.equal(initialBalances[index] + ftAmount);
    });
  });

  it('should airdrop non-fungible tokens (NFT) to multiple accounts', async function () {
    const accounts = signers.slice(1, 3).map((s) => s.address);

    const serial = await utils.mintNFTToAddress(
      tokenCreateContract,
      nftTokenAddress
    );

    const serial2 = await utils.mintNFTToAddress(
      tokenCreateContract,
      nftTokenAddress
    );

    const txNFT = await airdropContract.nftAirdrop(
      nftTokenAddress,
      owner,
      accounts[0],
      serial,
      {
        gasLimit: 5_000_000,
      }
    );
    const txNFT2 = await airdropContract.nftAirdrop(
      nftTokenAddress,
      owner,
      accounts[1],
      serial2,
      {
        gasLimit: 5_000_000,
      }
    );
    await txNFT.wait();
    await txNFT2.wait();

    const updatedNFTBalances = await Promise.all([
      erc721Contract.ownerOf(nftTokenAddress, serial).catch(() => null),
      erc721Contract.ownerOf(nftTokenAddress, serial2).catch(() => null),
    ]);

    for (let i = 0; i < accounts.length; i++) {
      expect(updatedNFTBalances[i]).to.equal(accounts[i]);
    }
  });

  // it('should airdrop 10 tokens to multiple accounts', async function () {
  //   const ftAmount = BigInt(1);
  //   const tokens = [];
  //   for (let i = 0; i < 10; i++) {
  //     tokens.push(await setupToken());
  //   }
  //   const accounts = signers.slice(1, 3).map((s) => s.address);
  //   for (let i = 0; i < accounts.length; i++) {
  //     const tx = await airdropContract.tokenNAmountAirdrops(
  //       tokens,
  //       owner,
  //       accounts[i],
  //       ftAmount,
  //       {
  //         gasLimit: 15_000_000,
  //       }
  //     );
  //     await tx.wait();
  //     for (let j = 0; j < tokens.length; j++) {
  //       const balance = await erc20Contract.balanceOf(tokens[j], accounts[i]);
  //       expect(balance).to.equal(ftAmount);
  //     }
  //   }
  // });

  it('should airdrop 10 NFTs to multiple accounts', async function () {
    const accounts = signers.slice(1, 3).map((s) => s.address);

    async function createNFTs(count) {
      const tokens = [];
      const serials = [];
      for (let i = 0; i < count; i++) {
        const tokenAddress = await setupNft();
        const serial = await utils.mintNFTToAddress(
          tokenCreateContract,
          tokenAddress
        );
        tokens.push(tokenAddress);
        serials.push(serial);
      }
      return { tokens, serials };
    }

    async function performAirdropAndValidate(receiver, nftTokens, nftSerials) {
      const tx = await airdropContract.nftNAmountAirdrops(
        nftTokens,
        owner,
        receiver,
        nftSerials,
        {
          gasLimit: 15_000_000,
        }
      );
      await tx.wait();

      for (let i = 0; i < nftTokens.length; i++) {
        const nftOwner = await erc721Contract.ownerOf(
          nftTokens[i],
          nftSerials[i]
        );
        expect(nftOwner).to.equal(receiver);
      }
    }

    // Create and airdrop 10 NFTs to the first account
    const { tokens: nftTokens1, serials: nftSerials1 } = await createNFTs(10);
    await performAirdropAndValidate(accounts[0], nftTokens1, nftSerials1);

    // Create and airdrop 10 NFTs to the second account
    const { tokens: nftTokens2, serials: nftSerials2 } = await createNFTs(10);
    await performAirdropAndValidate(accounts[1], nftTokens2, nftSerials2);
  });

  it('should airdrop a fungible token (FT) to a single account', async function () {
    const ftAmount = BigInt(1);
    const receiver = signers[1].address;
    const tokenAddress = await setupToken();

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

  it('should airdrop a non-fungible token (NFT) to a single account', async function () {
    const receiver = signers[1].address;

    const serial = await utils.mintNFTToAddress(
      tokenCreateContract,
      nftTokenAddress
    );

    const txNFT = await airdropContract.nftAirdrop(
      nftTokenAddress,
      owner,
      receiver,
      serial,
      {
        gasLimit: 5_000_000,
      }
    );
    await txNFT.wait();

    const nftOwner = await erc721Contract
      .ownerOf(nftTokenAddress, serial)
      .catch(() => null);
    expect(nftOwner).to.equal(receiver);
  });

  it('should fail when the sender does not have enough balance', async function () {
    const ftAmount = BigInt(100_000_000_000_000_000);
    const receiver = signers[1].address;

    const tx = await airdropContract.tokenAirdrop(
      tokenAddress,
      signers[2].address,
      receiver,
      ftAmount,
      {
        gasLimit: 2_000_000,
      }
    );
    const responseCode = await utils.getPrecompileResponseCode(tx.hash);
    expect(responseCode).to.eq('178'); // INSUFFICIENT_TOKEN_BALANCE code
  });

  it('should fail when the receiver does not have a valid account', async function () {
    const invalidReceiver = '0x000000000000000000000000000000000000dead';
    const mintedTokenSerialNumber = await utils.mintNFTToAddress(
      tokenCreateContract,
      nftTokenAddress
    );

    const txNFT = await airdropContract.nftAirdrop(
      nftTokenAddress,
      owner,
      invalidReceiver,
      mintedTokenSerialNumber,
      {
        gasLimit: 2_000_000,
      }
    );
    const responseCode = await utils.getPrecompileResponseCode(txNFT.hash);
    expect(responseCode).to.eq('15'); // INVALID_ACCOUNT_ID code
  });

  it('should fail when the token does not exist', async function () {
    const receiver = signers[1].address;
    const invalidToken = '0xdead00000000000000000000000000000000dead';
    const txNFT = await airdropContract.nftAirdrop(
      invalidToken,
      owner,
      receiver,
      1,
      {
        gasLimit: 2_000_000,
      }
    );
    const responseCode = await utils.getPrecompileResponseCode(txNFT.hash);
    expect(responseCode).to.eq('167'); // INVALID_TOKEN_ID code
  });

  it('should fail when the airdrop amounts are out of bounds', async function () {
    const invalidAmount = BigInt(0);
    const receiver = signers[1].address;

    const tx = await airdropContract.tokenAirdrop(
      tokenAddress,
      signers[0].address,
      receiver,
      invalidAmount,
      {
        gasLimit: 2_000_000,
      }
    );
    const responseCode = await utils.getPrecompileResponseCode(tx.hash);
    expect(responseCode).to.eq('50'); // INVALID_TRANSACTION_BODY code
  });

  it('should fail when 11 or more NFT airdrops are provided', async function () {
    try {
      const nftTokens = [];
      const nftSerials = [];
      for (let i = 0; i < 11; i++) {
        const tokenAddress = await setupNft();
        const serial = await utils.mintNFTToAddress(
          tokenCreateContract,
          tokenAddress
        );
        nftTokens.push(tokenAddress);
        nftSerials.push(serial);
      }

      const tx = await airdropContract.nftNAmountAirdrops(
        nftTokens,
        owner,
        signers[1].address,
        nftSerials,
        {
          gasLimit: 15_000_000,
        }
      );
      await tx.wait();
      expect.fail('Should revert');
    } catch (error) {
      expect(error.shortMessage).to.eq('transaction execution reverted');
    }
  });

  it('should fail when 11 or more token airdrops are provided', async function () {
    try {
      const ftAmount = BigInt(1);
      const tokens = [];
      for (let i = 0; i < 10; i++) {
        tokens.push(await setupToken());
      }
      const tx = await airdropContract.tokenNAmountAirdrops(
        tokens,
        owner,
        signers[1].address,
        ftAmount,
        {
          gasLimit: 2_000_000,
        }
      );
      await tx.wait();
      expect.fail('Should revert');
    } catch (error) {
      expect(error.shortMessage).to.eq('transaction execution reverted');
    }
  });
});
