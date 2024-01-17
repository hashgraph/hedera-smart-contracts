/*
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
const Constants = require('../../../constants');

describe('@OZERC1820 Test Suite', () => {
  let erc1820registry, wallet1, wallet2;

  const ERC777TOKEN_HASH = ethers.keccak256(
    ethers.toUtf8Bytes('ERC777TOKEN_HASH')
  );

  beforeEach(async () => {
    [wallet1, wallet2] = await ethers.getSigners();

    const erc1820RegistryFac = await ethers.getContractFactory(
      Constants.Contract.ERC1820Registry
    );
    erc1820registry = await erc1820RegistryFac.deploy();
  });

  it('Should deploy the registry', async () => {
    expect(erc1820registry).to.not.null;
    expect(ethers.isAddress(await erc1820registry.getAddress())).to.be.true;
  });

  it('Should get a manager of an address', async () => {
    const manager = await erc1820registry.getManager(wallet2.address);
    expect(manager).to.eq(wallet2.address);
  });

  it('Should set a new manager for an address', async () => {
    await erc1820registry
      .connect(wallet2)
      .setManager(wallet2.address, wallet1.address);

    const newManager = await erc1820registry.getManager(wallet2.address);
    expect(newManager).to.eq(wallet1.address);
  });

  it('Should NOT allow a non-manager to set a new manager', async () => {
    expect(
      erc1820registry
        .connect(wallet1)
        .setManager(wallet2.address, wallet1.address)
    ).to.eventually.be.rejected.and.have.property(
      'code',
      Constants.CALL_EXCEPTION
    );
  });

  it('Should get the implementer of an interface', async () => {
    const implementer = await erc1820registry.getInterfaceImplementer(
      wallet1.address,
      ERC777TOKEN_HASH
    );

    expect(implementer).to.eq(ethers.ZeroAddress);
  });

  it('Should set a new implementer for an interface', async () => {
    await erc1820registry.setInterfaceImplementer(
      wallet1.address,
      ERC777TOKEN_HASH,
      wallet1.address
    );

    const implementer = await erc1820registry.getInterfaceImplementer(
      wallet1.address,
      ERC777TOKEN_HASH
    );

    expect(implementer).to.eq(wallet1.address);
  });
});
