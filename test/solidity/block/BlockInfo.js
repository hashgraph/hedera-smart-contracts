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
const { expect } = require('chai')
const { ethers } = require('hardhat')
const Constants = require('../../constants')

describe('BlockInfo Test Suite', function () {
  let blockInfo, provider, signers

  before(async function () {
    signers = await ethers.getSigners()
    // const ethers = hre.ethers;
    provider = ethers.getDefaultProvider();
    
    const factory = await ethers.getContractFactory(Constants.Path.BLOCK_INFO)
    blockInfo = await factory.  deploy()
  })

  // EIP-1559 does not apply to Hedera
  it('should be able to execute getBlockBaseFee()', async function () {
    const blockBaseFee = await blockInfo.getBlockBaseFee()
    expect(blockBaseFee).to.equal(0)
  })

  xit('should be able to get the hash of a given block when the block number is one of the 256 most recent blocks', async function () {
    const blockNumber = await provider.getBlockNumber()
    const block = await provider.getBlock(blockNumber)
    const blockHash = await blockInfo.getBlockHash(blockNumber)
    expect(blockHash).to.equal(block.hash)
  })

  xit('should get the current block miners address using block.coinbase', async function () { 
    const blockNumber = await provider.getBlockNumber()
    const block = await provider.getBlock(blockNumber)
    const coinbase = await blockInfo.getMinerAddress()
    expect(coinbase).to.equal(block.miner)
  })

  xit('should get the current block prevrandao using block.prevrandao', async function () { 
    const blockNumber = await provider.getBlockNumber()
    const block = await provider.getBlock(blockNumber)
    const prevrandao = await blockInfo.getBlockPrevrando()
    console.log(`Prevrandao: ${prevrandao}`)
    // expect(prevrandao).to.equal(block.prevrandao)
  })

})