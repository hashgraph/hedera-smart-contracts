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

describe('@cancun SelfDestruct HIP-868 Test Suite', function () {
  const VALUE_AMOUNT = ethers.parseEther('3');
  let signerA, signerB;

  before(async () => {
    const signers = await ethers.getSigners();
    signerA = signers[0];
    signerB = signers[1];
  });

  it('Should deploy a contract that triggers selfdestruct in the SAME create transaction with the target IS NOT the same as the contract address', async () => {
    const originalSignerBBalance = await ethers.provider.getBalance(
      signerB.address
    );

    // deploy contract with a target address not the same as contract's address
    const factory = await ethers.getContractFactory(
      Constants.Contract.SelfDestructInSameCreateTx
    );
    const contract = await factory.deploy(signerB.address, {
      value: VALUE_AMOUNT,
      gasLimit: 1_000_000,
    });
    await contract.waitForDeployment();

    const updatedSignerBBalance = await ethers.provider.getBalance(
      signerB.address
    );
    const contractBalance = await ethers.provider.getBalance(contract.target);
    const contractCodeAfterSelfDestruct = await ethers.provider.getCode(
      contract.target
    );

    expect(updatedSignerBBalance - originalSignerBBalance).eq(VALUE_AMOUNT);
    expect(contractBalance).to.eq(0n);
    expect(contractCodeAfterSelfDestruct).to.eq('0x'); // empty
  });

  it('Should deploy a contract that triggers selfdestruct in the SAME create transaction with the target IS the same as the contract address', async () => {
    const factory = await ethers.getContractFactory(
      Constants.Contract.SelfDestructInSameCreateTxSameTarget
    );
    const contract = await factory.deploy({
      value: VALUE_AMOUNT,
      gasLimit: 1_000_000,
    });
    await contract.waitForDeployment();

    const contractBalance = await ethers.provider.getBalance(contract.target);
    const contractCodeAfterSelfDestruct = await ethers.provider.getCode(
      contract.target
    );

    expect(contractBalance).to.eq(0n);
    expect(contractCodeAfterSelfDestruct).to.eq('0x'); // empty
  });

  it('Should deploy a contract that trigger selfdestruct in a SEPARATE transaction with the target IS NOT the same as the contract address', async () => {
    const originalSignerBBalance = await ethers.provider.getBalance(
      signerB.address
    );

    const factory = await ethers.getContractFactory(
      Constants.Contract.SelfDestructInSeparateTx
    );
    const contract = await factory.deploy({
      value: VALUE_AMOUNT,
      gasLimit: 1_000_000,
    });
    await contract.waitForDeployment();

    const contractCodeBeforeSelfDestruct = await ethers.provider.getCode(
      contract.target
    );

    // trigger selfdestruct
    await (
      await contract.triggerSelfDestruct(
        signerB.address,
        Constants.GAS_LIMIT_1_000_000
      )
    ).wait();

    const updatedSignerBBalance = await ethers.provider.getBalance(
      signerB.address
    );
    const contractBalance = await ethers.provider.getBalance(contract.target);
    const contractCodeAfterSelfDestruct = await ethers.provider.getCode(
      contract.target
    );

    expect(updatedSignerBBalance - originalSignerBBalance).eq(VALUE_AMOUNT);
    expect(contractBalance).to.eq(0n);
    expect(contractCodeAfterSelfDestruct).to.eq(contractCodeBeforeSelfDestruct); // not empty
  });
  it('Should deploy a contract that trigger selfdestruct in a SEPARATE transaction with the target IS the same as the contract address', async () => {
    const factory = await ethers.getContractFactory(
      Constants.Contract.SelfDestructInSeparateTx
    );
    const contract = await factory.deploy({
      value: VALUE_AMOUNT,
      gasLimit: 1_000_000,
    });
    await contract.waitForDeployment();

    const contractCodeBeforeSelfDestruct = await ethers.provider.getCode(
      contract.target
    );

    // trigger selfdestruct
    await (
      await contract.triggerSelfDestruct(
        contract.target,
        Constants.GAS_LIMIT_1_000_000
      )
    ).wait();

    const contractCodeAfterSelfDestruct = await ethers.provider.getCode(
      contract.target
    );
    const contractBalance = await ethers.provider.getBalance(contract.target);

    expect(contractBalance).to.eq(0n);
    expect(contractCodeAfterSelfDestruct).to.eq(contractCodeBeforeSelfDestruct); // not empty
  });
});
