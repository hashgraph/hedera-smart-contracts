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

describe('HIP904 CancelAirdropContract Test Suite', function () {
  let airdropContract;
  let cancelAirdropContract;
  let tokenCreateContract;
  let erc20Contract;
  let erc721Contract;
  let signers;
  let owner;
  let receiver;
  let contractAddresses;

  before(async function () {
    signers = await ethers.getSigners();
    airdropContract = await utils.deployContract(Constants.Contract.Airdrop);
    cancelAirdropContract = await utils.deployContract(
      Constants.Contract.CancelAirdrop
    );

    receiver = ethers.Wallet.createRandom().connect(ethers.provider);

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
      await cancelAirdropContract.getAddress(),
    ];

    await utils.updateAccountKeysViaHapi(contractAddresses);

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
        {
          gasLimit: 2_000_000,
        }
      );
    await disableAutoAssociations.wait();
  });

  it('should cancel a single pending fungible token airdrop', async function () {
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
      await utils.createPendingAirdrops(
        numAirdrops,
        tokenCreateContract,
        owner,
        airdropContract,
        receiver
      );

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
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses
    );

    const tx = await cancelAirdropContract.cancelAirdrop(
      sender,
      receiver,
      tokenAddress,
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('367'); // INVALID_PENDING_AIRDROP_ID code
  });

  it('should fail when sender account is invalid', async function () {
    const invalidSender = ethers.Wallet.createRandom().address;
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses
    );

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
    const tokenAddress = await utils.setupToken(
      tokenCreateContract,
      owner,
      contractAddresses
    );

    const tx = await cancelAirdropContract.cancelAirdrop(
      owner,
      invalidReceiver,
      tokenAddress,
      Constants.GAS_LIMIT_2_000_000
    );
    const responseCode = await utils.getHTSResponseCode(tx.hash);
    expect(responseCode).to.eq('367'); // INVALID_PENDING_AIRDROP_ID code
  });

  // TODO: Test is skipped because current implementation does not return correct error code for non-existent tokens
  // https://github.com/hashgraph/hedera-services/issues/17534
  it.skip('should fail when token does not exist', async function () {
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

  // TODO: Test is skipped because current implementation does not return correct error code for non-existent NFTs
  // https://github.com/hashgraph/hedera-services/issues/17534
  it.skip('should fail when NFT does not exist', async function () {
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

  // TODO: Test is skipped because current implementation does not support checking for maximum number of pending airdrops
  // https://github.com/hashgraph/hedera-services/issues/17534
  it.skip('should fail when more than 10 pending airdrops provided', async function () {
    try {
      const { senders, receivers, tokens, serials } =
        await utils.createPendingAirdrops(
          11,
          tokenCreateContract,
          owner,
          airdropContract,
          receiver
        );

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
    const nftTokenAddress = await utils.setupNft(
      tokenCreateContract,
      owner,
      contractAddresses
    );
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
