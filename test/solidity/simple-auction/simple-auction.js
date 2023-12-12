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
const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../../constants');
const Utils = require('../../hts-precompile/utils');
const { genericPoll } = require('../../../utils/helpers');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe('Solidity Simple Auction example', function () {
  let factory,
    signers,
    wallet,
    wallet1,
    contract,
    hasError,
    bidAmount,
    contractShortLived,
    bidAmountSmall,
    initialEvent;
  const CONTRACT_DURATION = 10000000000;
  const CONTRACT_SHORT_DURATION = 1;
  const TRANSACTION_VALUE = '1000';
  const TRANSACTION_VALUE_SMALL = '100';

  before(async function () {
    signers = await ethers.getSigners();
    wallet = signers[0];
    wallet1 = signers[1];

    factory = await ethers.getContractFactory(Constants.Contract.SimpleAuction);
    contractShortLived = await factory.deploy(
      CONTRACT_SHORT_DURATION,
      wallet1.address
    );
    await contractShortLived.deployed();

    bidAmount = ethers.utils.parseUnits(TRANSACTION_VALUE, 'gwei');
    bidAmountSmall = ethers.utils.parseUnits(TRANSACTION_VALUE_SMALL, 'gwei');
  });

  beforeEach(async function () {
    hasError = false;
    contract = await factory.deploy(CONTRACT_DURATION, wallet.address);
    await contract.deployed();

    const trx = await contract.bid({ value: bidAmountSmall });
    const receipt = await trx.wait(1);
    initialEvent = receipt.events[0].event;
  });

  it('should confirm "bid" function works', async function () {
    const highestBid = await contract.highestBid();
    const highestBidder = await contract.highestBidder();

    expect(highestBid.mul(Utils.tinybarToWeibarCoef)).to.equal(bidAmountSmall);
    expect(highestBidder).to.equal(wallet.address);
    expect(initialEvent).to.equal('HighestBidIncreased');
  });

  it('should confirm bid not high enough scenario works: BidNotHighEnough', async function () {
    await expect(
      contract.callStatic.bid({ value: 1 })
    ).to.eventually.be.rejected.and.have.property('reason', 'BidNotHighEnough');
  });

  it('should revert a bid with "AuctionAlreadyEnded" error', async function () {
    await expect(
      contractShortLived.callStatic.bid({ value: bidAmountSmall })
    ).to.eventually.be.rejected.and.have.property(
      'reason',
      'AuctionAlreadyEnded'
    );
  });

  it('should confirm "withdraw" function works', async function () {
    expect(initialEvent, 'Initial bid').to.equal('HighestBidIncreased');

    const initialHighestBidder = await contract.highestBidder();
    const previousContractBalance = await ethers.provider.getBalance(
      contract.address
    );
    expect(
      previousContractBalance,
      `Initial Contract balance to be: ${bidAmountSmall}`
    ).to.equal(bidAmountSmall);
    expect(
      initialHighestBidder,
      `Initial Highest bidder to be: ${initialHighestBidder}`
    ).to.equal(wallet.address);

    const tr = await contract.connect(wallet1).bid({ value: bidAmount });
    await tr.wait(2);

    const newHighestBidder = await genericPoll(
      await contract.highestBidder(),
      (res) => res === wallet1.address,
      3000,
      'New Highest bidder to be: --Wallet1--'
    );
    expect(newHighestBidder, 'New Highest bidder to be: --Wallet1--').to.equal(
      wallet1.address
    );

    const currentContractBalance = await ethers.provider.getBalance(
      contract.address
    );
    const combined = bidAmount.add(bidAmountSmall);
    expect(
      currentContractBalance,
      'The contract balance to be the combined of the two transactions'
    ).to.equal(combined);

    // Call the withdraw function with the previous highest bidder's address
    const withdrawTx = await contract.connect(wallet).withdraw();
    await withdrawTx.wait(2);

    // Check that the amount of Ether returned to the previous highest bidder is correct
    const newContractBalance = await genericPoll(
      ethers.provider.getBalance(contract.address),
      (res) => res.eq(bidAmount),
      3000,
      `The new balance to be: ${bidAmount}`
    );
    expect(newContractBalance, `The new balance to be: ${bidAmount}`).to.equal(
      bidAmount
    );
  });

  it('should confirm "auctionEnd" function works', async function () {
    expect(initialEvent, 'Initial bid').to.equal('HighestBidIncreased');
    const previousContractBalance = await ethers.provider.getBalance(
      contract.address
    );
    expect(
      previousContractBalance,
      `Initial Contract balance to be: ${bidAmountSmall}`
    ).to.equal(bidAmountSmall);

    const tr = await contractShortLived.connect(wallet).auctionEnd();
    await tr.wait(2);

    const contractBalance = await genericPoll(
      ethers.provider.getBalance(contract.address),
      (res) => res.eq(bidAmountSmall),
      1000,
      `Contract balance after 'auctionEnd' to be: ${bidAmountSmall}`
    );
    expect(
      contractBalance,
      `Contract balance after "auctionEnd" to be: ${bidAmountSmall}`
    ).to.equal(bidAmountSmall);
  });
});
