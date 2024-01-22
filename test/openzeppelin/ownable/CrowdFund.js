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

describe('@OZOwnable Crowd Fund Test Suite', () => {
  const FUND_AMOUNT = 30000000000;
  const TINY_BAR_TO_WEI_COEF = 10_000_000_000;

  let crowdFund, signers, ownerAddress;

  beforeEach(async () => {
    signers = await ethers.getSigners();
    ownerAddress = await signers[0].getAddress();

    const crowdFundFactory = await ethers.getContractFactory(
      Constants.Contract.CrowdFund
    );

    crowdFund = await crowdFundFactory.deploy(ownerAddress);
  });

  it('Deployment', async () => {
    const contractOwner = await crowdFund.owner();
    const contractBalance = await crowdFund.balance();

    expect(contractBalance).to.eq(0);
    expect(contractOwner).to.eq(ownerAddress);
    expect(ethers.isAddress(await crowdFund.getAddress())).to.be.true;
  });

  it('Should deposit an amount of HBAR', async () => {
    // prepare funder
    const funder = signers[1];

    // prepare transaction
    const tx = await crowdFund.connect(funder).deposit({ value: FUND_AMOUNT });

    // wait for receipt
    const receipt = await tx.wait();

    // extract event arguments
    const [funderAddress, fundedAmount] = receipt.logs.map(
      (e) => e.fragment.name === 'Deposit' && e
    )[0].args;

    // retrieve contract balance
    const contractBalance = await crowdFund.balance();

    // assertions
    expect(funderAddress).to.eq(await funder.getAddress());
    expect(fundedAmount).to.eq(Math.round(FUND_AMOUNT / TINY_BAR_TO_WEI_COEF));
    expect(contractBalance).to.eq(
      Math.round(FUND_AMOUNT / TINY_BAR_TO_WEI_COEF)
    );
  });

  it('Should allow owner to withdraw an amount which is less than contract balance', async () => {
    // prepare signers
    const owner = signers[0];
    const funder = signers[1];

    // fund the contract by the funder
    await crowdFund.connect(funder).deposit({ value: FUND_AMOUNT });

    // prepare transaction to withdraw an amount by owner
    const WITHDRAWN_AMOUNT = 10000000000;
    const tx = await crowdFund
      .connect(owner)
      .withdraw(
        WITHDRAWN_AMOUNT / TINY_BAR_TO_WEI_COEF,
        Constants.GAS_LIMIT_1_000_000
      );

    // wait for receipt
    const receipt = await tx.wait();

    // extract event arguments
    const [ownerAddress, withdrawnAmount] = receipt.logs.map(
      (e) => e.fragment.name === 'Withdraw' && e
    )[0].args;

    // retrieve contract balance
    const contractBalance = await crowdFund.balance();

    // assertions
    expect(ownerAddress).to.eq(await owner.getAddress());
    expect(withdrawnAmount).to.eq(
      Math.floor(WITHDRAWN_AMOUNT / TINY_BAR_TO_WEI_COEF)
    );
    expect(contractBalance).to.eq(
      Math.floor((FUND_AMOUNT - WITHDRAWN_AMOUNT) / TINY_BAR_TO_WEI_COEF)
    );
  });

  it('Should NOT allow owner to withdraw an amount which is greater than the contract balance', async () => {
    let error;
    // prepare signers
    const owner = signers[0];
    const funder = signers[1];

    // fund the contract by the funder
    await crowdFund.connect(funder).deposit({ value: FUND_AMOUNT });

    // prepare transaction to withdraw an amount by owner
    const WITHDRAWN_AMOUNT = 40000000000; // > FUND_AMOUNT

    expect(
      crowdFund.connect(owner).withdraw(WITHDRAWN_AMOUNT / TINY_BAR_TO_WEI_COEF)
    ).to.be.reverted;

    const balance = await crowdFund.balance();
    expect(balance).to.eq(Math.round(FUND_AMOUNT / TINY_BAR_TO_WEI_COEF));
  });

  it('Should NOT allow non-owner address to withdraw', async () => {
    let error;
    try {
      const funder = signers[1];
      const tx = await crowdFund.connect(funder).withdraw(0);
      await tx.wait();
    } catch (e) {
      error = e;
    }

    expect(error).to.not.null;
  });

  it('Should transfer ownership to another owner', async () => {
    // prepare signers
    const currentOwnerAddress = ownerAddress;
    const newDesignatedOwnerAddress = await signers[1].getAddress();

    // prepare transferOwnership transaction
    const tx = await crowdFund.transferOwnership(newDesignatedOwnerAddress);

    // wait for receipt
    const receipt = await tx.wait();

    // extra event's args
    const [oldOwner, newOwner] = receipt.logs.map(
      (e) => e.fragment.name === 'OwnershipTransferred' && e
    )[0].args;

    // retrieve current contract owner
    const contractOwner = await crowdFund.owner();

    // assertions
    expect(oldOwner).to.eq(currentOwnerAddress);
    expect(newOwner).to.eq(newDesignatedOwnerAddress);
    expect(contractOwner).to.eq(newDesignatedOwnerAddress);
  });

  it('Should renounce ownership', async () => {
    // prepare renounceOwnership transaction
    const tx = await crowdFund.renounceOwnership(Constants.GAS_LIMIT_1_000_000);

    // wait for receipt
    const receipt = await tx.wait();

    // extra event's args
    const [oldOwner, newOwner] = receipt.logs.map(
      (e) => e.fragment.name === 'OwnershipTransferred' && e
    )[0].args;

    // retrieve current contract owner
    const contractOwner = await crowdFund.owner();

    // assertion
    expect(oldOwner).to.eq(ownerAddress);
    expect(newOwner).to.eq(ethers.ZeroAddress);
    expect(contractOwner).to.eq(ethers.ZeroAddress);
  });
});
