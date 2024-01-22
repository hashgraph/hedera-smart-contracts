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

describe('@OZERC777 Test Suite', () => {
  let erc1820registry,
    erc777SenderHookImpl,
    erc777RecipientHookImpl,
    erc777Token,
    erc777ContractAccount;

  let wallet1, wallet2, wallet3, wallet4, defaultOperators;

  const TOKEN_NAME = 'Uranium Token';
  const TOKEN_SYMBOL = 'UT';
  const SENT_TOKEN_AMOUNT = 600;
  const BURNT_TOKEN_AMOUNT = 900;
  const TOTAL_TOKEN_AMOUNT = 3_000;
  const EMPTY_DATA = '0x';
  const ADDRESS_ZERO = ethers.ZeroAddress;

  beforeEach(async () => {
    [wallet1, wallet2, wallet3, wallet4] = await ethers.getSigners();
    defaultOperators = [wallet3.address, wallet4.address];

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
    erc777SenderHookImpl = await ERC777SenderHookImplFac.deploy();
    erc777RecipientHookImpl = await ERC777RecipientHookImplFac.deploy();
    erc777Token = await ERC777TokenFac.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      await erc1820registry.getAddress(),
      defaultOperators,
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

  it('Should call token information view functions in ERC777Token', async () => {
    const tokenName = await erc777Token.name();
    const tokenSymbol = await erc777Token.symbol();
    const totalSupply = await erc777Token.totalSupply();
    const granularity = await erc777Token.granularity();

    expect(tokenName).to.eq(TOKEN_NAME);
    expect(tokenSymbol).to.eq(TOKEN_SYMBOL);
    expect(totalSupply).to.eq(0);
    expect(granularity).to.eq(1);
  });

  it('Should mint an amount of token to address', async () => {
    const tx = await erc777Token
      .connect(wallet1)
      .mint(wallet2.address, TOTAL_TOKEN_AMOUNT, EMPTY_DATA, EMPTY_DATA);
    const receipt = await tx.wait();
    const mintedEvent = receipt.logs.find((e) => e.fragment.name === 'Minted');

    expect(mintedEvent.args.operator).to.eq(wallet1.address);
    expect(mintedEvent.args.to).to.eq(wallet2.address);
    expect(mintedEvent.args.amount).to.eq(BigInt(TOTAL_TOKEN_AMOUNT));
    expect(mintedEvent.args.data).to.eq(EMPTY_DATA);
    expect(mintedEvent.args.operatorData).to.eq(EMPTY_DATA);
  });

  it('Should check the balance of an address', async () => {
    const initBalance = await erc777Token.balanceOf(wallet1.address);
    await erc777Token.mint(
      wallet1.address,
      TOTAL_TOKEN_AMOUNT,
      EMPTY_DATA,
      EMPTY_DATA
    );
    const currentBalance = await erc777Token.balanceOf(wallet1.address);

    expect(initBalance).to.eq(0);
    expect(currentBalance).to.eq(TOTAL_TOKEN_AMOUNT);
  });

  it('Should send token from an EOA to another EOA', async () => {
    await erc777Token.mint(
      wallet1.address,
      TOTAL_TOKEN_AMOUNT,
      EMPTY_DATA,
      EMPTY_DATA
    );

    const tx = await erc777Token
      .connect(wallet1)
      .send(wallet2.address, SENT_TOKEN_AMOUNT, EMPTY_DATA);
    const receipt = await tx.wait();
    const event = receipt.logs.find((e) => e.fragment.name === 'Sent');

    expect(event.args.operator).to.eq(wallet1.address);
    expect(event.args.from).to.eq(wallet1.address);
    expect(event.args.to).to.eq(wallet2.address);
    expect(event.args.amount).to.eq(BigInt(SENT_TOKEN_AMOUNT));
    expect(event.args.data).to.eq(EMPTY_DATA);
    expect(event.args.operatorData).to.eq(EMPTY_DATA);
  });

  it('Should NOT allow an EOA to send insufficient tokens to another EOA', async () => {
    await erc777Token.mint(
      wallet1.address,
      TOTAL_TOKEN_AMOUNT,
      EMPTY_DATA,
      EMPTY_DATA
    );

    expect(
      erc777Token
        .connect(wallet1)
        .send(wallet2.address, TOTAL_TOKEN_AMOUNT + 1, EMPTY_DATA)
    ).to.eventually.be.rejected.and.have.property(
      'code',
      Constants.CALL_EXCEPTION
    );
  });

  it('Should NOT allow an EOA to send tokens to address zero', async () => {
    await erc777Token.mint(
      wallet1.address,
      TOTAL_TOKEN_AMOUNT,
      EMPTY_DATA,
      EMPTY_DATA
    );

    expect(
      erc777Token
        .connect(wallet1)
        .send(ADDRESS_ZERO, TOTAL_TOKEN_AMOUNT + 1, EMPTY_DATA)
    ).to.eventually.be.rejected.and.have.property(
      'code',
      Constants.CALL_EXCEPTION
    );
  });

  it('Should burn tokens', async () => {
    await erc777Token.mint(
      wallet1.address,
      TOTAL_TOKEN_AMOUNT,
      EMPTY_DATA,
      EMPTY_DATA
    );

    const tx = await erc777Token
      .connect(wallet1)
      .burn(BURNT_TOKEN_AMOUNT, EMPTY_DATA);
    const receipt = await tx.wait();
    const event = receipt.logs.find((e) => e.fragment.name === 'Burned');

    expect(event.args.operator).to.eq(wallet1.address);
    expect(event.args.from).to.eq(wallet1.address);
    expect(event.args.amount).to.eq(BigInt(BURNT_TOKEN_AMOUNT));
    expect(event.args.data).to.eq(EMPTY_DATA);
    expect(event.args.operatorData).to.eq(EMPTY_DATA);
  });

  it('Should authorize operator', async () => {
    const tx = await erc777Token
      .connect(wallet2)
      .authorizeOperator(wallet1.address);
    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (e) => e.fragment.name === 'AuthorizedOperator'
    );

    expect(event.args.operator).to.eq(wallet1.address);
    expect(event.args.tokenHolder).to.eq(wallet2.address);
  });

  it('Should NOT authorize self as operator', async () => {
    expect(
      erc777Token.connect(wallet2).authorizeOperator(wallet2.address)
    ).to.eventually.be.rejected.and.have.property(
      'code',
      Constants.CALL_EXCEPTION
    );
  });

  it('Should check if an address is the operator for another address', async () => {
    const falsyOperator = await erc777Token.isOperatorFor(
      wallet1.address,
      wallet2.address
    );

    await erc777Token.connect(wallet2).authorizeOperator(wallet1.address);

    const truthyOperator = await erc777Token.isOperatorFor(
      wallet1.address,
      wallet2.address
    );

    expect(falsyOperator).to.be.false;
    expect(truthyOperator).to.be.true;
  });

  it('Should revoke operator', async () => {
    const tx = await erc777Token
      .connect(wallet2)
      .revokeOperator(wallet1.address);
    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (e) => e.fragment.name === 'RevokedOperator'
    );

    expect(event.args.operator).to.eq(wallet1.address);
    expect(event.args.tokenHolder).to.eq(wallet2.address);
  });

  it('Should NOT revoke self as operator', async () => {
    expect(
      erc777Token.connect(wallet2).revokeOperator(wallet2.address)
    ).to.eventually.be.rejected.and.have.property(
      'code',
      Constants.CALL_EXCEPTION
    );
  });

  it('Should get default operators', async () => {
    const storageDefaultOperators = await erc777Token.defaultOperators();

    expect(storageDefaultOperators[0]).to.eq(wallet3.address);
    expect(storageDefaultOperators[1]).to.eq(wallet4.address);
    expect(storageDefaultOperators.length).to.eq(defaultOperators.length);
  });

  it('Should allow an operator to send tokens to a recipient on token holder behalf', async () => {
    await erc777Token
      .connect(wallet2)
      .mint(wallet2.address, TOTAL_TOKEN_AMOUNT, EMPTY_DATA, EMPTY_DATA);

    await erc777Token.connect(wallet2).authorizeOperator(wallet1.address);

    const tx = await erc777Token.connect(wallet1).operatorSend(
      wallet2.address, //sender
      wallet3.address, // recipient
      SENT_TOKEN_AMOUNT, //amount
      EMPTY_DATA, // data
      EMPTY_DATA // operator Data
    );

    const receipt = await tx.wait();

    const event = receipt.logs.find((e) => e.fragment.name === 'Sent');

    expect(event.args.operator).to.eq(wallet1.address);
    expect(event.args.from).to.eq(wallet2.address);
    expect(event.args.to).to.eq(wallet3.address);
    expect(event.args.amount).to.eq(BigInt(SENT_TOKEN_AMOUNT));
    expect(event.args.data).to.eq(EMPTY_DATA);
    expect(event.args.operatorData).to.eq(EMPTY_DATA);
  });

  it('Should NOT allow non-operator to send tokens to recipient on token holder behalf', async () => {
    await erc777Token
      .connect(wallet2)
      .mint(wallet2.address, TOTAL_TOKEN_AMOUNT, EMPTY_DATA, EMPTY_DATA);

    expect(
      erc777Token
        .connect(wallet1)
        .operatorSend(
          wallet2.address,
          wallet3.address,
          SENT_TOKEN_AMOUNT,
          EMPTY_DATA,
          EMPTY_DATA
        )
    ).to.eventually.be.rejected.and.have.property(
      'code',
      Constants.CALL_EXCEPTION
    );
  });

  it('Should allow an operator to burn token on token holder behalf', async () => {
    await erc777Token
      .connect(wallet2)
      .mint(wallet2.address, TOTAL_TOKEN_AMOUNT, EMPTY_DATA, EMPTY_DATA);

    await erc777Token.connect(wallet2).authorizeOperator(wallet1.address);

    const tx = await erc777Token.operatorBurn(
      wallet2.address, //token holder
      BURNT_TOKEN_AMOUNT, //amount
      EMPTY_DATA, // data
      EMPTY_DATA // operator Data
    );

    const receipt = await tx.wait();
    const event = receipt.logs.find((e) => e.fragment.name === 'Burned');

    expect(event.args.operator).to.eq(wallet1.address);
    expect(event.args.from).to.eq(wallet2.address);
    expect(event.args.amount).to.eq(BigInt(BURNT_TOKEN_AMOUNT));
    expect(event.args.data).to.eq(EMPTY_DATA);
    expect(event.args.operatorData).to.eq(EMPTY_DATA);
  });

  it('Should not allow a non-operator to burn token on token holder behalf', async () => {
    await erc777Token
      .connect(wallet2)
      .mint(wallet2.address, TOTAL_TOKEN_AMOUNT, EMPTY_DATA, EMPTY_DATA);

    expect(
      erc777Token.operatorBurn(
        wallet2.address, //token holder
        BURNT_TOKEN_AMOUNT, //amount
        EMPTY_DATA, // data
        EMPTY_DATA // operator Data
      )
    ).to.eventually.be.rejected.and.have.property(
      'code',
      Constants.CALL_EXCEPTION
    );
  });

  it('Should NOT be able to send ERC777 token to a contract that DOES NOT register ERC777TokensRecipient interafce', async () => {
    await erc777Token
      .connect(wallet1)
      .mint(wallet1.address, TOTAL_TOKEN_AMOUNT, EMPTY_DATA, EMPTY_DATA);

    expect(
      erc777Token
        .connect(wallet1)
        .send(
          await erc777ContractAccount.getAddress(),
          SENT_TOKEN_AMOUNT,
          EMPTY_DATA
        )
    ).to.eventually.be.rejected.and.have.property(
      'code',
      Constants.CALL_EXCEPTION
    );
  });

  it('Should be able to send ERC777 token to a contract that DOES register ERC777TokensRecipient interafce', async () => {
    await erc777Token
      .connect(wallet1)
      .mint(wallet1.address, TOTAL_TOKEN_AMOUNT, EMPTY_DATA, EMPTY_DATA);

    await erc777ContractAccount.registerERC777TokensRecipient(
      await erc777RecipientHookImpl.getAddress()
    );

    const tx = await erc777Token
      .connect(wallet1)
      .send(
        await erc777ContractAccount.getAddress(),
        SENT_TOKEN_AMOUNT,
        EMPTY_DATA
      );

    const receipt = await tx.wait();

    const event = receipt.logs.find((e) => e.fragment.name === 'Sent');

    expect(event.args.operator).to.eq(wallet1.address);
    expect(event.args.from).to.eq(wallet1.address);
    expect(event.args.to).to.eq(await erc777ContractAccount.getAddress());
    expect(event.args.amount).to.eq(BigInt(SENT_TOKEN_AMOUNT));
    expect(event.args.data).to.eq(EMPTY_DATA);
    expect(event.args.operatorData).to.eq(EMPTY_DATA);
  });

  it('Should NOT be able to send ERC777 token from a contract that DOES NOT register ERC777TokensSender interface', async () => {
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

    expect(
      erc777ContractAccount.send(
        await erc777Token.getAddress(),
        wallet2.address,
        SENT_TOKEN_AMOUNT,
        EMPTY_DATA
      )
    ).to.eventually.be.rejected.and.have.property(
      'code',
      Constants.CALL_EXCEPTION
    );
  });

  it('Should be able to send ERC777 token from a contract that DOES register ERC777TokensSender interface', async () => {
    await erc777ContractAccount.registerERC777TokensRecipient(
      await erc777RecipientHookImpl.getAddress()
    );

    await erc777ContractAccount.registerERC777TokensSender(
      await erc777SenderHookImpl.getAddress()
    );

    await erc777Token
      .connect(wallet1)
      .mint(
        await erc777ContractAccount.getAddress(),
        TOTAL_TOKEN_AMOUNT,
        EMPTY_DATA,
        EMPTY_DATA,
        Constants.GAS_LIMIT_1_000_000
      );

    await erc777ContractAccount.send(
      await erc777Token.getAddress(),
      wallet2.address,
      SENT_TOKEN_AMOUNT,
      EMPTY_DATA,
      Constants.GAS_LIMIT_1_000_000
    );

    const erc777ContractAccountBalance = await erc777Token.balanceOf(
      await erc777ContractAccount.getAddress()
    );
    const wallet2Balance = await erc777Token.balanceOf(wallet2.address);

    expect(erc777ContractAccountBalance).to.eq(
      BigInt(TOTAL_TOKEN_AMOUNT - SENT_TOKEN_AMOUNT)
    );
    expect(wallet2Balance).to.eq(BigInt(SENT_TOKEN_AMOUNT));
  });
});
