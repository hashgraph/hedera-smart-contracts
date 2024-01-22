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

describe('@solidityequiv2 New Keyword Test Suite', () => {
  let newContract;
  const CONTRACT_ALPHA = 'Alpha';
  const MESSAGE_ALPHA = 'Message from Alpha contract';

  before(async () => {
    const newContractFactory = await ethers.getContractFactory(
      Constants.Contract.New
    );

    newContract = await newContractFactory.deploy();
  });

  it('Create new contract using `new` keyword', async () => {
    await newContract.createContract(CONTRACT_ALPHA, MESSAGE_ALPHA);
    const newContractsInfo = await newContract.newContractsInfo(CONTRACT_ALPHA);

    expect(ethers.isAddress(newContractsInfo.contractAddr)).to.be.true;
    expect(newContractsInfo.message).to.eq(MESSAGE_ALPHA);
  });

  it('Create new contract using `new` keyword with data', async () => {
    await newContract.createContractWithData(CONTRACT_ALPHA, MESSAGE_ALPHA);
    const newContractsInfo = await newContract.newContractsInfo(CONTRACT_ALPHA);

    expect(ethers.isAddress(newContractsInfo.contractAddr)).to.be.true;
    expect(newContractsInfo.message).to.eq(MESSAGE_ALPHA);
  });

  it('Create new contract using `new` keyword with salt', async () => {
    const SALT = ethers.encodeBytes32String('salt');

    await newContract.createContractWithSalt(
      SALT,
      CONTRACT_ALPHA,
      MESSAGE_ALPHA
    );
    const newContractsInfo = await newContract.newContractsInfo(CONTRACT_ALPHA);

    expect(ethers.isAddress(newContractsInfo.contractAddr)).to.be.true;
    expect(newContractsInfo.message).to.eq(MESSAGE_ALPHA);
  });
});
