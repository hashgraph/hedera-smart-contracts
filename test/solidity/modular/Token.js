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

describe('@solidityequiv2 Modular Token Test Suite', () => {
  const INITIAL_AMOUNT = 12000;
  let modularTokenContract, signers, accountA, accountB;

  beforeEach(async () => {
    signers = await ethers.getSigners();
    accountA = await signers[0].getAddress();
    accountB = await signers[1].getAddress();

    const modularTokenContractFactory = await ethers.getContractFactory(
      Constants.Contract.Token
    );

    modularTokenContract = await modularTokenContractFactory.deploy(
      INITIAL_AMOUNT
    );
  });

  it('Deployment', async () => {
    const initialBalance = await modularTokenContract.balanceOf(
      accountA // deployer
    );

    expect(initialBalance).to.eq(INITIAL_AMOUNT);
    expect(ethers.isAddress(await modularTokenContract.getAddress())).to.be
      .true;
  });

  it('Should transfer an `amount` of token from `msg.sender` to `to` address', async () => {
    const TRANSFER_AMOUNT = 3000;

    // execute transaction
    const tx = await modularTokenContract.transfer(accountB, TRANSFER_AMOUNT);

    // retrieve states from event
    const receipt = await tx.wait();
    const event = receipt.logs.map(
      (e) => e.fragment.name === 'Transfer' && e
    )[0];
    const [from, to, amount] = event.args;

    // retrieve balances after transfer
    const accountABalance = await modularTokenContract.balanceOf(accountA);
    const accountBBalance = await modularTokenContract.balanceOf(accountB);

    // assertion
    expect(from).to.eq(accountA);
    expect(to).to.eq(accountB);
    expect(amount).to.eq(TRANSFER_AMOUNT);
    expect(accountABalance).to.eq(INITIAL_AMOUNT - TRANSFER_AMOUNT);
    expect(accountBBalance).to.eq(TRANSFER_AMOUNT);
  });

  it('Should let `msg.sender` approve an `amount` of allowance for `spender`', async () => {
    const ALLOWANCE = 3000;

    // execute transaction
    const tx = await modularTokenContract.approve(accountB, ALLOWANCE);

    // retrieve states from event
    const receipt = await tx.wait();
    const event = receipt.logs.map(
      (e) => e.fragment.name === 'Approval' && e
    )[0];
    const [owner, spender, allowance] = event.args;

    // retrieve allowance from contract
    const storageAllowance = await modularTokenContract.allowance(
      accountA,
      accountB
    );

    // assertion
    expect(owner).to.eq(accountA);
    expect(spender).to.eq(accountB);
    expect(allowance).to.eq(ALLOWANCE);
    expect(storageAllowance).to.eq(ALLOWANCE);
  });

  it('Should let `msg.sender` transfer an `amount` to `to` on behalf of `from`', async () => {
    const ALLOWANCE = 3000;

    // accountA first need to approve an allowance for accountB
    await modularTokenContract.approve(accountB, ALLOWANCE);

    // execute transferFrom by signer[1] (i.e. accountB)
    const tx = await modularTokenContract
      .connect(signers[1])
      .transferFrom(
        accountA,
        accountB,
        ALLOWANCE,
        Constants.GAS_LIMIT_1_000_000
      );

    // retrieve states from event
    const receipt = await tx.wait();
    const event = receipt.logs.map(
      (e) => e.fragment.name === 'Transfer' && e
    )[0];
    const [from, to, amount] = event.args;

    // retrieve balances and allowance from storage
    const accountABalance = await modularTokenContract.balanceOf(accountA);
    const accountBBalance = await modularTokenContract.balanceOf(accountB);

    // assertion
    expect(to).to.eq(accountB);
    expect(from).to.eq(accountA);
    expect(amount).to.eq(ALLOWANCE);
    expect(accountBBalance).to.eq(ALLOWANCE);
    expect(accountABalance).to.eq(INITIAL_AMOUNT - ALLOWANCE);
  });
});
