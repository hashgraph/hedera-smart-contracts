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

const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { ethers } = require('hardhat');
const Constants = require('../../constants');
const {
  tinybarToHbarCoef,
  tinybarToWeibarCoef,
} = require('../../system-contracts/hedera-token-service/utils');
chai.use(chaiAsPromised);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sleepUntilTimestamp = async (timestamp) => {
  const remainingMs = timestamp - Date.now();
  if (remainingMs > 0) {
    await sleep(remainingMs);
  }
};

const deployBlindAuctionContract = async (
  biddingTime,
  revealTime,
  beneficiaryAddress
) => {
  const factory = await ethers.getContractFactory(
    Constants.Contract.BlindAuction
  );
  const contract = await factory.deploy(
    biddingTime,
    revealTime,
    beneficiaryAddress
  );
  const biddingEndMs = Date.now() + biddingTime * 1000 + 250;
  const revealEndMs = biddingEndMs + revealTime * 1000 + 250;

  return { contract, biddingEndMs, revealEndMs };
};

describe('@solidityequiv1 Solidity Blind Auction Test Suite', function () {
  let beneficiary, wallet1;

  const biddingTimeSeconds = 6;
  const revealTimeSeconds = 3;

  const fiveHbars = 5 * tinybarToHbarCoef;
  const hundredHbars = 100 * tinybarToHbarCoef;
  const twoHundredHbars = 200 * tinybarToHbarCoef;
  const hundredHbarsToWeibar = BigInt(
    String(hundredHbars * tinybarToWeibarCoef)
  );
  const twohundredHbarsToWeibar = BigInt(
    String(twoHundredHbars * tinybarToWeibarCoef)
  );
  const fiveHbarsToWeibar = BigInt(String(fiveHbars * tinybarToWeibarCoef));

  before(async function () {
    [beneficiary, wallet1] = await ethers.getSigners();
  });

  it('should confirm beneficiary is set correctly', async function () {
    const { contract } = await deployBlindAuctionContract(
      biddingTimeSeconds,
      revealTimeSeconds,
      beneficiary.address
    );
    const beneficiaryAddress = await contract.beneficiary();

    expect(beneficiaryAddress).to.eq(beneficiary.address);
  });

  it('should confirm a user can bid', async function () {
    const { contract } = await deployBlindAuctionContract(
      biddingTimeSeconds,
      revealTimeSeconds,
      beneficiary.address
    );

    const bidData = ethers.solidityPackedKeccak256(
      ['uint256', 'bool', 'uint256'],
      [hundredHbars, false, 2]
    );

    const result = await contract
      .connect(wallet1)
      .bid(bidData, { value: hundredHbarsToWeibar });
    await result.wait();
    const firstBidder = await contract.getBids(wallet1.address);

    expect(firstBidder.length).to.eq(1);
    expect(firstBidder[0].blindedBid).to.eq(bidData);
  });

  it('should confirm a user can reveal their bids', async function () {
    const { contract, biddingEndMs } = await deployBlindAuctionContract(
      biddingTimeSeconds,
      revealTimeSeconds,
      beneficiary.address
    );

    const firstBid = ethers.solidityPackedKeccak256(
      ['uint256', 'bool', 'uint256'],
      [hundredHbars, false, ethers.encodeBytes32String('2')]
    );
    const secondBid = ethers.solidityPackedKeccak256(
      ['uint256', 'bool', 'uint256'],
      [hundredHbars, true, ethers.encodeBytes32String('23')]
    );

    const bid = await contract
      .connect(wallet1)
      .bid(firstBid, { value: hundredHbarsToWeibar });
    await bid.wait();

    const bid2 = await contract
      .connect(wallet1)
      .bid(secondBid, { value: fiveHbarsToWeibar });
    await bid2.wait();

    await sleepUntilTimestamp(biddingEndMs);

    const result = await contract
      .connect(wallet1)
      .reveal(
        [hundredHbars, hundredHbars],
        [false, true],
        [ethers.encodeBytes32String('2'), ethers.encodeBytes32String('23')],
        { gasLimit: 5000000 }
      );
    await result.wait();

    const highestBidder = await contract.highestBidder();
    const highestBid = await contract.highestBid();

    expect(highestBid).to.equal(BigInt(hundredHbars));
    expect(highestBidder).to.equal(wallet1.address);
  });

  it('should confirm a user can withdraw', async function () {
    const { contract, biddingEndMs } = await deployBlindAuctionContract(
      biddingTimeSeconds,
      revealTimeSeconds,
      beneficiary.address
    );

    const firstBid = ethers.solidityPackedKeccak256(
      ['uint256', 'bool', 'uint256'],
      [hundredHbars, false, ethers.encodeBytes32String('2')]
    );
    const secondBid = ethers.solidityPackedKeccak256(
      ['uint256', 'bool', 'uint256'],
      [twoHundredHbars, true, ethers.encodeBytes32String('23')]
    );
    const thirdBid = ethers.solidityPackedKeccak256(
      ['uint256', 'bool', 'uint256'],
      [twoHundredHbars, false, ethers.encodeBytes32String('5')]
    );

    const bid = await contract
      .connect(wallet1)
      .bid(firstBid, { value: hundredHbarsToWeibar });
    await bid.wait();

    const bid2 = await contract
      .connect(wallet1)
      .bid(secondBid, { value: fiveHbarsToWeibar });
    await bid2.wait();

    const bid3 = await contract
      .connect(wallet1)
      .bid(thirdBid, { value: twohundredHbarsToWeibar });
    await bid3.wait();

    //this sleep is needed as part of the contract business logic
    //to ensure time has passed and we can reveal the blind bid
    await sleepUntilTimestamp(biddingEndMs);

    const result = await contract
      .connect(wallet1)
      .reveal(
        [hundredHbars, twoHundredHbars, twoHundredHbars],
        [false, true, false],
        [
          ethers.encodeBytes32String('2'),
          ethers.encodeBytes32String('23'),
          ethers.encodeBytes32String('5'),
        ],
        { gasLimit: 5000000 }
      );
    await result.wait();

    const highestBidder = await contract.highestBidder();
    const highestBid = await contract.highestBid();

    const balanceBeforeWithdraw = await contract.getBalance();

    const withdraw = await contract.connect(wallet1).withdraw();
    await withdraw.wait();

    const balanceAfterWithdraw = await contract.getBalance();

    expect(balanceBeforeWithdraw).to.be.greaterThan(balanceAfterWithdraw);
    expect(highestBid).to.equal(BigInt(twoHundredHbars));
    expect(highestBidder).to.equal(wallet1.address);
  });

  it('should confirm a user can end an auction', async function () {
    const { contract, biddingEndMs, revealEndMs } =
      await deployBlindAuctionContract(
        biddingTimeSeconds,
        revealTimeSeconds,
        beneficiary.address
      );

    const firstBid = ethers.solidityPackedKeccak256(
      ['uint256', 'bool', 'uint256'],
      [hundredHbars, false, ethers.encodeBytes32String('2')]
    );
    const secondBid = ethers.solidityPackedKeccak256(
      ['uint256', 'bool', 'uint256'],
      [hundredHbars, true, ethers.encodeBytes32String('23')]
    );

    const bid = await contract
      .connect(wallet1)
      .bid(firstBid, { value: hundredHbarsToWeibar });
    await bid.wait();

    const bid2 = await contract
      .connect(wallet1)
      .bid(secondBid, { value: hundredHbarsToWeibar });
    await bid2.wait();

    await sleepUntilTimestamp(biddingEndMs);

    const reveal = await contract
      .connect(wallet1)
      .reveal(
        [hundredHbars, hundredHbars],
        [false, true],
        [ethers.encodeBytes32String('2'), ethers.encodeBytes32String('23')],
        { gasLimit: 5000000 }
      );
    await reveal.wait();

    const balanceBeforeAuctionEnd = await ethers.provider.getBalance(
      beneficiary.address
    );

    // this sleep is needed as part of the contract business logic
    // to ensure time has passed, and we can end the auction
    await sleepUntilTimestamp(revealEndMs);

    const result = await contract
      .connect(wallet1)
      .auctionEnd(Constants.GAS_LIMIT_1_000_000);
    await result.wait();

    const balanceAfterAuctionEnd = await ethers.provider.getBalance(
      beneficiary.address
    );

    const highestBidder = await contract.highestBidder();
    const highestBid = await contract.highestBid();

    expect(highestBid).to.equal(BigInt(hundredHbars));
    expect(highestBidder).to.equal(wallet1.address);
    expect(balanceBeforeAuctionEnd).to.be.lessThan(balanceAfterAuctionEnd);
  });

  it('should confirm a user cannot bid after end', async function () {
    const { contract, biddingEndMs } = await deployBlindAuctionContract(
      1,
      1,
      beneficiary.address
    );
    const bidData = ethers.solidityPackedKeccak256(
      ['uint256', 'bool', 'uint256'],
      [hundredHbars, false, 2]
    );

    await sleepUntilTimestamp(biddingEndMs);

    await expect(
      contract.connect(wallet1).bid(bidData, { value: hundredHbarsToWeibar })
    ).to.eventually.be.rejected.and.have.property('code', -32008);
  });

  it('should confirm a user cannot reveal after reveal end', async function () {
    const { contract, revealEndMs } = await deployBlindAuctionContract(
      biddingTimeSeconds,
      revealTimeSeconds,
      beneficiary.address
    );

    const bidData = ethers.solidityPackedKeccak256(
      ['uint256', 'bool', 'uint256'],
      [hundredHbars, false, 2]
    );
    const anotherBidData = ethers.solidityPackedKeccak256(
      ['uint256', 'bool', 'uint256'],
      [hundredHbars, true, 23]
    );

    const bid = await contract
      .connect(wallet1)
      .bid(bidData, { value: hundredHbarsToWeibar });
    await bid.wait();

    const bidAgain = await contract
      .connect(wallet1)
      .bid(anotherBidData, { value: fiveHbarsToWeibar });
    await bidAgain.wait();

    await sleepUntilTimestamp(revealEndMs);

    const result = await contract
      .connect(wallet1)
      .reveal(
        [hundredHbars, twoHundredHbars],
        [false, true],
        [ethers.encodeBytes32String('2'), ethers.encodeBytes32String('23')],
        Constants.GAS_LIMIT_1_000_000
      );
    await expect(result.wait()).to.eventually.be.rejected.and.have.property(
      'code',
      'CALL_EXCEPTION'
    );
  });
});
