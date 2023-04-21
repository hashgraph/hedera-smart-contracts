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
const Constants = require('../constants')

describe("ERC721 tests", function () {
  const tokenId = 33;
  let signers;
  let erc721;

  before(async function () {
    signers = await ethers.getSigners();

    const factory = await ethers.getContractFactory(Constants.Path.ERC721Mock);
    erc721 = await factory.deploy(Constants.TOKEN_NAME, 'TOKENSYMBOL');
    await erc721.mint(signers[0].address, tokenId);
  });

  it("should be able to execute name()", async function () {
    const res = await erc721.name();
    expect(res).to.equal(Constants.TOKEN_NAME);
  });

  it("should be able to execute symbol()", async function () {
    const res = await erc721.symbol();
    expect(res).to.equal('TOKENSYMBOL');
  });

  it("should be able to execute balanceOf(address)", async function () {
    const res = await erc721.balanceOf(signers[0].address);
    expect(res).to.eq(1);
  });

  it("should be able to execute ownerOf(uint256)", async function () {
    const res = await erc721.ownerOf(tokenId);
    expect(res).to.eq(signers[0].address);
  });

  it("should be able to execute approve(address,uint256)", async function () {
    const res = await erc721.approve(signers[1].address, tokenId);
    expect((await res.wait()).events.filter(e => e.event === Constants.Events.Approval)).to.not.be.empty;
  });

  it("should be able to execute getApproved(uint256)", async function () {
    const res = await erc721.getApproved(tokenId);
    expect(res).to.eq(signers[1].address);
  });

  it("should be able to execute setApprovalForAll(address,bool)", async function () {
    const res = await erc721.setApprovalForAll(signers[1].address, true);
    expect((await res.wait()).events.filter(e => e.event === Constants.Events.ApprovalForAll)).to.not.be.empty;
  });

  it("should be able to execute isApprovedForAll(address,address)", async function () {
    const res = await erc721.isApprovedForAll(signers[0].address, signers[1].address);
    expect(res).to.eq(true);
  });

  it("should be able to execute transferFrom(address,address,uint256)", async function () {
    const ownerBefore = await erc721.ownerOf(tokenId);
    await erc721.transferFrom(signers[0].address, signers[1].address, tokenId);
    const ownerAfter = await erc721.ownerOf(tokenId);
    expect(ownerBefore).to.not.eq(ownerAfter);
    expect(ownerAfter).to.eq(signers[1].address);
  });
});
