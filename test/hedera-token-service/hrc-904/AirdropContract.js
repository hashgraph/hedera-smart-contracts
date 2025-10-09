// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const { ethers } = require('hardhat');
const utils = require('../utils');
const Constants = require('../../constants');

describe('HIP904Batch1 AirdropContract Test Suite', function () {
  let airdropContract;
  let tokenCreateContract;
  let erc20Contract;
  let erc721Contract;
  let tokenAddress;
  let nftTokenAddress;
  let signers;
  let owner;
  let accounts;
  let contractAddresses;

  before(async function () {
    signers = await ethers.getSigners();
    airdropContract = await utils.deployContract(Constants.Contract.Airdrop);
    tokenCreateContract = await utils.deployContract(
      Constants.Contract.TokenCreateContract
    );
    erc20Contract = await utils.deployContract(
      'ERC20Mock'
    );
    erc721Contract = await utils.deployContract(
      Constants.Contract.ERC721Contract
    );
    owner = signers[0].address;
    accounts = signers.slice(1, 3).map((s) => s.address);

    contractAddresses = [
      await airdropContract.getAddress(),
      await tokenCreateContract.getAddress(),
    ];
    await utils.updateAccountKeysViaHapi(contractAddresses);

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
  });

  it('should airdrop a fungible token (FT) to a single account', async function () {
    const ftAmount = BigInt(1);
    const receiver = signers[1].address;
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses
    );

    const initialBalance = await erc20Contract.balanceOf(
      tokenAddress,
      receiver
    );

    const tx = await airdropContract.tokenAirdrop(
      tokenAddress,
      signers[0].address,
      receiver,
      ftAmount,
      Constants.GAS_LIMIT_2_000_000
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
      Constants.GAS_LIMIT_5_000_000
    );
    await txNFT.wait();

    const nftOwner = await erc721Contract.ownerOf(nftTokenAddress, serial);
    expect(nftOwner).to.equal(receiver);
  });

  it('should airdrop fungible token (FT) to a single account using distribute', async function () {
    const ftAmount = BigInt(1);
    const receiver = signers[1].address;
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses
    );

    const initialBalance = await erc20Contract.balanceOf(
      tokenAddress,
      receiver
    );

    const tx = await airdropContract.tokenAirdropDistribute(
      tokenAddress,
      owner,
      [receiver],
      ftAmount,
      Constants.GAS_LIMIT_5_000_000
    );
    await tx.wait();

    const updatedBalance = await erc20Contract.balanceOf(
      tokenAddress,
      receiver
    );
    expect(updatedBalance).to.equal(initialBalance + ftAmount);
  });

  it('should airdrop fungible tokens (FT) to multiple accounts', async function () {
    const ftAmount = BigInt(1);
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses
    );

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
      Constants.GAS_LIMIT_5_000_000
    );
    await tx.wait();

    const updatedBalances = await getBalances();

    updatedBalances.forEach((balance, index) => {
      expect(balance).to.equal(initialBalances[index] + ftAmount);
    });
  });

  it('should airdrop non-fungible token (NFT) to a single account using distribute', async function () {
    const receiver = signers[1].address;
    const serial = await utils.mintNFTToAddress(
      tokenCreateContract,
      nftTokenAddress
    );

    const txNFT = await airdropContract.nftAirdropDistribute(
      nftTokenAddress,
      owner,
      [receiver],
      [serial],
      Constants.GAS_LIMIT_5_000_000
    );
    await txNFT.wait();

    const nftOwner = await erc721Contract.ownerOf(nftTokenAddress, serial);
    expect(nftOwner).to.equal(receiver);
  });

  it('should airdrop non-fungible tokens (NFT) to multiple accounts', async function () {
    const nftTokenAddress = await utils.setupNft(
      tokenCreateContract,
      owner,
      contractAddresses
    );
    const serials = [];
    serials.push(
      await utils.mintNFTToAddress(tokenCreateContract, nftTokenAddress)
    );
    serials.push(
      await utils.mintNFTToAddress(tokenCreateContract, nftTokenAddress)
    );

    const txNFT = await airdropContract.nftAirdropDistribute(
      nftTokenAddress,
      owner,
      accounts,
      serials,
      Constants.GAS_LIMIT_5_000_000
    );

    await txNFT.wait();

    const updatedNFTBalances = await Promise.all([
      erc721Contract.ownerOf(nftTokenAddress, serials[0]),
      erc721Contract.ownerOf(nftTokenAddress, serials[1]),
    ]);

    for (let i = 0; i < accounts.length; i++) {
      expect(updatedNFTBalances[i]).to.equal(accounts[i]);
    }
  });

  it('should airdrop 10 tokens to multiple accounts', async function () {
    const ftAmount = BigInt(1);
    const tokens = [];
    // Every accountAmount counts as 1 transfer so 5x2=10
    for (let i = 0; i < 5; i++) {
      tokens.push(
        await utils.setupToken(tokenCreateContract, owner, contractAddresses)
      );
    }
    for (let i = 0; i < accounts.length; i++) {
      const tx = await airdropContract.multipleFtAirdrop(
        tokens,
        owner,
        accounts[i],
        ftAmount,
        Constants.GAS_LIMIT_2_000_000
      );
      await tx.wait();
      for (let j = 0; j < tokens.length; j++) {
        const balance = await erc20Contract.balanceOf(tokens[j], accounts[i]);
        expect(balance).to.equal(ftAmount);
      }
    }
  });

  it('should airdrop 10 NFTs to multiple accounts', async function () {
    async function createNFTs(count) {
      const tokens = [];
      const serials = [];
      for (let i = 0; i < count; i++) {
        const tokenAddress = await utils.setupNft(
          tokenCreateContract,
          owner,
          contractAddresses
        );
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
      const tx = await airdropContract.multipleNftAirdrop(
        nftTokens,
        owner,
        receiver,
        nftSerials,
        Constants.GAS_LIMIT_2_000_000
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

  it('should fail when the sender does not have enough balance', async function () {
    const ftAmount = BigInt(100_000_000_000_000_000);
    const receiver = signers[1].address;

    const tx = await airdropContract.tokenAirdrop(
      tokenAddress,
      signers[2].address,
      receiver,
      ftAmount,
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
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
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = await utils.getHTSResponseCode(txNFT.hash);
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
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = await utils.getHTSResponseCode(txNFT.hash);
    expect(responseCode).to.eq('167'); // INVALID_TOKEN_ID code
  });

  it('should fail when the airdrop has multiple senders', async function () {
    const invalidAmount = BigInt(0);
    const receiver = signers[1].address;

    const tx = await airdropContract.tokenAirdrop(
      tokenAddress,
      signers[0].address,
      receiver,
      invalidAmount,
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('50'); // INVALID_TRANSACTION_BODY code
  });

  it('should fail when 11 or more NFT airdrops are provided', async function () {
    const nftTokens = [];
    const nftSerials = [];
    for (let i = 0; i < 11; i++) {
      const tokenAddress = await utils.setupNft(
        tokenCreateContract,
        owner,
        contractAddresses
      );
      const serial = await utils.mintNFTToAddress(
        tokenCreateContract,
        tokenAddress
      );
      nftTokens.push(tokenAddress);
      nftSerials.push(serial);
    }

    const tx = await airdropContract.multipleNftAirdrop(
      nftTokens,
      owner,
      signers[1].address,
      nftSerials,
      {
        gasLimit: 15_000_000,
      }
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    const responseText = utils.decimalToAscii(responseCode);
    expect(responseText).to.eq('TOKEN_REFERENCE_LIST_SIZE_LIMIT_EXCEEDED');
  });

  it('should fail when 11 or more token airdrops are provided', async function () {
    const ftAmount = BigInt(1);
    const tokens = [];
    for (let i = 0; i < 6; i++) {
      tokens.push(
        await utils.setupToken(tokenCreateContract, owner, contractAddresses)
      );
    }
    const tx = await airdropContract.multipleFtAirdrop(
      tokens,
      owner,
      signers[1].address,
      ftAmount,
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    const responseText = utils.decimalToAscii(responseCode);
    expect(responseText).to.eq('TOKEN_REFERENCE_LIST_SIZE_LIMIT_EXCEEDED');
  });

  it('should handle airdrop to account with no available association slots', async function () {
    const ftAmount = BigInt(1);
    const receiver = ethers.Wallet.createRandom().connect(ethers.provider);
    await signers[0].sendTransaction({
      to: receiver.address,
      value: ethers.parseEther('100'),
    });
    const IHRC904AccountFacade = new ethers.Interface(
      (await hre.artifacts.readArtifact('IHRC904AccountFacade')).abi
    );

    walletIHRC904AccountFacade = new ethers.Contract(
      receiver.address,
      IHRC904AccountFacade,
      receiver
    );

    const disableAutoAssociations =
      await walletIHRC904AccountFacade.setUnlimitedAutomaticAssociations(
        false,
        Constants.GAS_LIMIT_2_000_000
      );
    await disableAutoAssociations.wait();

    const tx = await airdropContract.tokenAirdrop(
      tokenAddress,
      signers[0].address,
      receiver.address,
      ftAmount,
      {
        gasLimit: 2_000_000,
        value: Constants.ONE_HBAR,
      }
    );
    await tx.wait();

    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('22');

    // The airdrop will be pending, so the balance should still be 0
    const balance = await erc20Contract.balanceOf(
      tokenAddress,
      receiver.address
    );
    expect(balance).to.equal(0n);
  });
});
