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
const { Contract } = require('ethers');
const Constants = require('../../../constants');

describe('@IHRC-906 Facade @CryptoAllowance  Test Suite', function () {
  let walletA, walletB, walletC, walletAIHRC906;
  const amount = 3_000;

  before(async () => {
    [walletA, walletB, walletC] = await ethers.getSigners();

    const IHRC906Facade = new ethers.Interface(
      (await hre.artifacts.readArtifact('IHRC906Facade')).abi
    );
    walletAIHRC906 = new Contract(walletA.address, IHRC906Facade, walletA);
  });

  it('should execute hbarApprove() by an EOA to grant an hbar allowance to another EOA', async () => {
    const tx = await walletAIHRC906.hbarApprove(
      walletB.address,
      amount,
      Constants.GAS_LIMIT_1_000_000
    );
    const receipt = await tx.wait();
    expect(receipt).to.exist;
    expect(receipt.status).to.eq(1);
  });

  // @notice: skipping until mirror-node fully enables HIP906
  xit('should execute hbarAllowance() by an EOA to retrieve allowance granted to a spender', async () => {
    const approveTx = await walletAIHRC906.hbarApprove(
      walletC.address,
      amount,
      Constants.GAS_LIMIT_1_000_000
    );
    await approveTx.wait();

    // @notice: staticCall() method gets the return values instead of transaction information
    const result = await walletAIHRC906.hbarAllowance.staticCall(
      walletC.address,
      Constants.GAS_LIMIT_1_000_000
    );

    const [responseCode, allowanceAmount] = result;

    expect(responseCode).to.eq(22n);
    expect(allowanceAmount).to.eq(amount);
  });
});
