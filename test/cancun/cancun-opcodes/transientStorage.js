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

describe('@cancun Transient Storage Test Suite', function () {
  const VALUE = 7;
  const TRANSIENT_SLOT = 3;
  const REGULAR_SLOT = 9;
  let cancunOpcodeContract;

  before(async () => {
    const cancunOpcodeFac = await ethers.getContractFactory(
      Constants.Contract.CancunOpcodes
    );
    cancunOpcodeContract = await cancunOpcodeFac.deploy();
  });

  it('Should read/write value to transient storage using tstore/tload', async () => {
    // .transientStorage() will write `VALUE` to transient storage at `TRANSIENT_SLOT` using tstore,
    // then read `VALUE` from transient storage, using tload, into memory variable, val,
    // and finally write `val` to regular storage at `REGULAR_SLOT`
    const tx = await cancunOpcodeContract.transientStorage(
      VALUE,
      TRANSIENT_SLOT,
      REGULAR_SLOT,
      Constants.GAS_LIMIT_1_000_000
    );
    await tx.wait();

    const valueFromTransientStorage =
      await cancunOpcodeContract.getStorageAt(TRANSIENT_SLOT);
    const valueFromRegularStorage =
      await cancunOpcodeContract.getStorageAt(REGULAR_SLOT);

    expect(valueFromTransientStorage).to.eq(0n);
    expect(valueFromRegularStorage).to.eq(VALUE);
  });

  it('Should execute execute memoryCopy() to retrieve the contract address', async () => {
    // .memoryCopy() stores the address of this contract at the next available pointer, then copy the address from that pointer offset to offset 0x0.
    // Eventually, return the value at offset 0x0, the address of the contract.
    const tx = await cancunOpcodeContract.memoryCopy(
      Constants.GAS_LIMIT_1_000_000
    );

    const receipt = await tx.wait();

    const actualContractAddress = receipt.logs.find(
      (e) => e.fragment.name === 'ContractAddress'
    ).args[0];
    const expectedContractAddress = cancunOpcodeContract.target;

    expect(actualContractAddress).to.eq(expectedContractAddress);
  });
});
