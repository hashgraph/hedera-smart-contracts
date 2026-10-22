// SPDX-License-Identifier: Apache-2.0

const { expect } = require('chai');
const { ethers } = require('hardhat');
const Constants = require('hedera-examples-test-helpers/constants');

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
    // creation needs ~1.2M gas; a too low limit leaves an empty address behind
    tokenVault = await TokenVault.deploy(
      await asset.getAddress(),
      'MockToken',
      'MTK',
      Constants.GAS_LIMIT_2_000_000
    );
    await tokenVault.waitForDeployment();

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Wait for every transaction: the relay takes the "pending" nonce from the mirror node, so a
    // transaction sent before the previous one is mined reuses its nonce and is never executed.
    await (await asset.mint(addr1.address, ethers.parseUnits('1000', 18))).wait();
    await (await asset.mint(addr2.address, ethers.parseUnits('10', 18))).wait();
  });

  async function deposit(signer, amount) {
    await (
      await asset.connect(signer).approve(await tokenVault.getAddress(), amount)
    ).wait();
    await (await tokenVault.connect(signer)._deposit(amount)).wait();
  }

  describe('Deployment', function () {
    it('Should assign the total supply of tokens to the owner', async function () {
      const ownerBalance = await tokenVault.balanceOf(owner.address);
      expect(await tokenVault.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe('Transactions', function () {
    it('Should deposit tokens and update shareHolders mapping', async function () {
      const depositAmount = ethers.parseEther('10');
      await (
        await asset
          .connect(addr1)
          .approve(await tokenVault.getAddress(), depositAmount)
      ).wait();
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

      await deposit(addr2, depositAmount);

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
      await expect(
        tokenVault.connect(addr1)._withdraw(1, ethers.ZeroAddress)
      ).to.be.revertedWith('Zero Address');
    });

    it('Should fail if not a shareholder', async function () {
      // owner never deposited (addr2 still holds shares from the withdraw test)
      await expect(
        tokenVault.connect(owner)._withdraw(1, owner.address)
      ).to.be.revertedWith('Not a shareHolder');
    });

    it('Should fail if not enough shares', async function () {
      await deposit(addr1, ethers.parseEther('10'));
      const shares = await tokenVault.shareHolders(addr1.address);
      await expect(
        tokenVault.connect(addr1)._withdraw(shares + 1n, addr1.address)
      ).to.be.revertedWith('Not enough shares');
    });
  });

  describe('Views', function () {
    it('Should return the total assets of a user', async function () {
      const depositAmount = ethers.parseEther('10');
      const before = await tokenVault.totalAssetsOfUser(addr1.address);
      await deposit(addr1, depositAmount);

      expect(await tokenVault.totalAssetsOfUser(addr1.address)).to.equal(
        before + depositAmount
      );
    });
  });
});
