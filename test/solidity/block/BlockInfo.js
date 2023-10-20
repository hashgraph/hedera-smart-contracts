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
const { BigNumber } = require('ethers');
const Constants = require('../../constants')

describe('@solidityequiv1 BlockInfo Test Suite', function () {
  let blockInfo, provider, signers

  before(async function () {
    signers = await ethers.getSigners()
    provider = ethers.getDefaultProvider();
    
    const factory = await ethers.getContractFactory(Constants.Path.BLOCK_INFO)
    blockInfo = await factory. deploy({ gasLimit: 15000000 })
  })

  // EIP-1559 does not apply to Hedera.  Base fees do not adjust per block.
  it('should be able to execute getBlockBaseFee()', async function () {
    const blockBaseFee = await blockInfo.getBlockBaseFee()
    expect(blockBaseFee).to.equal(0)
  })

  // https://github.com/hashgraph/hedera-mirror-node/issues/7045
  it('should be able to get the hash of a given block when the block number is one of the 256 most recent blocks', async function () {
    const blockNumber = await provider.getBlockNumber()
    const block = await provider.getBlock(blockNumber)
    const blockHash = await blockInfo.getBlockHash()
    console.log(`Block hash: ${blockHash}`)
  })
  
  it('should get the current block coinbase which is the hedera network account', async function () { 
    const coinbase = await blockInfo.getMinerAddress()
    // 0.0.98 is the Hedera network account.  Alias is 0x0000000000000000000000000000000000000062
    expect(coinbase).to.equal('0x0000000000000000000000000000000000000062')
  })

  // Turn off until mirror node issue is resolved: https://github.com/hashgraph/hedera-mirror-node/issues/7036
  xit('should get the current block prevrandao using block.prevrandao', async function () { 
    const prevrandao = await blockInfo.getBlockPrevrando()  
    expect(BigNumber.isBigNumber(prevrandao)).to.be.true
  })

  // Turn off until mirror node issue is resolved: https://github.com/hashgraph/hedera-mirror-node/issues/7036
  xit('should get the current block difficulty using block.difficulty (replaced by prevrandao)', async function () { 
    const difficulty = await blockInfo.getBlockDifficulty()  
    expect(BigNumber.isBigNumber(difficulty)).to.be.true
  })

  it('should get the block gas limit', async function () { 
    const gasLimit = await blockInfo.getBlockGasLimit()
    expect(gasLimit).to.equal(9021272)
  })

  it('should get the block number', async function () { 
    const blockNumber = await blockInfo.getBlockNumber()
    expect(BigNumber.isBigNumber(blockNumber)).to.equal(true)
  })

  it('should get the block timestamp', async function () { 
    const timeStamp = await blockInfo.getBlockTimestamp()
    expect(isTimestamp(timeStamp)).to.equal(true)
  })


})

function isTimestamp(value) {
  // Ensure the value is a BigNumber
  if (!BigNumber.isBigNumber(value)) {
      return false;
  }

  const date = new Date(value * 1000);
  if (isNaN(date)) {
      return false;
  }

  const year = date.getUTCFullYear();
  return year >= 1970;
}





