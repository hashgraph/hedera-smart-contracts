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
const { CALL_EXCEPTION } = require('../../constants');

describe('@OZERC1155Token Test Suite', () => {
  let erc1155Token, wallet1, wallet2;

  const TOKEN_URI = '_token_uri_';
  const NEW_TOKEN_URI = '_new_token_uri_';
  const TOKEN_ID = 3679;
  const MINTED_AMOUNT = 79;
  const TRANSFER_AMOUNT = 30;
  const BURNT_AMOUNT = 39;
  const EMPTY_DATA = '0x';
  const TOKEN_IDS = [3, 6, 9];
  const MINTED_AMOUNTS = [30, 60, 90];
  const BURNT_AMOUNTS = [3, 6, 9];
  const TRANSFER_AMOUNTS = [12, 15, 18];

  beforeEach(async () => {
    [wallet1, wallet2] = await ethers.getSigners();

    const erc1155TokenFac = await ethers.getContractFactory(
      Constants.Contract.ERC1155Token
    );
    erc1155Token = await erc1155TokenFac.deploy(TOKEN_URI);
  });

  it('Should deploy erc1155Token', async () => {
    expect(await erc1155Token.owner()).to.eq(wallet1.address);
    expect(ethers.isAddress(await erc1155Token.getAddress())).to.be.true;
  });

  it('Should be able to mint a new token', async () => {
    const tx = await erc1155Token
      .connect(wallet1)
      .mint(wallet2.address, TOKEN_ID, MINTED_AMOUNT, EMPTY_DATA);
    const receipt = await tx.wait();
    const event = receipt.logs.find((e) => e.fragment.name === 'Minted');

    expect(event.args.id).to.eq(TOKEN_ID);
    expect(event.args.data).to.eq(EMPTY_DATA);
    expect(event.args.amount).to.eq(MINTED_AMOUNT);
    expect(event.args.account).to.eq(wallet2.address);
  });

  it('Should be able to mint new tokens in batch', async () => {
    const tx = await erc1155Token
      .connect(wallet1)
      .mintBatch(wallet2.address, TOKEN_IDS, MINTED_AMOUNTS, EMPTY_DATA);
    const receipt = await tx.wait();
    const event = receipt.logs.find((e) => e.fragment.name === 'MintedBatch');

    expect(event.args.data).to.eq(EMPTY_DATA);
    expect(event.args.to).to.eq(wallet2.address);
    expect(event.args.ids.length).to.eq(TOKEN_IDS.length);
    expect(event.args.amounts.length).to.eq(MINTED_AMOUNTS.length);

    event.args.ids.forEach((id, index) => {
      expect(id).to.eq(TOKEN_IDS[index]);
    });
    event.args.amounts.forEach((amount, index) => {
      expect(amount).to.eq(MINTED_AMOUNTS[index]);
    });
  });

  it('Should check the balance of an address in batch', async () => {
    const mint1Tx = await erc1155Token.mint(
      wallet1.address,
      TOKEN_IDS[0],
      MINTED_AMOUNTS[0],
      EMPTY_DATA
    );
    await mint1Tx.wait();

    const mint2Tx = await erc1155Token.mint(
      wallet2.address,
      TOKEN_IDS[1],
      MINTED_AMOUNTS[1],
      EMPTY_DATA
    );
    await mint2Tx.wait();

    const balanceBatch = await erc1155Token.balanceOfBatch(
      [wallet1.address, wallet2.address],
      [TOKEN_IDS[0], TOKEN_IDS[1]]
    );
    expect(balanceBatch.length).to.eq(2);
    balanceBatch.forEach((bal, index) => {
      expect(bal).to.eq(BigInt(MINTED_AMOUNTS[index]));
    });
  });

  it('Should check the existance of a token ID', async () => {
    const beforeMintExisted = await erc1155Token.exists(TOKEN_ID);
    const mintTx = await erc1155Token
      .connect(wallet1)
      .mint(wallet2.address, TOKEN_ID, MINTED_AMOUNT, EMPTY_DATA);
    await mintTx.wait();

    const afterMintExisted = await erc1155Token.exists(TOKEN_ID);

    expect(beforeMintExisted).to.be.false;
    expect(afterMintExisted).to.be.true;
  });

  it('Should retireve the total supply of a token ID', async () => {
    /**
     * @notice as there are two different selectors with the same interfaceID, it's needed to specify the interfaceID as bellow
     */
    const beforeMintBalance = await erc1155Token['totalSupply(uint256)'](
      TOKEN_ID
    );
    const mintTx = await erc1155Token
      .connect(wallet1)
      .mint(wallet2.address, TOKEN_ID, MINTED_AMOUNT, EMPTY_DATA);
    await mintTx.wait();

    /**
     * @notice as there are two different selectors with the same interfaceID, it's needed to specify the interfaceID as bellow
     */
    const afterMintBalance = await erc1155Token['totalSupply(uint256)'](
      TOKEN_ID
    );

    expect(beforeMintBalance).to.eq(0);
    expect(afterMintBalance).to.eq(MINTED_AMOUNT);
  });

  it('Should retrieve the total supply of the whole contract', async () => {
    const mintBatchTx = await erc1155Token
      .connect(wallet1)
      .mintBatch(wallet2.address, TOKEN_IDS, MINTED_AMOUNTS, EMPTY_DATA);
    await mintBatchTx.wait();

    const expectedTotalySupply = MINTED_AMOUNTS.reduce((a, c) => a + c, 0);

    /**
     * @notice as there are two different selectors with the same interfaceID, it's needed to specify the interfaceID as bellow
     */
    const totalSupply = await erc1155Token['totalSupply()']();

    expect(totalSupply).to.eq(expectedTotalySupply);
  });

  it('Should set approval for all tokens for an operator', async () => {
    const tx = await erc1155Token
      .connect(wallet1)
      .setApprovalForAll(wallet2.address, true);
    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (e) => e.fragment.name === 'ApprovalForAll'
    );

    expect(event.args.account).to.eq(wallet1.address);
    expect(event.args.operator).to.eq(wallet2.address);
    expect(event.args.approved).to.eq(true);
  });

  it("Should check if an address is another address's operator", async () => {
    const beforeApproval = await erc1155Token.isApprovedForAll(
      wallet1.address,
      wallet2.address
    );
    await erc1155Token
      .connect(wallet1)
      .setApprovalForAll(wallet2.address, true);
    const afterApproval = await erc1155Token.isApprovedForAll(
      wallet1.address,
      wallet2.address
    );

    expect(beforeApproval).to.be.false;
    expect(afterApproval).to.be.true;
  });

  it('Should transfer the ownership to another account', async () => {
    const tx = await erc1155Token
      .connect(wallet1)
      .transferOwnership(wallet2.address);
    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (e) => (e.fragment.name = 'OwnershipTransferred')
    );

    expect(event.args.previousOwner).to.eq(wallet1.address);
    expect(event.args.newOwner).to.eq(wallet2.address);
  });

  it('Should NOT transfer the ownership to another account if the caller is not owner', async () => {
    const currentOwner = await erc1155Token.owner();
    expect(currentOwner).to.not.eq(wallet2.address);

    expect(
      erc1155Token.connect(wallet2).transferOwnership(wallet2.address)
    ).to.eventually.be.rejected.and.have.property('code', CALL_EXCEPTION);
  });

  it('Should retrieve the token uri of a tokenID', async () => {
    expect(await erc1155Token.uri(TOKEN_ID)).to.eq(TOKEN_URI);
  });

  it('Should set a new token URI', async () => {
    const tx = await erc1155Token.setURI(NEW_TOKEN_URI);
    await tx.wait();
    expect(await erc1155Token.uri(TOKEN_ID)).to.eq(NEW_TOKEN_URI);
  });

  it('Should burn token', async () => {
    const mintTx = await erc1155Token.mint(
      wallet2.address,
      TOKEN_ID,
      MINTED_AMOUNT,
      EMPTY_DATA,
      Constants.GAS_LIMIT_1_000_000
    );
    await mintTx.wait();

    const burnTx = await erc1155Token
      .connect(wallet2)
      .burn(
        wallet2.address,
        TOKEN_ID,
        BURNT_AMOUNT,
        Constants.GAS_LIMIT_1_000_000
      );
    await burnTx.wait();

    const balance = await erc1155Token.balanceOf(wallet2.address, TOKEN_ID);
    expect(balance).to.eq(BigInt(MINTED_AMOUNT - BURNT_AMOUNT));
  });

  it('Should NOT burn insufficient amount of token', async () => {
    expect(
      erc1155Token
        .connect(wallet2)
        .burn(wallet2.address, TOKEN_ID, BURNT_AMOUNT)
    ).to.eventually.be.rejected.and.have.property('code', CALL_EXCEPTION);
  });

  it('Should burn token in batch', async () => {
    const mintBatchTx = await erc1155Token
      .connect(wallet1)
      .mintBatch(
        wallet2.address,
        TOKEN_IDS,
        MINTED_AMOUNTS,
        EMPTY_DATA,
        Constants.GAS_LIMIT_1_000_000
      );
    await mintBatchTx.wait();

    const burnBatchTx = await erc1155Token
      .connect(wallet2)
      .burnBatch(
        wallet2.address,
        TOKEN_IDS,
        BURNT_AMOUNTS,
        Constants.GAS_LIMIT_1_000_000
      );
    await burnBatchTx.wait();

    const balanceBatch = await erc1155Token.balanceOfBatch(
      [wallet2.address, wallet2.address, wallet2.address],
      TOKEN_IDS
    );

    balanceBatch.forEach((b, i) => {
      expect(b).to.eq(BigInt(MINTED_AMOUNTS[i] - BURNT_AMOUNTS[i]));
    });
  });

  it('Should allow an operator to transfer a token to another account', async () => {
    const mintTx = await erc1155Token.mint(
      wallet2.address,
      TOKEN_ID,
      MINTED_AMOUNT,
      EMPTY_DATA
    );
    await mintTx.wait();

    const setApprovalTx = await erc1155Token
      .connect(wallet2)
      .setApprovalForAll(wallet1.address, true);

    await setApprovalTx.wait();

    const tx = await erc1155Token.safeTransferFrom(
      wallet2.address,
      wallet1.address,
      TOKEN_ID,
      TRANSFER_AMOUNT,
      EMPTY_DATA
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (e) => e.fragment.name === 'TransferSingle'
    );

    expect(event.args.operator).to.eq(wallet1.address);
    expect(event.args.from).to.eq(wallet2.address);
    expect(event.args.to).to.eq(wallet1.address);
    expect(event.args.id).to.eq(TOKEN_ID);
    expect(event.args.value).to.eq(TRANSFER_AMOUNT);

    const wallet1Balance = await erc1155Token.balanceOf(
      wallet1.address,
      TOKEN_ID
    );
    const wallet2Balance = await erc1155Token.balanceOf(
      wallet2.address,
      TOKEN_ID
    );

    expect(wallet1Balance).to.eq(TRANSFER_AMOUNT);
    expect(wallet2Balance).to.eq(MINTED_AMOUNT - TRANSFER_AMOUNT);
  });

  it('Should allow an operator to transfer tokens in batch to another account', async () => {
    const mintBatchTx = await erc1155Token
      .connect(wallet1)
      .mintBatch(wallet2.address, TOKEN_IDS, MINTED_AMOUNTS, EMPTY_DATA);
    await mintBatchTx.wait();

    const setApprovalForAllTx = await erc1155Token
      .connect(wallet2)
      .setApprovalForAll(wallet1.address, true);
    await setApprovalForAllTx.wait();

    const tx = await erc1155Token.safeBatchTransferFrom(
      wallet2.address,
      wallet1.address,
      TOKEN_IDS,
      TRANSFER_AMOUNTS,
      EMPTY_DATA
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find((e) => e.fragment.name === 'TransferBatch');

    expect(event.args.operator).to.eq(wallet1.address);
    expect(event.args.from).to.eq(wallet2.address);
    expect(event.args.to).to.eq(wallet1.address);
    expect(event.args.ids.length).to.eq(TOKEN_IDS.length);
    expect(event.args[4].length).to.eq(TRANSFER_AMOUNTS.length);

    event.args.ids.forEach((id, index) => {
      expect(id).to.eq(TOKEN_IDS[index]);
    });
    event.args[4].forEach((amount, index) => {
      expect(amount).to.eq(TRANSFER_AMOUNTS[index]);
    });
  });

  it('Should NOT allow a non-operator to transfer tokens to another account', async () => {
    const mintTx = await erc1155Token.mint(
      wallet2.address,
      TOKEN_ID,
      MINTED_AMOUNT,
      EMPTY_DATA
    );
    await mintTx.wait();

    expect(
      erc1155Token.safeTransferFrom(
        wallet2.address,
        wallet1.address,
        TOKEN_ID,
        TRANSFER_AMOUNT,
        EMPTY_DATA
      )
    ).to.eventually.be.rejected.and.have.property('code', CALL_EXCEPTION);
  });
});
