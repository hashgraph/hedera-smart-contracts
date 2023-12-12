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

describe('@OZERC777ContractAccount Tests', () => {
  let erc1820registry,
    erc777SenderHookImpl,
    erc777RecipientHookImpl,
    erc777Token,
    erc777ContractAccount,
    wallet1;

  const TOKENS_SENDER_INTERFACE_HASH = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes('ERC777TokensSender')
  );
  const TOKENS_RECIPIENT_INTERFACE_HASH = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes('ERC777TokensRecipient')
  );

  const TOKEN_NAME = 'Uranium Token';
  const TOKEN_SYMBOL = 'UT';
  const SENT_TOKEN_AMOUNT = 600;
  const TOTAL_TOKEN_AMOUNT = 3_000;
  const EMPTY_DATA = '0x';

  beforeEach(async () => {
    wallet1 = await ethers.getSigner();

    const ERC1820registryFac = await ethers.getContractFactory(
      'ERC1820Registry'
    );
    const ERC777SenderHookImplFac = await ethers.getContractFactory(
      'ERC777SenderHookImpl'
    );
    const ERC777RecipientHookImplFac = await ethers.getContractFactory(
      'ERC777RecipientHookImpl'
    );
    const ERC777TokenFac = await ethers.getContractFactory('ERC777Token');
    const ERC777ContractAccountFac = await ethers.getContractFactory(
      'ERC777ContractAccount'
    );

    erc1820registry = await ERC1820registryFac.deploy();
    erc777ContractAccount = await ERC777ContractAccountFac.deploy(
      erc1820registry.address
    );

    erc1820registry = await ERC1820registryFac.deploy();
    erc777SenderHookImpl = await ERC777SenderHookImplFac.deploy();
    erc777RecipientHookImpl = await ERC777RecipientHookImplFac.deploy();
    erc777Token = await ERC777TokenFac.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      erc1820registry.address,
      [],
      { gasLimit: 1_000_000 }
    );
    erc777ContractAccount = await ERC777ContractAccountFac.deploy(
      erc1820registry.address
    );
  });

  it('Should deploy contracts properly', async () => {
    expect(ethers.utils.isAddress(erc1820registry.address)).to.be.true;
    expect(ethers.utils.isAddress(erc777SenderHookImpl.address)).to.be.true;
    expect(ethers.utils.isAddress(erc777RecipientHookImpl.address)).to.be.true;
    expect(ethers.utils.isAddress(erc777Token.address)).to.be.true;
    expect(ethers.utils.isAddress(erc777ContractAccount.address)).to.be.true;
  });

  it('Should register ERC777TokensSender interface', async () => {
    await erc777ContractAccount.registerERC777TokensSender(
      erc777SenderHookImpl.address
    );

    const implementer = await erc1820registry.getInterfaceImplementer(
      erc777ContractAccount.address,
      TOKENS_SENDER_INTERFACE_HASH
    );

    expect(implementer).to.eq(erc777SenderHookImpl.address);
  });

  it('Should register ERC777TokensRecipient interface', async () => {
    await erc777ContractAccount.registerERC777TokensRecipient(
      erc777RecipientHookImpl.address
    );

    const implementer = await erc1820registry.getInterfaceImplementer(
      erc777ContractAccount.address,
      TOKENS_RECIPIENT_INTERFACE_HASH
    );

    expect(implementer).to.eq(erc777RecipientHookImpl.address);
  });

  it('Should send an amount of ERC777 token to a recipient', async () => {
    await erc777ContractAccount.registerERC777TokensSender(
      erc777SenderHookImpl.address
    );

    await erc777ContractAccount.registerERC777TokensRecipient(
      erc777RecipientHookImpl.address
    );

    await erc777Token
      .connect(wallet1)
      .mint(
        erc777ContractAccount.address,
        TOTAL_TOKEN_AMOUNT,
        EMPTY_DATA,
        EMPTY_DATA
      );

    const initialErc777ContractAccountBalance = await erc777Token.balanceOf(
      erc777ContractAccount.address
    );
    const initialWallet1Balance = await erc777Token.balanceOf(wallet1.address);

    const tx = await erc777ContractAccount.send(
      erc777Token.address,
      wallet1.address,
      SENT_TOKEN_AMOUNT,
      EMPTY_DATA
    );

    await tx.wait();

    const currentErc777ContractAccountBalance = await erc777Token.balanceOf(
      erc777ContractAccount.address
    );
    const currentWallet1Balance = await erc777Token.balanceOf(wallet1.address);

    expect(initialErc777ContractAccountBalance).to.eq(
      ethers.BigNumber.from(TOTAL_TOKEN_AMOUNT)
    );
    expect(initialWallet1Balance).to.eq(ethers.BigNumber.from(0));
    expect(currentErc777ContractAccountBalance).to.eq(
      ethers.BigNumber.from(TOTAL_TOKEN_AMOUNT - SENT_TOKEN_AMOUNT)
    );
    expect(currentWallet1Balance).to.eq(
      ethers.BigNumber.from(SENT_TOKEN_AMOUNT)
    );
  });
});
