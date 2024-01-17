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

const AMOUNT_TO_MINT = 100n;
const sleep = (timeToSleep) => new Promise((r) => setTimeout(r, timeToSleep));
const FUTURE_LOOKUP_ERROR = 'ERC5805FutureLookup';

describe('@OZERC20Votes Test Suite', function () {
  let contract, wallet, wallet2;
  const TIME_INCREMENT = 10000n;

  before(async function () {
    const signers = await ethers.getSigners();
    wallet = signers[0];
    wallet2 = signers[1];
    const votesFactory = await ethers.getContractFactory(
      Constants.Contract.ERC20VotesTest
    );
    contract = await votesFactory.deploy(AMOUNT_TO_MINT, {
      gasLimit: 8000000,
    });
  });

  it('should check if create/mint the erc20 tokens happened when contract created', async function () {
    const supply = await contract.totalSupply();
    const balance = await contract.balanceOf(wallet.address);

    expect(balance).to.equal(AMOUNT_TO_MINT);
    expect(supply).to.equal(AMOUNT_TO_MINT);
  });

  it('should be able to delegate votes', async function () {
    await contract.delegate(wallet2.address);
    const balance = await contract.getVotes(wallet2.address);

    expect(balance).to.equal(AMOUNT_TO_MINT);
  });

  it('should return the delegate that `account` has chosen.', async function () {
    const addr = await contract.delegates(wallet.address);

    expect(addr).to.equal(wallet2.address);
  });

  it('should get the time: clock()', async function () {
    const time = await contract.clock();

    expect(time).to.exist;
  });

  it('should return the correct value for CLOCK_MODE ', async function () {
    const time = await contract.CLOCK_MODE();

    expect(time).to.equal('mode=blocknumber&from=default');
  });

  it('should return the current amount of votes that `account` has ', async function () {
    const votes = await contract.getVotes(wallet2.address);

    expect(votes).to.equal(AMOUNT_TO_MINT);
  });

  it('should return the current amount of votes that `account` has in the past (getPastVotes) ', async function () {
    const timeTick = await contract.clock();
    await contract.delegate(wallet.address, Constants.GAS_LIMIT_1_000_000);

    const votesPast = await contract.getPastVotes(wallet.address, timeTick);
    const timeTick2 = await contract.clock();
    await sleep(3000);
    const votesPast2 = await contract.getPastVotes(wallet.address, timeTick2);

    expect(votesPast).to.equal(0);
    expect(votesPast2).to.equal(AMOUNT_TO_MINT);
  });

  it('should produce an error when looking up votes in the future (getPastVotes) ', async function () {
    const timeTick = await contract.clock();
    expect(
      contract.getPastVotes(wallet.address, timeTick + TIME_INCREMENT)
    ).to.eventually.be.rejected.and.have.property(
      'errorName',
      FUTURE_LOOKUP_ERROR
    );
  });

  it('should produce an error when looking up tottle supply in the future (getPastTotalSupply) ', async function () {
    const timeTick = await contract.clock();
    const supply = await contract.getPastTotalSupply(timeTick - 1n);
    expect(supply).to.equal(AMOUNT_TO_MINT);
  });
});
