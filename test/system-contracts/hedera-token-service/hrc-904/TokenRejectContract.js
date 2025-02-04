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

describe('HIP904 TokenRejectContract Test Suite', function () {
  let tokenRejectContract;
  let tokenCreateContract;
  let airdropContract;
  let signers;
  let owner;
  let receiver;
  let walletIHRC904AccountFacade;
  let contractAddresses;

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

    const randomWallet = ethers.Wallet.createRandom();
    const receiverPrivateKey = randomWallet.privateKey;
    receiver = randomWallet.connect(ethers.provider);

    await signers[0].sendTransaction({
      to: receiver.address,
      value: ethers.parseEther('100'),
    });

    contractAddresses = [
      await tokenRejectContract.getAddress(),
      await tokenCreateContract.getAddress(),
      await airdropContract.getAddress(),
    ];
    await utils.updateAccountKeysViaHapi(contractAddresses);

    await utils.updateAccountKeysViaHapi(contractAddresses, [
      receiverPrivateKey,
    ]);

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
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses
    );
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
    const nftTokenAddress = await utils.setupNft(
      tokenCreateContract,
      owner,
      contractAddresses
    );
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
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses
    );
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
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses
    );

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
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses
    );
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
    const nftTokenAddress = await utils.setupNft(
      tokenCreateContract,
      owner,
      contractAddresses
    );

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

    const nftTokenAddress = await utils.setupNft(
      tokenCreateContract,
      owner,
      contractAddresses
    );
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
