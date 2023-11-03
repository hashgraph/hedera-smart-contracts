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

const chai = require('chai')
const { expect } = require('chai')
const chaiAsPromised = require("chai-as-promised")
const { ethers } = require('hardhat')
const Constants = require('../../constants')
chai.use(chaiAsPromised);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const deployBlindAuctionContract = async (biddingTime, revealTime, beneficiaryAddress) => {
    const factory = await ethers.getContractFactory(Constants.Contract.BlindAuction)
    const contract = await factory.deploy(biddingTime, revealTime, beneficiaryAddress)

    await contract.deployed()

    return contract;
}

describe('Solidity Errors', function () {
  let beneficiary, wallet1;
  const oneEther = ethers.utils.parseEther("100.0");
  const twoEther = ethers.utils.parseEther("200.0");
  const oneTenthEther = ethers.utils.parseEther("0.1");
  const fiftyGwei = ethers.utils.parseUnits('50', 'gwei')

  before(async function () {
    [beneficiary, wallet1] = await ethers.getSigners();
  })

  it('should confirm beneficiary is set correctly', async function () {
    const contract = await deployBlindAuctionContract(3, 5, beneficiary.address);
    const beneficiaryAddress = await contract.beneficiary();

    expect(beneficiaryAddress).to.eq(beneficiary.address);
  })

  it('should confirm a user can bid', async function () {
    const contract = await deployBlindAuctionContract(3, 5, beneficiary.address);
    //pack encode the bid we want to put
    const bidData = ethers.utils.solidityKeccak256(["uint256", "bool", "uint256"] ,[oneEther, false, 2]);

    //bid from another account
    const result = await contract.connect(wallet1).bid(bidData, {value: oneEther});
    await result.wait();
    const firstBidder = await contract.getBids(wallet1.address);

    expect(firstBidder.length).to.eq(1);
    expect(firstBidder[0].blindedBid).to.eq(bidData);
  })

  it('should confirm a user can reveal their bids', async function () {
    const contract = await deployBlindAuctionContract(6, 5, beneficiary.address);

    const firstBid = ethers.utils.solidityKeccak256(["uint256", "bool", "uint256"] ,[10000000000, false, ethers.utils.formatBytes32String('2')]);
    const secondBid = ethers.utils.solidityKeccak256(["uint256", "bool", "uint256"] ,[10000000000, true, ethers.utils.formatBytes32String('23')]);


    const bid = await contract.connect(wallet1).bid(firstBid, {value: oneEther});
    await bid.wait();

    await sleep(2000);

    const bid2 = await contract.connect(wallet1).bid(secondBid, {value: fiftyGwei});
    await bid2.wait();

    await sleep(3000);

    const result = await contract.connect(wallet1).reveal([10000000000, 10000000000], [false, true], [ethers.utils.formatBytes32String('2'), ethers.utils.formatBytes32String('23')], {gasLimit: 5000000});
    await result.wait();
    await sleep(3000);

    const highestBidder =  await contract.highestBidder();
    const highestBid = await contract.highestBid()

    //add expect statements here
    expect(highestBid).to.equal(BigInt(10000000000));
    expect(highestBidder).to.equal(wallet1.address);
  })

  it('should confirm a user can withdraw', async function () {
    const contract = await deployBlindAuctionContract(10, 5, beneficiary.address);

    const firstBid = ethers.utils.solidityKeccak256(["uint256", "bool", "uint256"] ,[10000000000, false, ethers.utils.formatBytes32String('2')]);
    const secondBid = ethers.utils.solidityKeccak256(["uint256", "bool", "uint256"] ,[20000000000, true, ethers.utils.formatBytes32String('23')]);
    const thirdBid = ethers.utils.solidityKeccak256(["uint256", "bool", "uint256"] ,[20000000000, false, ethers.utils.formatBytes32String('5')]);

    const bid = await contract.connect(wallet1).bid(firstBid, {value: oneEther});
    await bid.wait();

    await sleep(2000);

    const bid2 = await contract.connect(wallet1).bid(secondBid, {value: fiftyGwei});
    await bid2.wait();

    const bid3 = await contract.connect(wallet1).bid(thirdBid, {value: twoEther});
    await bid3.wait();

    await sleep(3000);

    const result = await contract.connect(wallet1).reveal([10000000000, 20000000000, 20000000000], [false, true, false], [ethers.utils.formatBytes32String('2'), ethers.utils.formatBytes32String('23'), ethers.utils.formatBytes32String('5')], {gasLimit: 5000000});
    await result.wait();

    await sleep(2000);

    const highestBidder =  await contract.highestBidder();
    const highestBid = await contract.highestBid();

    const balanceBeforeWithdraw = await ethers.provider.getBalance(wallet1.address);

    const withdraw = await contract.connect(wallet1).withdraw();
    await withdraw.wait();

    await sleep(1000);
    const balanceAfterWithdraw = await ethers.provider.getBalance(wallet1.address);

    expect(balanceBeforeWithdraw).to.be.lessThan(balanceAfterWithdraw);
    expect(highestBid).to.equal(BigInt(20000000000));
    expect(highestBidder).to.equal(wallet1.address);
  })

  it('should confirm a user can end an auction', async function () {
    const contract = await deployBlindAuctionContract(5, 5, beneficiary.address);

    const firstBid = ethers.utils.solidityKeccak256(["uint256", "bool", "uint256"] ,[10000000000, false, ethers.utils.formatBytes32String('2')]);
    const secondBid = ethers.utils.solidityKeccak256(["uint256", "bool", "uint256"] ,[10000000000, true, ethers.utils.formatBytes32String('23')]);
    const thirdBid = ethers.utils.solidityKeccak256(["uint256", "bool", "uint256"] ,[20000000000, false, ethers.utils.formatBytes32String('5')]);

    const bid = await contract.connect(wallet1).bid(firstBid, {value: oneEther});
    await bid.wait();

    const bid2 = await contract.connect(wallet1).bid(secondBid, {value: fiftyGwei});
    await bid2.wait();

    const bid3 = await contract.connect(wallet1).bid(thirdBid, {value: twoEther});
    await bid3.wait();

    await sleep(3000);

    const reveal = await contract.connect(wallet1).reveal([10000000000, 20000000000, 20000000000], [false, true, false], [ethers.utils.formatBytes32String('2'), ethers.utils.formatBytes32String('23'), ethers.utils.formatBytes32String('5')], {gasLimit: 5000000});
    await reveal.wait();

    const balanceBeforeAuctionEnd = await ethers.provider.getBalance(beneficiary.address);

    await sleep(2000);
    const highestBidder =  await contract.highestBidder();
    const highestBid = await contract.highestBid()

    const result = await contract.connect(wallet1).auctionEnd();
    await result.wait();

    await sleep(2000);

    const balanceAfterAuctionEnd = await ethers.provider.getBalance(beneficiary.address);

    expect(highestBid).to.equal(BigInt(20000000000));
    expect(highestBidder).to.equal(wallet1.address);
    expect(balanceBeforeAuctionEnd).to.be.lessThan(balanceAfterAuctionEnd);
  })

  it('should confirm a user cannot bid after end', async function () {
    const contract = await deployBlindAuctionContract(4, 2, beneficiary.address);
    const bidData = ethers.utils.solidityKeccak256(["uint256", "bool", "uint256"] ,[oneEther, false, 2]);

    //wait for next block
    await sleep(5000);


    const result = await contract.connect(wallet1).bid(bidData, {value: oneEther});
    await expect(result.wait()).to.eventually.be.rejected.and.have.property('code', 'CALL_EXCEPTION')
  })

  it('should confirm a user cannot reveal after reveal end', async function () {
    const contract = await deployBlindAuctionContract(5, 2, beneficiary.address);

    const bidData = ethers.utils.solidityKeccak256(["uint256", "bool", "uint256"] ,[oneEther, false, 2]);
    const anotherBidData = ethers.utils.solidityKeccak256(["uint256", "bool", "uint256"] ,[twoEther, true, 23]);

    const bid = await contract.connect(wallet1).bid(bidData, {value: oneEther});
    await bid.wait();

    const bidAgain = await contract.connect(wallet1).bid(anotherBidData, {value: oneTenthEther});
    await bidAgain.wait();

    await sleep(6000);

    const result = await contract.connect(wallet1).reveal([oneEther, oneTenthEther], [false, true], [ethers.utils.formatBytes32String(2), ethers.utils.formatBytes32String(23)]);
    await expect(result.wait()).to.eventually.be.rejected.and.have.property('code', 'CALL_EXCEPTION')
  })
})
