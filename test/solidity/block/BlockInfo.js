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

describe('@solidityequiv1 BlockInfo Test Suite', function () {
  let blockInfo, provider, signers;

  before(async function () {
    signers = await ethers.getSigners();
    provider = signers[0].provider;

    const factory = await ethers.getContractFactory(Constants.Path.BLOCK_INFO);
    blockInfo = await factory.deploy({ gasLimit: 15000000 });
  });

  // Base fees do not adjust per block.
  it('should be able to execute getBlockBaseFee()', async function () {
    const blockBaseFee = await blockInfo.getBlockBaseFee();
    expect(blockBaseFee).to.equal(0);
  });

  it('should be able to get the hash of a given block when the block number is one of the 256 most recent blocks', async function () {
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    const blockHash = await blockInfo.getBlockHash(blockNumber);
    expect(block.hash).to.equal(blockHash);
  });

  it('should get the current block coinbase which is the hedera network account', async function () {
    const coinbase = await blockInfo.getMinerAddress();
    // 0.0.98 is the Hedera network account.  Alias is 0x0000000000000000000000000000000000000062
    expect(coinbase).to.equal('0x0000000000000000000000000000000000000062');
  });

  it('should get the current block prevrandao using block.prevrandao', async function () {
    let prevrandao;
    try {
      prevrandao = await blockInfo.getBlockPrevrando();
    } catch (e) {
      expect(e.code).to.equal('CALL_EXCEPTION');
      expect(e.message).to.contain('missing revert data in call exception');
      expect(e.reason).to.contain(
        'missing revert data in call exception; Transaction reverted without a reason string'
      );
    }
    expect(typeof prevrandao).to.equal('bigint');
  });

  // Turn off until mirror node issue is resolved: https://github.com/hashgraph/hedera-mirror-node/issues/7036
  it('should get the current block difficulty using block.difficulty (replaced by prevrandao)', async function () {
    let difficulty;
    try {
      difficulty = await blockInfo.getBlockDifficulty();
    } catch (e) {
      expect(e.code).to.equal('CALL_EXCEPTION');
      expect(e.message).to.contain('missing revert data in call exception');
      expect(e.reason).to.contain(
        'missing revert data in call exception; Transaction reverted without a reason string'
      );
    }
    expect(typeof difficulty).to.equal('bigint');
  });

  it('should get the block gas limit', async function () {
    const gasLimit = await blockInfo.getBlockGasLimit();
    expect(gasLimit).to.equal(15000000);
  });

  it('should get the block number', async function () {
    const blockNumber = await blockInfo.getBlockNumber();
    expect(blockNumber).to.exist;
  });

  it('should get the block timestamp', async function () {
    const timeStamp = await blockInfo.getBlockTimestamp();
    expect(isTimestamp(timeStamp)).to.equal(true);
  });
});

function isTimestamp(value) {
  // Ensure the value is a BigNumber
  if (!value) {
    return false;
  }

  const date = new Date(parseInt(value * 1000n));
  if (isNaN(date)) {
    return false;
  }

  const year = date.getUTCFullYear();
  return year >= 1970;
}
