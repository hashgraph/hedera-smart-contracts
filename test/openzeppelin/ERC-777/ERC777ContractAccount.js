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
const Constants = require('../../constants');

describe('@OZERC777ContractAccount Test Suite', () => {
  let erc1820registry,
    erc777SenderHookImpl,
    erc777RecipientHookImpl,
    erc777Token,
    erc777ContractAccount,
    wallet1;

  const TOKENS_SENDER_INTERFACE_HASH = ethers.keccak256(
    ethers.toUtf8Bytes('ERC777TokensSender')
  );
  const TOKENS_RECIPIENT_INTERFACE_HASH = ethers.keccak256(
    ethers.toUtf8Bytes('ERC777TokensRecipient')
  );

  const TOKEN_NAME = 'Uranium Token';
  const TOKEN_SYMBOL = 'UT';
  const SENT_TOKEN_AMOUNT = 600;
  const TOTAL_TOKEN_AMOUNT = 3_000;
  const EMPTY_DATA = '0x';

  beforeEach(async () => {
    wallet1 = (await ethers.getSigners())[0];

    const ERC1820registryFac = await ethers.getContractFactory(
      Constants.Contract.ERC1820Registry
    );
    const ERC777SenderHookImplFac = await ethers.getContractFactory(
      Constants.Contract.ERC777SenderHookImpl
    );
    const ERC777RecipientHookImplFac = await ethers.getContractFactory(
      Constants.Contract.ERC777RecipientHookImpl
    );
    const ERC777TokenFac = await ethers.getContractFactory(
      Constants.Contract.ERC777Token
    );
    const ERC777ContractAccountFac = await ethers.getContractFactory(
      Constants.Contract.ERC777ContractAccount
    );

    erc1820registry = await ERC1820registryFac.deploy();
    erc777ContractAccount = await ERC777ContractAccountFac.deploy(
      await erc1820registry.getAddress()
    );

    erc1820registry = await ERC1820registryFac.deploy();
    erc777SenderHookImpl = await ERC777SenderHookImplFac.deploy();
    erc777RecipientHookImpl = await ERC777RecipientHookImplFac.deploy();
    erc777Token = await ERC777TokenFac.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      await erc1820registry.getAddress(),
      [],
      { gasLimit: 1_000_000 }
    );
    erc777ContractAccount = await ERC777ContractAccountFac.deploy(
      await erc1820registry.getAddress()
    );
  });

  it('Should deploy contracts properly', async () => {
    expect(ethers.isAddress(await erc1820registry.getAddress())).to.be.true;
    expect(ethers.isAddress(await erc777SenderHookImpl.getAddress())).to.be
      .true;
    expect(ethers.isAddress(await erc777RecipientHookImpl.getAddress())).to.be
      .true;
    expect(ethers.isAddress(await erc777Token.getAddress())).to.be.true;
    expect(ethers.isAddress(await erc777ContractAccount.getAddress())).to.be
      .true;
  });

  it('Should register ERC777TokensSender interface', async () => {
    await erc777ContractAccount.registerERC777TokensSender(
      await erc777SenderHookImpl.getAddress()
    );

    const implementer = await erc1820registry.getInterfaceImplementer(
      await erc777ContractAccount.getAddress(),
      TOKENS_SENDER_INTERFACE_HASH
    );

    expect(implementer).to.eq(await erc777SenderHookImpl.getAddress());
  });

  it('Should register ERC777TokensRecipient interface', async () => {
    await erc777ContractAccount.registerERC777TokensRecipient(
      await erc777RecipientHookImpl.getAddress()
    );

    const implementer = await erc1820registry.getInterfaceImplementer(
      await erc777ContractAccount.getAddress(),
      TOKENS_RECIPIENT_INTERFACE_HASH
    );

    expect(implementer).to.eq(await erc777RecipientHookImpl.getAddress());
  });

  it('Should send an amount of ERC777 token to a recipient', async () => {
    await erc777ContractAccount.registerERC777TokensSender(
      await erc777SenderHookImpl.getAddress()
    );

    await erc777ContractAccount.registerERC777TokensRecipient(
      await erc777RecipientHookImpl.getAddress()
    );

    await erc777Token
      .connect(wallet1)
      .mint(
        await erc777ContractAccount.getAddress(),
        TOTAL_TOKEN_AMOUNT,
        EMPTY_DATA,
        EMPTY_DATA
      );

    const initialErc777ContractAccountBalance = await erc777Token.balanceOf(
      await erc777ContractAccount.getAddress()
    );
    const initialWallet1Balance = await erc777Token.balanceOf(wallet1.address);

    const tx = await erc777ContractAccount.send(
      await erc777Token.getAddress(),
      wallet1.address,
      SENT_TOKEN_AMOUNT,
      EMPTY_DATA
    );

    await tx.wait();

    const currentErc777ContractAccountBalance = await erc777Token.balanceOf(
      await erc777ContractAccount.getAddress()
    );
    const currentWallet1Balance = await erc777Token.balanceOf(wallet1.address);

    expect(initialErc777ContractAccountBalance).to.eq(
      BigInt(TOTAL_TOKEN_AMOUNT)
    );
    expect(initialWallet1Balance).to.eq(BigInt(0));
    expect(currentErc777ContractAccountBalance).to.eq(
      BigInt(TOTAL_TOKEN_AMOUNT - SENT_TOKEN_AMOUNT)
    );
    expect(currentWallet1Balance).to.eq(BigInt(SENT_TOKEN_AMOUNT));
  });
});
