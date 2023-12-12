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
} = require('../../hts-precompile/utils');
chai.use(chaiAsPromised);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

  await contract.deployed();

  return contract;
};

describe('@solidityequiv3 Solidity Blind Auction', function () {
  let beneficiary, wallet1;

  const fiveHbars = 5 * tinybarToHbarCoef;
  const hundredHbars = 100 * tinybarToHbarCoef;
  const twoHundredHbars = 200 * tinybarToHbarCoef;
  const hundredHbarsToWeibar = ethers.BigNumber.from(
    String(hundredHbars * tinybarToWeibarCoef)
  );
  const twohundredHbarsToWeibar = ethers.BigNumber.from(
    String(twoHundredHbars * tinybarToWeibarCoef)
  );
  const fiveHbarsToWeibar = ethers.BigNumber.from(
    String(fiveHbars * tinybarToWeibarCoef)
  );

  before(async function () {
    [beneficiary, wallet1] = await ethers.getSigners();
  });

  it('should confirm beneficiary is set correctly', async function () {
    const contract = await deployBlindAuctionContract(
      3,
      5,
      beneficiary.address
    );
    const beneficiaryAddress = await contract.beneficiary();

    expect(beneficiaryAddress).to.eq(beneficiary.address);
  });

  it('should confirm a user can bid', async function () {
    const contract = await deployBlindAuctionContract(
      3,
      5,
      beneficiary.address
    );

    const bidData = ethers.utils.solidityKeccak256(
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
    const contract = await deployBlindAuctionContract(
      5,
      5,
      beneficiary.address
    );

    const firstBid = ethers.utils.solidityKeccak256(
      ['uint256', 'bool', 'uint256'],
      [hundredHbars, false, ethers.utils.formatBytes32String('2')]
    );
    const secondBid = ethers.utils.solidityKeccak256(
      ['uint256', 'bool', 'uint256'],
      [hundredHbars, true, ethers.utils.formatBytes32String('23')]
    );

    const bid = await contract
      .connect(wallet1)
      .bid(firstBid, { value: hundredHbarsToWeibar });
    await bid.wait();

    const bid2 = await contract
      .connect(wallet1)
      .bid(secondBid, { value: fiveHbarsToWeibar });
    await bid2.wait();

    await sleep(3000);

    const result = await contract
      .connect(wallet1)
      .reveal(
        [hundredHbars, hundredHbars],
        [false, true],
        [
          ethers.utils.formatBytes32String('2'),
          ethers.utils.formatBytes32String('23'),
        ],
        { gasLimit: 5000000 }
      );
    await result.wait();

    const highestBidder = await contract.highestBidder();
    const highestBid = await contract.highestBid();

    expect(highestBid).to.equal(BigInt(hundredHbars));
    expect(highestBidder).to.equal(wallet1.address);
  });

  it('should confirm a user can withdraw', async function () {
    const contract = await deployBlindAuctionContract(
      5,
      5,
      beneficiary.address
    );

    const firstBid = ethers.utils.solidityKeccak256(
      ['uint256', 'bool', 'uint256'],
      [hundredHbars, false, ethers.utils.formatBytes32String('2')]
    );
    const secondBid = ethers.utils.solidityKeccak256(
      ['uint256', 'bool', 'uint256'],
      [twoHundredHbars, true, ethers.utils.formatBytes32String('23')]
    );
    const thirdBid = ethers.utils.solidityKeccak256(
      ['uint256', 'bool', 'uint256'],
      [twoHundredHbars, false, ethers.utils.formatBytes32String('5')]
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
    await sleep(2000);

    const result = await contract
      .connect(wallet1)
      .reveal(
        [hundredHbars, twoHundredHbars, twoHundredHbars],
        [false, true, false],
        [
          ethers.utils.formatBytes32String('2'),
          ethers.utils.formatBytes32String('23'),
          ethers.utils.formatBytes32String('5'),
        ],
        { gasLimit: 5000000 }
      );
    await result.wait();

    const highestBidder = await contract.highestBidder();
    const highestBid = await contract.highestBid();

    const balanceBeforeWithdraw = await contract.getBalance();

    const withdraw = await contract.connect(wallet1).withdraw();
    await withdraw.wait();

    const balanceAfterWithdraw = await await contract.getBalance();

    expect(balanceBeforeWithdraw).to.be.greaterThan(balanceAfterWithdraw);
    expect(highestBid).to.equal(BigInt(twoHundredHbars));
    expect(highestBidder).to.equal(wallet1.address);
  });

  it('should confirm a user can end an auction', async function () {
    const contract = await deployBlindAuctionContract(
      6,
      5,
      beneficiary.address
    );

    const firstBid = ethers.utils.solidityKeccak256(
      ['uint256', 'bool', 'uint256'],
      [hundredHbars, false, ethers.utils.formatBytes32String('2')]
    );
    const secondBid = ethers.utils.solidityKeccak256(
      ['uint256', 'bool', 'uint256'],
      [hundredHbars, true, ethers.utils.formatBytes32String('23')]
    );
    const thirdBid = ethers.utils.solidityKeccak256(
      ['uint256', 'bool', 'uint256'],
      [twoHundredHbars, false, ethers.utils.formatBytes32String('5')]
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

    await sleep(3000);

    const reveal = await contract
      .connect(wallet1)
      .reveal(
        [hundredHbars, twoHundredHbars, twoHundredHbars],
        [false, true, false],
        [
          ethers.utils.formatBytes32String('2'),
          ethers.utils.formatBytes32String('23'),
          ethers.utils.formatBytes32String('5'),
        ],
        { gasLimit: 5000000 }
      );
    await reveal.wait();

    const balanceBeforeAuctionEnd = await ethers.provider.getBalance(
      beneficiary.address
    );

    //this sleep is needed as part of the contract business logic
    //to ensure time has passed and we can end the auction
    //it is the revealEnd time + 5 seconds
    await sleep(2000);

    const result = await contract.connect(wallet1).auctionEnd();
    await result.wait();

    const balanceAfterAuctionEnd = await ethers.provider.getBalance(
      beneficiary.address
    );

    const highestBidder = await contract.highestBidder();
    const highestBid = await contract.highestBid();

    expect(highestBid).to.equal(BigInt(twoHundredHbars));
    expect(highestBidder).to.equal(wallet1.address);
    expect(balanceBeforeAuctionEnd).to.be.lessThan(balanceAfterAuctionEnd);
  });

  it('should confirm a user cannot bid after end', async function () {
    const contract = await deployBlindAuctionContract(
      4,
      2,
      beneficiary.address
    );
    const bidData = ethers.utils.solidityKeccak256(
      ['uint256', 'bool', 'uint256'],
      [hundredHbars, false, 2]
    );

    await sleep(5000);

    const result = await contract
      .connect(wallet1)
      .bid(bidData, { value: hundredHbarsToWeibar });
    await expect(result.wait()).to.eventually.be.rejected.and.have.property(
      'code',
      'CALL_EXCEPTION'
    );
  });

  it('should confirm a user cannot reveal after reveal end', async function () {
    const contract = await deployBlindAuctionContract(
      4,
      2,
      beneficiary.address
    );

    const bidData = ethers.utils.solidityKeccak256(
      ['uint256', 'bool', 'uint256'],
      [hundredHbars, false, 2]
    );
    const anotherBidData = ethers.utils.solidityKeccak256(
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

    await sleep(5000);

    const result = await contract
      .connect(wallet1)
      .reveal(
        [hundredHbars, twoHundredHbars],
        [false, true],
        [
          ethers.utils.formatBytes32String(2),
          ethers.utils.formatBytes32String(23),
        ]
      );
    await expect(result.wait()).to.eventually.be.rejected.and.have.property(
      'code',
      'CALL_EXCEPTION'
    );
  });
});
