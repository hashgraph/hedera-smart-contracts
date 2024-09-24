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

describe('@OZIERC721Receiver Test Suite', () => {
  let wallet, invalidErc721Receiver, validErc721Receiver, erc721Token;

  const ERC721_NAME = 'Token';
  const ERC721_SYMBOL = 'T';

  before(async () => {
    wallet = (await ethers.getSigners())[0];

    const invalidErc721ReceiverFac = await ethers.getContractFactory(
      Constants.Contract.InvalidERC721Receiver
    );
    const validErc721ReceiverFac = await ethers.getContractFactory(
      Constants.Contract.ValidERC721Receiver
    );
    const erc721TokenFac = await ethers.getContractFactory(
      Constants.Contract.OZERC721Mock
    );

    invalidErc721Receiver = await invalidErc721ReceiverFac.deploy();
    validErc721Receiver = await validErc721ReceiverFac.deploy();
    erc721Token = await erc721TokenFac.deploy(ERC721_NAME, ERC721_SYMBOL);
  });

  it('Should deploy contracts to proper addresses', async () => {
    expect(ethers.isAddress(await invalidErc721Receiver.getAddress())).to.be
      .true;
    expect(ethers.isAddress(await validErc721Receiver.getAddress())).to.be.true;
    expect(ethers.isAddress(await erc721Token.getAddress())).to.be.true;
  });

  it('Should be able to send ERC721 token to validErc721Receiver via safeTransferFrom', async () => {
    const tokenID = 3;
    await erc721Token.mint(wallet.address, tokenID);

    const tx = await erc721Token[
      'safeTransferFrom(address,address,uint256,bytes)'
    ](
      wallet.address,
      await validErc721Receiver.getAddress(),
      tokenID,
      '0x',
      Constants.GAS_LIMIT_1_000_000
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find((e) => e.fragment.name === 'Transfer');

    expect(event.args.from).to.eq(wallet.address);
    expect(event.args.to).to.eq(await validErc721Receiver.getAddress());
    expect(event.args.tokenId).to.eq(tokenID);
  });

  it('Should NOT be able to send ERC721 token to invalidErc721Receiver via safeTransferFrom', async () => {
    const tokenID = 3;
    await erc721Token.mint(
      wallet.address,
      tokenID,
      Constants.GAS_LIMIT_1_000_000
    );

    const tx = await erc721Token[
      'safeTransferFrom(address,address,uint256,bytes)'
    ](
      wallet.address,
      await invalidErc721Receiver.getAddress(),
      tokenID,
      '0x',
      Constants.GAS_LIMIT_1_000_000
    );

    expect(tx.wait()).to.eventually.rejected.and.have.property(
      'code',
      Constants.CALL_EXCEPTION
    );
  });
});
