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

describe('@OZERC20 Test Suite', function () {
  const amount = 33;
  let signers;
  let erc20;

  before(async function () {
    signers = await ethers.getSigners();

    const factory = await ethers.getContractFactory(
      Constants.Contract.OZERC20Mock
    );
    erc20 = await factory.deploy(Constants.TOKEN_NAME, 'TOKENSYMBOL');
    await erc20.mint(signers[0].address, 1000);
  });

  it('should be able to execute name()', async function () {
    const res = await erc20.name();
    expect(res).to.equal(Constants.TOKEN_NAME);
  });

  it('should be able to execute symbol()', async function () {
    const res = await erc20.symbol();
    expect(res).to.equal('TOKENSYMBOL');
  });

  it('should be able to execute decimals()', async function () {
    const res = await erc20.decimals();
    expect(res).to.equal(18);
  });

  it('should be able to execute totalSupply()', async function () {
    const res = await erc20.totalSupply();
    // Try if res match 1000, if not the same, try it a few times then throw error
    const maxTry = 10;
    let tryCount = 0;
    while (res !== 1000) {
      tryCount++;
      if (tryCount > maxTry) {
        throw new Error('totalSupply() does not match 1000');
      }
      res = await erc20.totalSupply();
      sleep(1000);
    }
    expect(res).to.equal(1000);
  });

  it('should be able to get execute balanceOf(address)', async function () {
    const res1 = await erc20.balanceOf(signers[0].address);
    // Try if res match 1000, if not the same, try it a few times then throw error
    const maxTry = 10;
    let tryCount = 0;
    while (res !== 1000) {
      tryCount++;
      if (tryCount > maxTry) {
        throw new Error('totalSupply() does not match 1000');
      }
      res = await erc20.totalSupply();
      sleep(1000);
    }
    expect(res).to.equal(1000);

    const res2 = await erc20.balanceOf(signers[1].address);
    expect(res2).to.equal(0);
  });

  it('should be able to execute approve(address,uint256)', async function () {
    const res = await erc20.approve(await erc20.getAddress(), amount);
    expect(
      (await res.wait()).logs.filter(
        (e) => e.fragment.name === Constants.Events.Approval
      )
    ).to.not.be.empty;
  });

  it('should be able to execute allowance(address,address,uint256)', async function () {
    const res = await erc20.allowance(
      signers[0].address,
      await erc20.getAddress()
    );
    // Try if res match amount, if not the same, try it a few times then throw error
    const maxTry = 10;
    let tryCount = 0;
    while (res !== amount) {
      tryCount++;
      if (tryCount > maxTry) {
        throw new Error('allowance() does not match amount');
      }
      res = await erc20.allowance(signers[0].address, await erc20.getAddress());
      sleep(1000);
    }
    expect(res).to.eq(amount);
  });

  it('should be able to execute transfer(address,uint256)', async function () {
    const balanceBefore = await erc20.balanceOf(signers[1].address);
    await erc20.transfer(signers[1].address, 33);
    const balanceAfter = await erc20.balanceOf(signers[1].address);
    // Try if res match 1000
    const maxTry = 10;
    let tryCount = 0;
    while (balanceBefore !== balanceAfter) {
      tryCount++;
      if (tryCount > maxTry) {
        throw new Error('balanceBefore does not match balanceAfter');
      }
      balanceAfter = await erc20.balanceOf(signers[1].address);
      sleep(1000);
    }
    expect(balanceBefore).to.not.eq(balanceAfter);
    expect(balanceAfter).to.eq(parseInt(balanceBefore) + amount);
  });

  it('should be able to execute transferFrom(address,address,uint256)', async function () {
    await erc20.approve(signers[1].address, amount);
    const erc20Signer2 = erc20.connect(signers[1]);

    const balanceBefore = await erc20.balanceOf(await erc20.getAddress());
    await erc20Signer2.transferFrom(
      signers[0].address,
      await erc20.getAddress(),
      33
    );
    const balanceAfter = await erc20.balanceOf(await erc20.getAddress());

    console.log(`balanceBefore = *${balanceBefore}*`);
    console.log(`balanceAfter = *${balanceAfter}*`);
    expect(balanceBefore).to.not.eq(balanceAfter);
    expect(balanceAfter).to.eq(parseInt(balanceBefore) + amount);
  });
});
