/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
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

const {expect} = require("chai");
const {ethers} = require("hardhat");
const Constants = require("../constants");

describe("SafeHTS library Test Suite", function () {
  let safeOperationsContract;
  let fungibleTokenAddress;
  let nonFungibleTokenAddress;

  before(async function () {
    safeOperationsContract = await deploySafeOperationsContract();
    fungibleTokenAddress = await createFungibleToken();
  });

  async function deploySafeOperationsContract() {
    const signers = await ethers.getSigners();

    const safeHTSFactory = await ethers.getContractFactory(Constants.Contract.SafeHTS);
    const safeHTS = await safeHTSFactory.connect(signers[1]).deploy(Constants.GAS_LIMIT_1_000_000);
    const safeHTSReceipt = await safeHTS.deployTransaction.wait();

    const safeOperationsFactory = await ethers.getContractFactory(Constants.Contract.SafeOperations, {
      libraries: {
        SafeHTS: safeHTSReceipt.contractAddress,
      }
    });

    const safeOperations = await safeOperationsFactory.connect(signers[1]).deploy(Constants.GAS_LIMIT_1_000_000);
    const safeOperationsReceipt = await safeOperations.deployTransaction.wait();

    return await ethers.getContractAt(Constants.Contract.SafeOperations, safeOperationsReceipt.contractAddress);
  }

  async function createFungibleToken() {
    const tokenAddressTx = await safeOperationsContract.safeCreateFungibleToken({
      value: ethers.BigNumber.from('20000000000000000000'),
      gasLimit: 1_000_000
    });

    const tokenAddressReceipt = await tokenAddressTx.wait();
    const tokenAddress = tokenAddressReceipt.events.filter(e => e.event === Constants.Events.TokenCreated)[0].args[0];
    return tokenAddress;
  }

  async function createNonFungibleToken() {
    const tokenAddressTx = await safeOperationsContract.safeCreateNonFungibleToken({
      value: ethers.BigNumber.from('20000000000000000000'),
      gasLimit: 1_000_000
    });

    const tokenAddressReceipt = await tokenAddressTx.wait();
    const {tokenAddress} = tokenAddressReceipt.events.filter(e => e.event === Constants.Events.TokenCreatedEvent)[0].args;

    return tokenAddress;
  }

  it("should be able to get token info", async function () {
    const tokenInfoTx = await safeOperationsContract.safeGetTokenInfo(fungibleTokenAddress);
    const tokenInfoReceipt = await tokenInfoTx.wait();
    const tokenInfo = tokenInfoReceipt.events.filter(e => e.event === Constants.Events.TokenInfoEvent)[0].args[0];

    expect(tokenInfo.token.name).to.equal(Constants.TOKEN_NAME);
    expect(tokenInfo.token.symbol).to.equal(Constants.TOKEN_SYMBOL);
    expect(tokenInfo.totalSupply).to.equal(200);
  });

  it("should be able to get fungible token info", async function () {
    const fungibleTokenInfoTx = await safeOperationsContract.safeGetFungibleTokenInfo(fungibleTokenAddress);
    const fungibleTokenInfoReceipt = await fungibleTokenInfoTx.wait();
    const fungibleTokenInfo = fungibleTokenInfoReceipt.events.filter(e => e.event === Constants.Events.FungibleTokenInfoEvent)[0].args[0];

    expect(fungibleTokenInfo.tokenInfo.token.name).to.equal(Constants.TOKEN_NAME);
    expect(fungibleTokenInfo.tokenInfo.token.symbol).to.equal(Constants.TOKEN_SYMBOL);
    expect(fungibleTokenInfo.tokenInfo.totalSupply).to.equal(200);
    expect(fungibleTokenInfo.decimals).to.equal(8);
  });

  xit("should be able to transfer tokens and hbars atomically", async function () {
    const senderAccountID = '0x67D8d32E9Bf1a9968a5ff53B87d777Aa8EBBEe69';
    const receiverAccountID = '0x05FbA803Be258049A27B820088bab1cAD2058871';

    const {newTotalSupply, serialNumbers} = await safeOperationsContract.safeMintToken(nonFungibleTokenAddress, 0, ['0x01'], Constants.GAS_LIMIT_1_000_000);
    const NftSerialNumber = serialNumbers[0];

    await safeOperationsContract.safeAssociateToken(senderAccountID, fungibleTokenAddress);
    await safeOperationsContract.safeAssociateToken(senderAccountID, nonFungibleTokenAddress);
    await safeOperationsContract.safeAssociateToken(receiverAccountID, fungibleTokenAddress);
    await safeOperationsContract.safeAssociateToken(receiverAccountID, nonFungibleTokenAddress);

    const accountAmountSender = {
      accountID: `senderAccountID`,
      amount: -10,
      isApproval: false };
    const accountAmountReceiver = {
      accountID: `receiverAccountID`,
      amount: 10,
      isApproval: false };
    const transferList = [accountAmountSender, accountAmountReceiver];

    const tokenTransferList = [{
      token: `${NftHTSTokenContractAddress}`,
      transfers: [],
      nftTransfers: [{
        senderAccountID: `senderAccountID`,
        receiverAccountID: `receiverAccountID`,
        serialNumber: NftSerialNumber.toNumber(),
      }],
    },
    {
      token: `${HTSTokenContractAddress}`,
      transfers: [
        {
          accountID: `receiverAccountID`,
          amount: 10,
        },
        {
          accountID: `senderAccountID`,
          amount: -10,
        },
      ],
      nftTransfers: [],
    }];

    const cryptoTransferTx = await safeOperationsContract.safeCryptoTransfer(transferList, tokenTransferList);
    const cryptoTransferReceipt = await cryptoTransferTx.wait()
    expect(cryptoTransferReceipt.events.filter(e => e.event === Constants.Events.Success)[0].args).to.be.true;
  });
});
