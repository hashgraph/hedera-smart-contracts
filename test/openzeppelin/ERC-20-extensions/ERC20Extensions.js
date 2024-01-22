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
const {
  pollForERC20BurnableChangedSupply,
  pauseAndPoll,
  unPauseAndPoll,
} = require('../../../utils/helpers');

describe('@OZERC20Extensions Test Suite', function () {
  let owner, addr1;
  let ERC20Burnable;
  let ERC20Capped;
  let ERC20Pausable;
  const amount = 1000;
  const cap = 10000;
  const burnAmount = 100;

  before(async function () {
    // Set up signers
    [owner, addr1] = await ethers.getSigners();

    // Deploy ERC20BurnableMock contract
    const burnableFactory = await ethers.getContractFactory(
      Constants.Contract.ERC20BurnableMock
    );
    ERC20Burnable = await burnableFactory.deploy(
      Constants.TOKEN_NAME,
      Constants.TOKEN_SYMBOL
    );
    await ERC20Burnable.mint(owner.address, amount);

    // Deploy ERC20CappedMock contract
    const cappedFactory = await ethers.getContractFactory(
      Constants.Contract.ERC20CappedMock
    );
    ERC20Capped = await cappedFactory.deploy(
      Constants.TOKEN_NAME,
      Constants.TOKEN_SYMBOL,
      cap
    );
    await ERC20Capped.mint(owner.address, amount);

    // Deploy ERC20PausableMock contract
    const pausableFactory = await ethers.getContractFactory(
      Constants.Contract.ERC20PausableMock
    );
    ERC20Pausable = await pausableFactory.deploy(
      Constants.TOKEN_NAME,
      Constants.TOKEN_SYMBOL
    );
    await ERC20Pausable.mint(owner.address, amount);
  });

  describe('ERC20Burnable tests', function () {
    it('should be able to execute burn(amount)', async function () {
      const initialSupply = await ERC20Burnable.totalSupply();
      const initialBalance = await ERC20Burnable.balanceOf(owner.address);

      // Execute burn and get the transaction receipt
      const burnTx = await ERC20Burnable.burn(burnAmount);
      const burnReceipt = await burnTx.wait();

      // Get updated values
      const newSupply = await pollForERC20BurnableChangedSupply(
        ERC20Burnable,
        initialSupply
      );
      const newBalance = await ERC20Burnable.balanceOf(owner.address);

      // Check if the Transfer event was emitted to AddressZero
      expect(burnReceipt.logs[0].fragment.name).to.equal('Transfer');
      expect(burnReceipt.logs[0].args.to).to.equal(ethers.ZeroAddress);

      // Verify the new supply and new balance of the user
      expect(newSupply).to.equal(initialSupply - BigInt(burnAmount));
      expect(newBalance).to.equal(initialBalance - BigInt(burnAmount));
    });

    it('should be able to execute burnFrom(address, amount)', async function () {
      const initialBalance = await ERC20Burnable.balanceOf(owner.address);

      // Approve allowance and burn tokens from owner's address
      await ERC20Burnable.approve(addr1.address, burnAmount);

      const erc20Signer2 = await ERC20Burnable.connect(addr1);
      await erc20Signer2.burnFrom(
        owner.address,
        burnAmount,
        Constants.GAS_LIMIT_1_000_000
      );

      const newBalance = await ERC20Burnable.balanceOf(owner.address);

      //check updated balance
      expect(newBalance).to.equal(initialBalance - BigInt(burnAmount));
    });

    it("should fail to burn tokens if the user doesn't have enough balance", async function () {
      const balance = await ERC20Burnable.balanceOf(owner.address);

      // Expect burn to be reverted due to insufficient balance
      await expect(ERC20Burnable.burn(balance + 1n)).to.be.reverted;
    });

    it('should revert when trying to burn tokens from another account more than accepted allowance', async function () {
      // Approve the allowance for addr1 to burn tokens on behalf of owner
      await ERC20Burnable.approve(addr1.address, burnAmount);
      const erc20Signer2 = ERC20Burnable.connect(addr1);

      expect(erc20Signer2.burnFrom(owner.address, burnAmount + 1)).to.be
        .reverted;
    });

    it('should revert when trying to burn tokens from another account without allowance', async function () {
      expect(ERC20Burnable.connect(addr1).burnFrom(owner.address, amount)).to.be
        .reverted;
    });
  });

  describe('ERC20Cap tests', function () {
    it('should be able to execute cap()', async function () {
      const contractCap = await ERC20Capped.cap();
      expect(contractCap).to.equal(cap);
    });

    it('should fail to mint when trying to mint tokens exceeding the cap', async function () {
      // Get the initial total supply and balance of the owner
      const initialSupply = await ERC20Capped.totalSupply();
      const initialBalance = await ERC20Capped.balanceOf(owner.address);

      // Expect the mint function to be reverted due to exceeding the cap
      await expect(ERC20Capped.mint(owner.address, cap + 1)).to.be.reverted;

      // Check that the total supply and owner's balance haven't changed
      expect(await ERC20Capped.totalSupply()).to.equal(initialSupply);
      expect(await ERC20Capped.balanceOf(owner.address)).to.equal(
        initialBalance
      );
    });
  });

  describe('ERC20Pause tests', function () {
    it('should pause and unpause the token', async function () {
      // Check if the token is not paused initially
      expect(await ERC20Pausable.paused()).to.be.false;

      // Pause the token and verify it is paused
      expect(await pauseAndPoll(ERC20Pausable)).to.be.true;

      // Unpause the token and verify it is not paused anymore
      expect(await unPauseAndPoll(ERC20Pausable)).to.be.true;
    });

    it('should not allow transfers when paused', async function () {
      await ERC20Pausable.pause();

      await expect(ERC20Pausable.transfer(addr1.address, amount)).to.be
        .reverted;
    });

    it("should revert when trying to pause the contract when it's already paused", async function () {
      await expect(ERC20Pausable.pause()).to.be.reverted;
    });

    it('should revert when trying to mint tokens while paused', async function () {
      await expect(ERC20Pausable.mint(addr1.address, amount)).to.be.reverted;
    });

    it('should revert when a non-owner tries to pause or unpause the contract', async function () {
      // Expect pause to be reverted when called by a non-owner
      await expect(ERC20Pausable.connect(addr1).pause()).to.be.reverted;

      // Expect unpause to be reverted when called by a non-owner
      await expect(ERC20Pausable.connect(addr1).unpause()).to.be.reverted;
    });
  });
});
