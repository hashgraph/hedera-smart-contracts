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

describe('@OZTokenVault Test Suite', function () {
  let TokenVault;
  let tokenVault;
  let ERC20Mock;
  let asset;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    ERC20Mock = await ethers.getContractFactory(Constants.Contract.OZERC20Mock);
    asset = await ERC20Mock.deploy(
      'MockToken',
      'MTK',
      Constants.GAS_LIMIT_1_000_000
    );

    TokenVault = await ethers.getContractFactory(Constants.Contract.TokenVault);
    tokenVault = await TokenVault.deploy(
      await asset.getAddress(),
      'MockToken',
      'MTK',
      Constants.GAS_LIMIT_1_000_000
    );

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    await asset.mint(addr1.address, ethers.parseUnits('1000', 18));
    await asset.mint(addr2.address, ethers.parseUnits('10', 18));
  });

  describe('Deployment', function () {
    it('Should assign the total supply of tokens to the owner', async function () {
      const ownerBalance = await tokenVault.balanceOf(owner.address);
      expect(await tokenVault.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe('Transactions', function () {
    it('Should deposit tokens and update shareHolders mapping', async function () {
      const depositAmount = ethers.parseEther('10');
      await asset
        .connect(addr1)
        .approve(await tokenVault.getAddress(), depositAmount);
      await expect(tokenVault.connect(addr1)._deposit(depositAmount))
        .to.emit(tokenVault, 'Deposit')
        .withArgs(addr1.address, addr1.address, depositAmount, depositAmount);

      expect(await tokenVault.shareHolders(addr1.address)).to.equal(
        depositAmount
      );
    });

    it('Should withdraw tokens and update shareHolders mapping', async function () {
      const depositAmount = ethers.parseEther('10');
      const withdrawAmount = ethers.parseEther('5');
      const redemedAmount = ethers.parseEther('5.5');

      await asset
        .connect(addr2)
        .approve(await tokenVault.getAddress(), depositAmount);
      await tokenVault.connect(addr2)._deposit(depositAmount);

      const tx = await tokenVault
        .connect(addr2)
        ._withdraw(
          withdrawAmount,
          addr2.address,
          Constants.GAS_LIMIT_1_000_000
        );
      const rec = await tx.wait();

      const withDrawLog = rec.logs.find((e) => e.fragment.name === 'Withdraw');

      expect(withDrawLog.args[0]).to.eq(addr2.address);
      expect(withDrawLog.args[1]).to.eq(addr2.address);
      expect(withDrawLog.args[2]).to.eq(addr2.address);
      expect(withDrawLog.args[3]).to.eq(redemedAmount);
      expect(withDrawLog.args[4]).to.eq(redemedAmount);

      expect(await tokenVault.totalAssetsOfUser(addr2.address)).to.equal(
        depositAmount - withdrawAmount
      );
    });

    it('Should fail if withdraw is to zero address', async function () {
      expect(
        tokenVault.connect(addr1)._withdraw(1, ethers.ZeroAddress)
      ).to.be.revertedWith('Zero Address');
    });

    it('Should fail if not a shareholder', async function () {
      expect(
        tokenVault.connect(addr2)._withdraw(1, addr2.address)
      ).to.be.revertedWith('Not a shareHolder');
    });

    it('Should fail if not enough shares', async function () {
      const depositAmount = ethers.parseEther('10');
      await asset
        .connect(addr1)
        .approve(await tokenVault.getAddress(), depositAmount);
      await tokenVault.connect(addr1)._deposit(depositAmount);
      expect(
        tokenVault.connect(addr1)._withdraw(depositAmount + 1n, addr1.address)
      ).to.be.revertedWith('Not enough shares');
    });
  });

  describe('Views', function () {
    it('Should return the total assets of a user', async function () {
      const depositAmount = ethers.parseEther('10');
      await asset
        .connect(addr1)
        .approve(await tokenVault.getAddress(), depositAmount);
      await tokenVault.connect(addr1)._deposit(depositAmount);

      expect(await tokenVault.totalAssetsOfUser(addr1.address)).to.equal(
        depositAmount
      );
    });
  });
});
