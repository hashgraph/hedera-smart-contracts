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

describe('@OZERC1155 Test Suite', function () {
  const uri = 'testuri';
  const tokenId1 = 1;
  const tokenId2 = 33;
  const token1InitialMint = 100;
  const token2InitialMint = 300;
  const tradeableAmount = 10;
  let signers;
  let erc1155;

  before(async function () {
    signers = await ethers.getSigners();

    const factory = await ethers.getContractFactory(
      Constants.Contract.ERC1155Mock
    );
    erc1155 = await factory.deploy(uri);
    await erc1155.mintBatch(
      signers[0].address,
      [tokenId1, tokenId2],
      [token1InitialMint, token2InitialMint],
      '0x'
    );
  });

  it('should be able to execute uri(uint256) and returns the same URI for all token types', async function () {
    const res1 = await erc1155.uri(tokenId1);
    const res2 = await erc1155.uri(tokenId2);
    const res3 = await erc1155.uri(3);
    expect(res1).to.eq(res2).to.eq(res3);
  });

  it('should be able to execute balanceOf(address,uint256)', async function () {
    const res = await erc1155.balanceOf(signers[0].address, tokenId1);
    expect(res).to.eq(token1InitialMint);
    const res2 = await erc1155.balanceOf(signers[0].address, tokenId2);
    expect(res2).to.eq(token2InitialMint);
  });

  it('should be able to execute balanceOfBatch(address[],uint256[])', async function () {
    const res = await erc1155.balanceOfBatch(
      [signers[0].address, signers[0].address],
      [tokenId1, tokenId2]
    );
    expect(res[0]).to.eq(token1InitialMint);
    expect(res[1]).to.eq(token2InitialMint);
  });

  it('should be able to execute setApprovalForAll(address,bool)', async function () {
    const res = await erc1155.setApprovalForAll(signers[1].address, true);
    expect(
      (await res.wait()).logs.filter(
        (e) => e.fragment.name === Constants.Events.ApprovalForAll
      )
    ).to.not.be.empty;
  });

  it('should be able to execute isApprovedForAll(address,address)', async function () {
    const res = await erc1155.isApprovedForAll(
      signers[0].address,
      signers[1].address
    );
    expect(res).to.eq(true);
  });

  it('should be able to execute safeTransferFrom(address,address,uint256,uint256,bytes)', async function () {
    const balanceBefore = await erc1155.balanceOf(signers[1].address, tokenId1);
    const tx = await erc1155.safeTransferFrom(
      signers[0].address,
      signers[1].address,
      tokenId1,
      tradeableAmount,
      '0x'
    );
    await tx.wait();
    const balanceAfter = await erc1155.balanceOf(signers[1].address, tokenId1);

    expect(balanceBefore).to.not.eq(balanceAfter);
    expect(balanceAfter).to.eq(parseInt(balanceBefore) + tradeableAmount);
  });

  it('should be able to execute safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)', async function () {
    const balanceBefore1 = await erc1155.balanceOf(
      signers[1].address,
      tokenId1
    );
    const balanceBefore33 = await erc1155.balanceOf(
      signers[1].address,
      tokenId2
    );
    const tx = await erc1155.safeBatchTransferFrom(
      signers[0].address,
      signers[1].address,
      [tokenId1, tokenId2],
      [tradeableAmount, tradeableAmount],
      '0x',
      Constants.GAS_LIMIT_1_000_000
    );
    await tx.wait();

    const balanceAfter1 = await erc1155.balanceOf(signers[1].address, tokenId1);
    const balanceAfter33 = await erc1155.balanceOf(
      signers[1].address,
      tokenId2
    );

    expect(balanceBefore1).to.not.eq(balanceAfter1);
    expect(balanceAfter1).to.eq(parseInt(balanceBefore1) + tradeableAmount);
    expect(balanceBefore33).to.not.eq(balanceAfter33);
    expect(balanceAfter33).to.eq(parseInt(balanceBefore33) + tradeableAmount);
  });
});
