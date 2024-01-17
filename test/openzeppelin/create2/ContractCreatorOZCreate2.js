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

describe('@OZCreate2 Test Suite', async () => {
  let contractCreatorOZCreate2;
  const INITIAL_VALUE = 30_000_000_000;
  const NEW_CONTRACT_EVENT = 'NewContractDeployedAt';
  const TARGET_CONTRACT_CREATION_CODE =
    '0x6080604052610143806100115f395ff3fe608060405234801561000f575f80fd5b5060043610610034575f3560e01c8063a87d942c14610038578063d14e62b814610056575b5f80fd5b610040610072565b60405161004d919061009b565b60405180910390f35b610070600480360381019061006b91906100e2565b61007a565b005b5f8054905090565b805f8190555050565b5f819050919050565b61009581610083565b82525050565b5f6020820190506100ae5f83018461008c565b92915050565b5f80fd5b6100c181610083565b81146100cb575f80fd5b50565b5f813590506100dc816100b8565b92915050565b5f602082840312156100f7576100f66100b4565b5b5f610104848285016100ce565b9150509291505056fea264697066735822122067b162261c6513cb39839cd539597b324277f8ea3c28108d2ad498475dfa578064736f6c63430008140033';
  const TARGET_CONTRACT_CODE_HASH =
    '0xfe131e3071808ee9d140a8930ecf11a0f2dda60e626df1983bc19ea581f00d4b';

  before(async () => {
    const factory = await ethers.getContractFactory(
      Constants.Contract.ContractCreatorOZCreate2
    );
    contractCreatorOZCreate2 = await factory.deploy({
      gasLimit: 1000000,
      value: INITIAL_VALUE,
    });
  });

  it('Should deployed contractCreatorOZCreate2 with correct deployed arguments', async () => {
    const balance = await ethers.provider.getBalance(
      await contractCreatorOZCreate2.getAddress()
    );

    expect(balance).to.eq(INITIAL_VALUE);
    expect(ethers.isAddress(await contractCreatorOZCreate2.getAddress())).to.be
      .true;
  });

  it('Should deploy contract using OZ/Create2 library', async () => {
    const DEPLOYED_AMOUNT = 1;
    const SALT = 3;
    const tx = await contractCreatorOZCreate2.deploy(
      DEPLOYED_AMOUNT,
      SALT,
      TARGET_CONTRACT_CREATION_CODE
    );

    const receipt = await tx.wait();

    const [address] = receipt.logs.map(
      (e) => e.fragment.name === NEW_CONTRACT_EVENT && e
    )[0].args;

    expect(ethers.isAddress(address)).to.be.true;
  });

  it("Should NOT deploy if `amount` is greater than factory's balance", async () => {
    const SALT = 6;
    const DEPLOYED_AMOUNT = 4;
    const tx = await contractCreatorOZCreate2.deploy(
      DEPLOYED_AMOUNT,
      SALT,
      TARGET_CONTRACT_CREATION_CODE,
      Constants.GAS_LIMIT_1_000_000
    );

    try {
      await tx.wait();
    } catch (error) {
      expect(error).to.exist;
    }
  });

  it('Should NOT deploy if `salt` is not unique', async () => {
    const SALT = 9;
    const DEPLOYED_AMOUNT = 1;
    const tx1 = await contractCreatorOZCreate2.deploy(
      DEPLOYED_AMOUNT,
      SALT,
      TARGET_CONTRACT_CREATION_CODE,
      Constants.GAS_LIMIT_1_000_000
    );

    const receipt1 = await tx1.wait();
    const [address] = receipt1.logs.map(
      (e) => e.fragment.name === NEW_CONTRACT_EVENT && e
    )[0].args;

    expect(ethers.isAddress(address)).to.be.true;

    const tx2 = await contractCreatorOZCreate2.deploy(
      DEPLOYED_AMOUNT,
      SALT, // same salt
      TARGET_CONTRACT_CREATION_CODE,
      Constants.GAS_LIMIT_1_000_000
    );

    try {
      await tx2.wait();
    } catch (error) {
      expect(error).to.exist;
    }
  });

  it('Should NOT deploy if `bytecode` is empty', async () => {
    const SALT = 12;
    const DEPLOYED_AMOUNT = 1;
    const EMPTY_BYTECODE = '0x';
    const tx = await contractCreatorOZCreate2.deploy(
      DEPLOYED_AMOUNT,
      SALT,
      EMPTY_BYTECODE,
      Constants.GAS_LIMIT_1_000_000
    );

    try {
      await tx.wait();
    } catch (error) {
      expect(error).to.exist;
    }
  });

  it('Should compute the address using `salt` and `bytecodehash`', async () => {
    const SALT = 15;
    const address = await contractCreatorOZCreate2.computeAddress(
      SALT,
      TARGET_CONTRACT_CODE_HASH
    );

    const DEPLOYED_AMOUNT = 1;
    const deployedTx = await contractCreatorOZCreate2.deploy(
      DEPLOYED_AMOUNT,
      SALT,
      TARGET_CONTRACT_CREATION_CODE
    );
    const receipt = await deployedTx.wait();

    const [expectedAddress] = receipt.logs.map(
      (e) => e.fragment.name === NEW_CONTRACT_EVENT && e
    )[0].args;

    expect(address).to.eq(expectedAddress);
  });
});
