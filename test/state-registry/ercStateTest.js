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

const fs = require('fs');
const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('../constants');

const STATE_OBJECT_DIR = './test/state-registry/ercStates.json';

describe('@migration ERCs State Tests', function () {
  const tokenId1 = 3;
  const tokenId2 = 6;
  const token1InitialMint = 300;
  const token2InitialMint = 600;
  const initAmount = 900;
  const amount = 3;

  describe('@pre-migration', () => {
    let signers;
    let erc20;
    let erc721;
    let erc1155;
    let statesObject = {};

    before(async function () {
      signers = await ethers.getSigners();

      const erc20Factory = await ethers.getContractFactory(
        Constants.Contract.OZERC20Mock
      );
      erc20 = await erc20Factory.deploy(
        Constants.TOKEN_NAME,
        Constants.TOKEN_SYMBOL
      );
      await (await erc20.mint(signers[0].address, initAmount)).wait();

      const erc721Factory = await ethers.getContractFactory(
        Constants.Contract.OZERC721Mock
      );
      erc721 = await erc721Factory.deploy(
        Constants.TOKEN_NAME,
        Constants.TOKEN_SYMBOL
      );
      await (await erc721.mint(signers[0].address, tokenId1)).wait();

      const erc1155Factory = await ethers.getContractFactory(
        Constants.Contract.ERC1155Mock
      );

      erc1155 = await erc1155Factory.deploy(Constants.TOKEN_URL);
      await (
        await erc1155.mintBatch(
          signers[0].address,
          [tokenId1, tokenId2],
          [token1InitialMint, token2InitialMint],
          '0x'
        )
      ).wait();

      statesObject['erc_20_token_address'] = erc20.target;
      statesObject['erc_721_token_address'] = erc721.target;
      statesObject['erc_1155_token_address'] = erc1155.target;
    });

    after(async () => {
      fs.writeFileSync(STATE_OBJECT_DIR, JSON.stringify(statesObject));
    });

    it('should be able to execute basic erc20 functions', async function () {
      const name = await erc20.name();
      expect(name).to.equal(Constants.TOKEN_NAME);
      const symbol = await erc20.symbol();
      expect(symbol).to.equal(Constants.TOKEN_SYMBOL);
      const decimals = Number(await erc20.decimals());
      expect(decimals).to.equal(18);
      const totalSupply = Number(await erc20.totalSupply());
      expect(totalSupply).to.equal(initAmount);
      let signer0balance = await erc20.balanceOf(signers[0].address);
      expect(signer0balance).to.equal(initAmount);
      let signer1balance = await erc20.balanceOf(signers[1].address);
      expect(signer1balance).to.equal(0);
      await (await erc20.approve(await erc20.getAddress(), amount)).wait();
      const allowance = Number(
        await erc20.allowance(signers[0].address, await erc20.getAddress())
      );
      expect(allowance).to.eq(amount);

      await (await erc20.transfer(signers[1].address, amount)).wait();
      signer0balance = Number(await erc20.balanceOf(signers[0].address));
      signer1balance = Number(await erc20.balanceOf(signers[1].address));
      expect(signer0balance).to.eq(initAmount - amount);
      expect(signer1balance).to.eq(amount);

      statesObject['erc_20_states'] = {
        name,
        symbol,
        decimals,
        totalSupply,
        balances: {
          [signers[0].address]: signer0balance,
          [signers[1].address]: signer1balance,
        },
        allowance,
      };
    });

    it('should be able to execute basic erc721 functions', async function () {
      const name = await erc721.name();
      expect(name).to.equal(Constants.TOKEN_NAME);
      const symbol = await erc721.symbol();
      expect(symbol).to.equal(Constants.TOKEN_SYMBOL);
      let signer0Balance = await erc721.balanceOf(signers[0].address);
      expect(signer0Balance).to.eq(1);
      let signer1Balance = await erc721.balanceOf(signers[1].address);
      expect(signer1Balance).to.eq(0);
      let ownerOfToken = await erc721.ownerOf(tokenId1);
      expect(ownerOfToken).to.eq(signers[0].address);

      await (await erc721.approve(signers[1].address, tokenId1)).wait();
      let getApproved = await erc721.getApproved(tokenId1);
      expect(getApproved).to.eq(signers[1].address);
      await (await erc721.setApprovalForAll(signers[1].address, true)).wait();
      const isApprovedForAll = await erc721.isApprovedForAll(
        signers[0].address,
        signers[1].address
      );
      expect(isApprovedForAll).to.eq(true);

      await (
        await erc721.transferFrom(
          signers[0].address,
          signers[1].address,
          tokenId1
        )
      ).wait();

      signer0Balance = Number(await erc721.balanceOf(signers[0].address));
      signer1Balance = Number(await erc721.balanceOf(signers[1].address));
      expect(signer0Balance).to.eq(0);
      expect(signer1Balance).to.eq(1);

      ownerOfToken = await erc721.ownerOf(tokenId1);
      expect(ownerOfToken).to.eq(signers[1].address);

      statesObject['erc_721_states'] = {
        name,
        symbol,
        balances: {
          [signers[0].address]: signer0Balance,
          [signers[1].address]: signer1Balance,
        },
        ownerOf: {
          [tokenId1]: ownerOfToken,
        },
        isApprovedForAll,
      };
    });

    it('should be able to execute basic erc1155 functions', async function () {
      const tokenId1Uri = await erc1155.uri(tokenId1);
      const tokenId2Uri = await erc1155.uri(tokenId2);
      expect(tokenId1Uri).to.eq(tokenId2Uri);
      const signer0TokenId1Balance = Number(
        await erc1155.balanceOf(signers[0].address, tokenId1)
      );
      expect(signer0TokenId1Balance).to.eq(token1InitialMint);
      const signer0TokenId2Balance = Number(
        await erc1155.balanceOf(signers[0].address, tokenId2)
      );
      expect(signer0TokenId2Balance).to.eq(token2InitialMint);
      await (await erc1155.setApprovalForAll(signers[1].address, true)).wait();
      const isApprovedForAll = await erc1155.isApprovedForAll(
        signers[0].address,
        signers[1].address
      );
      expect(isApprovedForAll).to.eq(true);

      statesObject['erc_1155_states'] = {
        uri: {
          [tokenId1]: tokenId1Uri,
          [tokenId2]: tokenId2Uri,
        },
        balances: {
          [signers[0].address]: {
            [tokenId1]: signer0TokenId1Balance,
            [tokenId2]: signer0TokenId2Balance,
          },
        },
        isApprovedForAll,
      };
    });
  });

  describe('@post-migration-view-functions States Comparison', () => {
    let signers;
    let erc20;
    let erc721;
    let erc1155;
    let statesObject = {};

    before(async function () {
      signers = await ethers.getSigners();
      statesObject = JSON.parse(fs.readFileSync(STATE_OBJECT_DIR));

      erc20 = await ethers.getContractAt(
        Constants.Contract.OZERC20Mock,
        statesObject['erc_20_token_address']
      );

      erc721 = await ethers.getContractAt(
        Constants.Contract.OZERC721Mock,
        statesObject['erc_721_token_address']
      );

      erc1155 = await ethers.getContractAt(
        Constants.Contract.ERC1155Mock,
        statesObject['erc_1155_token_address']
      );
    });

    const erc20States = [
      'name',
      'symbol',
      'decimals',
      'totalSupply',
      'balances',
      'allowance',
    ];

    for (const state of erc20States) {
      it(`Should compare ${state} erc20 contract storage states`, async () => {
        switch (state) {
          case 'balances':
            const monoBalancSigner0eState =
              statesObject['erc_20_states'][state][signers[0].address];
            const monoBalancSigner1eState =
              statesObject['erc_20_states'][state][signers[1].address];

            const modBalancSigner0eState = await erc20.balanceOf(
              signers[0].address
            );
            const modBalancSigner1eState = await erc20.balanceOf(
              signers[1].address
            );

            expect(modBalancSigner0eState).to.eq(monoBalancSigner0eState);
            expect(modBalancSigner1eState).to.eq(monoBalancSigner1eState);

            break;
          case 'allowance':
            const monoAllowance = statesObject['erc_20_states'][state];
            const modAllowance = await erc20.allowance(
              signers[0].address,
              await erc20.getAddress()
            );

            expect(modAllowance).to.eq(monoAllowance);
            break;
          default:
            const monoState = statesObject['erc_20_states'][state];
            const modState = await erc20[state]();
            expect(modState).to.eq(monoState);
        }
      });
    }

    const erc721States = [
      'name',
      'symbol',
      'balances',
      'ownerOf',
      'isApprovedForAll',
    ];
    for (const state of erc721States) {
      it(`Should compare ${state} erc721 contract storage states`, async () => {
        switch (state) {
          case 'balances':
            const monoBalancSigner0eState =
              statesObject['erc_721_states'][state][signers[0].address];
            const monoBalancSigner1eState =
              statesObject['erc_721_states'][state][signers[1].address];

            const modBalancSigner0eState = await erc721.balanceOf(
              signers[0].address
            );
            const modBalancSigner1eState = await erc721.balanceOf(
              signers[1].address
            );

            expect(modBalancSigner0eState).to.eq(monoBalancSigner0eState);
            expect(modBalancSigner1eState).to.eq(monoBalancSigner1eState);

            break;
          case 'ownerOf':
            const monoOwnerOf = statesObject['erc_721_states'][state][tokenId1];
            const modOwnerOf = await erc721[state](tokenId1);
            expect(modOwnerOf).to.eq(monoOwnerOf);
            break;

          case 'isApprovedForAll':
            const monoIsApprovedForAll = statesObject['erc_721_states'][state];
            const modIsApprovedForAll = await erc721.isApprovedForAll(
              signers[0].address,
              signers[1].address
            );
            expect(modIsApprovedForAll).to.eq(monoIsApprovedForAll);

            break;
          default:
            const monoState = statesObject['erc_721_states'][state];
            const modState = await erc721[state]();
            expect(modState).to.eq(monoState);
        }
      });
    }

    const erc1155States = ['uri', 'balances', 'isApprovedForAll'];
    for (const state of erc1155States) {
      it(`Should compare ${state} erc1155 contract storage states`, async () => {
        switch (state) {
          case 'uri':
            const monoTokenId1Uri =
              statesObject['erc_1155_states'][state][tokenId1];
            const monoTokenId2Uri =
              statesObject['erc_1155_states'][state][tokenId2];
            const modTokenId1Uri = await erc1155.uri(tokenId1);
            const modTokenId2Uri = await erc1155.uri(tokenId2);

            expect(monoTokenId1Uri)
              .to.eq(monoTokenId2Uri)
              .to.eq(modTokenId1Uri)
              .to.eq(modTokenId2Uri);

            break;

          case 'balances':
            const monoTokenId1BalancSigner0State =
              statesObject['erc_1155_states'][state][signers[0].address][
                tokenId1
              ];
            const monoTokenId2BalancSigner0State =
              statesObject['erc_1155_states'][state][signers[0].address][
                tokenId2
              ];

            const modTokenId1BalancSigner0State = await erc1155.balanceOf(
              signers[0].address,
              tokenId1
            );
            const modTokenId2BalancSigner0State = await erc1155.balanceOf(
              signers[0].address,
              tokenId2
            );

            expect(monoTokenId1BalancSigner0State).to.eq(
              modTokenId1BalancSigner0State
            );
            expect(monoTokenId2BalancSigner0State).to.eq(
              modTokenId2BalancSigner0State
            );

            break;

          case 'isApprovedForAll':
            const monoIsApprovedForAll = statesObject['erc_1155_states'][state];
            const modIsApprovedForAll = await erc1155.isApprovedForAll(
              signers[0].address,
              signers[1].address
            );
            expect(modIsApprovedForAll).to.eq(monoIsApprovedForAll);

            break;
        }
      });
    }
  });
});
