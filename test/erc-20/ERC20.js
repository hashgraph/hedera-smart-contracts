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

const { expect } = require("chai");
const { ethers } = require("hardhat");
const Constants = require('../constants')

describe("ERC20 tests", function () {
  const amount = 33;
  let signers;
  let erc20;

  before(async function () {
    signers = await ethers.getSigners();

    const factory = await ethers.getContractFactory(Constants.Path.ERC20Mock);
    erc20 = await factory.deploy(Constants.TOKEN_NAME, 'TOKENSYMBOL');
    await erc20.mint(signers[0].address, 1000);
  });

  it("should be able to execute name()", async function () {
    const res = await erc20.name();
    expect(res).to.equal(Constants.TOKEN_NAME);
  });

  it("should be able to execute symbol()", async function () {
    const res = await erc20.symbol();
    expect(res).to.equal('TOKENSYMBOL');
  });

  it("should be able to execute decimals()", async function () {
    const res = await erc20.decimals();
    expect(res).to.equal(18);
  });

  it("should be able to execute totalSupply()", async function () {
    const res = await erc20.totalSupply();
    expect(res).to.equal(1000);
  });

  it("should be able to get execute balanceOf(address)", async function () {
    const res1 = await erc20.balanceOf(signers[0].address);
    expect(res1).to.equal(1000);

    const res2 = await erc20.balanceOf(signers[1].address);
    expect(res2).to.equal(0);
  });

  it("should be able to execute approve(address,uint256)", async function () {
    const res = await erc20.approve(erc20.address, amount);
    expect((await res.wait()).events.filter(e => e.event === Constants.Events.Approval)).to.not.be.empty;
  });

  it("should be able to execute allowance(address,address,uint256)", async function () {
    const res = await erc20.allowance(signers[0].address, erc20.address);
    expect(res).to.eq(amount);
  });

  it("should be able to execute transfer(address,uint256)", async function () {
    const balanceBefore = await erc20.balanceOf(signers[1].address);
    await erc20.transfer(signers[1].address, 33);
    const balanceAfter = await erc20.balanceOf(signers[1].address);
    expect(balanceBefore).to.not.eq(balanceAfter);
    expect(balanceAfter).to.eq(parseInt(balanceBefore) + amount);
  });

  it("should be able to execute transferFrom(address,address,uint256)", async function () {
    await erc20.approve(signers[1].address, amount);
    const erc20Signer2 = erc20.connect(signers[1]);

    const balanceBefore = await erc20.balanceOf(erc20.address);
    await erc20Signer2.transferFrom(signers[0].address, erc20.address, 33);
    const balanceAfter = await erc20.balanceOf(erc20.address);

    expect(balanceBefore).to.not.eq(balanceAfter);
    expect(balanceAfter).to.eq(parseInt(balanceBefore) + amount);
  });
});
